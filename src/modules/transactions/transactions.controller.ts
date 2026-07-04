import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { Transaction } from 'src/entities/transaction.entity';
import { CreateTransactionDto } from 'src/dto/transaction.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionService: TransactionsService) {}

  @Get()
  findAll(): Promise<Transaction[]> {
    return this.transactionService.findAll();
  }

  @Get('/recent/:id')
  getRecentTransaction(
    @Param() params: { id: number },
  ): Promise<Transaction[]> {
    return this.transactionService.getRecentTransaction(params.id);
  }

  @Post()
  createTransaction(@Body() data: CreateTransactionDto) {
    return this.transactionService.createTransaction(data);
  }
}
