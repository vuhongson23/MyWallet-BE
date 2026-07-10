import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { Transaction } from 'src/entities/transaction.entity';
import { CreateTransactionDto } from 'src/dto/transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionService: TransactionsService) {}

  // @Get()
  // findAll(): Promise<Transaction[]> {
  //   return this.transactionService.findAll();
  // }

  @UseGuards(JwtAuthGuard)
  @Get()
  getAllTransactionByUserId(@Request() req): Promise<Transaction[]> {
    return this.transactionService.findAllTransactionByUser(req.user.id);
  }

  @Get('/recent/:id')
  getRecentTransaction(
    @Param() params: { id: number },
  ): Promise<Transaction[]> {
    return this.transactionService.getRecentTransaction(params.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  createTransaction(@Body() data: CreateTransactionDto, @Request() req) {
    return this.transactionService.createTransaction(data, req.user.id);
  }
}
