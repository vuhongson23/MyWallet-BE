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
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly dataSource: DataSource, // thêm dòng này
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
      });

      if (!user) {
        throw new UnauthorizedException('User không tồn tại');
      }

      if (!wallet) {
        throw new UnauthorizedException('Ví không tồn tại');
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
}
