import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Delete,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { Transaction } from 'src/entities/transaction.entity';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
} from 'src/dto/transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionService: TransactionsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/all')
  getAllTransactions(): Promise<Transaction[]> {
    return this.transactionService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('/user/:userId')
  getAllTransactionsByUserId(
    @Param('userId', ParseIntPipe) userId: number,
    @Request() req,
  ): Promise<Transaction[]> {
    if (userId !== req.user.id) {
      throw new UnauthorizedException(
        'Bạn không có quyền xem giao dịch của người dùng khác',
      );
    }
    return this.transactionService.findAllTransactionByUser(userId);
  }

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
  @Put('/:id')
  updateTransaction(
    @Param('id') id: string,
    @Body() data: UpdateTransactionDto,
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
