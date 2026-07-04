import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTransactionDto } from 'src/dto/transaction.dto';
import { Transaction } from 'src/entities/transaction.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  findAll(): Promise<Transaction[]> {
    const result = this.transactionRepository.find({
      relations: {
        category: true,
      },
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

  createTransaction(data: CreateTransactionDto): any {
    const transaction = this.transactionRepository.create(data);
    return this.transactionRepository.save(transaction);
  }
}
