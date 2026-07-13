import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTransactionDto } from 'src/dto/transaction.dto';
import { Transaction } from 'src/entities/transaction.entity';
import { User } from 'src/entities/user.entity';
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
      if (!user) {
        throw new UnauthorizedException('User không tồn tại');
      }

      const balanceChange = data.type === 'income' ? data.amount : -data.amount;

      await queryRunner.manager.increment(
        User,
        { id: userId },
        'balance',
        balanceChange,
      );

      if (data.type === 'expense') {
        await queryRunner.manager.increment(
          User,
          { id: userId },
          'totalExpense',
          data.amount,
        );
      } else {
        await queryRunner.manager.increment(
          User,
          { id: userId },
          'totalIncome',
          data.amount,
        );
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
