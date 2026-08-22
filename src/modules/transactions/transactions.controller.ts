import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Delete,
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

  @UseGuards(JwtAuthGuard)
  @Get('/recent')
  getRecentTransaction(@Request() req): Promise<Transaction[]> {
    return this.transactionService.getRecentTransaction(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  createTransaction(@Body() data: CreateTransactionDto, @Request() req) {
    return this.transactionService.createTransaction(data, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/:id')
  updateTransaction(
    @Param('id') id: string,
    @Body() data: CreateTransactionDto,
    @Request() req,
  ) {
    return this.transactionService.updateTransaction(
      Number(id),
      data,
      req.user.id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/:id')
  async deleteTransaction(@Param('id') id: string, @Request() req) {
    await this.transactionService.deleteTransaction(Number(id), req.user.id);
    return { code: 200, message: 'Xoá giao dịch thành công' };
  }
}
