import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTransactionDto } from 'src/dto/transaction.dto';
import { Transaction } from 'src/entities/transaction.entity';
import { User } from 'src/entities/user.entity';
import { Wallet } from 'src/entities/wallet.entity';
import { Category } from 'src/entities/category.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly dataSource: DataSource,
  ) {}

  findAll(): Promise<Transaction[]> {
    const result = this.transactionRepository.find({
      relations: {
        category: true,
      },
    });
    return result;
  }

  findAllTransactionByUser(userId: number): Promise<Transaction[]> {
    const result = this.transactionRepository.find({
      where: {
        userId,
      },
      relations: { category: true },
    });
    return result;
  }

  getRecentTransaction(userId: number): Promise<Transaction[]> {
    const result = this.transactionRepository.find({
      where: {
        userId,
      },
      take: 5,
      order: { createdAt: 'DESC' },
      relations: { category: true },
    });
    return result;
  }

  async createTransaction(
    data: CreateTransactionDto,
    userId: number,
  ): Promise<Transaction> {
    if (!userId) {
      throw new UnauthorizedException('userId không hợp lệ');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOneBy(User, { id: userId });
      const wallet = await queryRunner.manager.findOneBy(Wallet, {
        id: data.walletId,
        userId,
        isActive: true,
      });
      const category = await queryRunner.manager.findOneBy(Category, {
        id: data.categoryId,
      });

      if (!user) {
        throw new UnauthorizedException('User không tồn tại');
      }

      if (!wallet) {
        throw new UnauthorizedException('Ví không tồn tại');
      }

      if (!category) {
        throw new HttpException(
          'Danh mục không tồn tại',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (data.amount < 0) {
        throw new HttpException(
          'Số tiền phải lớn hơn 0',
          HttpStatus.BAD_REQUEST,
        );
      }

      const balanceChange = data.type === 'income' ? data.amount : -data.amount;

      if (wallet?.isDefault) {
        await queryRunner.manager.increment(
          Wallet,
          { id: data.walletId },
          'balance',
          balanceChange,
        );
        if (data.type === 'expense') {
          await queryRunner.manager.increment(
            Wallet,
            { id: data.walletId },
            'totalExpense',
            data.amount,
          );
        } else {
          await queryRunner.manager.increment(
            Wallet,
            { id: data.walletId },
            'totalIncome',
            data.amount,
          );
        }
      } else {
        await queryRunner.manager.increment(
          Wallet,
          { id: data.walletId },
          'balance',
          balanceChange,
        );

        await queryRunner.manager.increment(
          Wallet,
          { userId, isDefault: true },
          'balance',
          balanceChange,
        );

        if (data.type === 'expense') {
          await queryRunner.manager.increment(
            Wallet,
            { id: data.walletId },
            'totalExpense',
            data.amount,
          );

          await queryRunner.manager.increment(
            Wallet,
            { userId, isDefault: true },
            'totalExpense',
            data.amount,
          );
        } else {
          await queryRunner.manager.increment(
            Wallet,
            { id: data.walletId },
            'totalIncome',
            data.amount,
          );
          await queryRunner.manager.increment(
            Wallet,
            { userId, isDefault: true },
            'totalIncome',
            data.amount,
          );
        }
      }

      const transaction = queryRunner.manager.create(Transaction, {
        ...data,
        userId,
      });
      const saved = await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();
      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction(); // nếu bất kỳ bước nào lỗi, huỷ toàn bộ
      throw error;
    } finally {
      await queryRunner.release(); // luôn giải phóng connection dù thành công hay lỗi
    }
  }

  async updateTransaction(
    id: number,
    data: CreateTransactionDto,
    userId: number,
  ): Promise<Transaction> {
    const existing = await this.transactionRepository.findOneBy({ id, userId });
    if (!existing)
      throw new HttpException('Giao dịch không tồn tại', HttpStatus.NOT_FOUND);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const wallet = await queryRunner.manager.findOneBy(Wallet, {
        id: data.walletId,
        userId,
        isActive: true,
      });
      const category = await queryRunner.manager.findOneBy(Category, {
        id: data.categoryId,
      });
      if (!wallet) throw new UnauthorizedException('Ví không tồn tại');
      if (!category)
        throw new HttpException(
          'Danh mục không tồn tại',
          HttpStatus.BAD_REQUEST,
        );
      await this.applyBalance(
        queryRunner.manager,
        existing.walletId,
        userId,
        existing.type,
        -existing.amount,
      );
      await this.applyBalance(
        queryRunner.manager,
        data.walletId,
        userId,
        data.type,
        data.amount,
      );
      Object.assign(existing, data, { userId });
      const saved = await queryRunner.manager.save(existing);
      await queryRunner.commitTransaction();
      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteTransaction(id: number, userId: number): Promise<void> {
    const existing = await this.transactionRepository.findOneBy({ id, userId });
    if (!existing)
      throw new HttpException('Giao dịch không tồn tại', HttpStatus.NOT_FOUND);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await this.applyBalance(
        queryRunner.manager,
        existing.walletId,
        userId,
        existing.type,
        -existing.amount,
      );
      await queryRunner.manager.delete(Transaction, id);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async applyBalance(
    manager: any,
    walletId: number,
    userId: number,
    type: string,
    amount: number,
  ) {
    const signedAmount = type === 'income' ? amount : -amount;
    await manager.increment(
      Wallet,
      { id: walletId, userId },
      'balance',
      signedAmount,
    );
    const totalColumn = type === 'income' ? 'totalIncome' : 'totalExpense';
    await manager.increment(
      Wallet,
      { id: walletId, userId },
      totalColumn,
      amount,
    );
    const wallet = await manager.findOneBy(Wallet, { id: walletId, userId });
    if (wallet && !wallet.isDefault) {
      await manager.increment(
        Wallet,
        { userId, isDefault: true },
        'balance',
        signedAmount,
      );
      await manager.increment(
        Wallet,
        { userId, isDefault: true },
        totalColumn,
        amount,
      );
    }
  }
}
