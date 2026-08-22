import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Wallet } from 'src/entities/wallet.entity';
import { Transaction } from 'src/entities/transaction.entity';
import { ResposeType } from 'src/types/response';
import { Repository } from 'typeorm';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
  ) {}

  async getSummary(userId: number): Promise<ResposeType<Wallet>> {
    try {
      const defaultWallet = await this.walletRepo.findOne({
        where: { userId, isDefault: true, isActive: true },
      });

      if (!defaultWallet) {
        throw new HttpException(
          'Không tìm thấy ví tổng tài sản',
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        code: 200,
        data: defaultWallet,
        message: 'Lấy ví mặc định thành công',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Lấy thông tin ví tổng tài sản thất bại',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getSpendingByCategory(userId: number) {
    const rows = await this.transactionRepo
      .createQueryBuilder('transaction')
      .leftJoin('transaction.category', 'category')
      .select('transaction.categoryId', 'categoryId')
      .addSelect('category.name', 'categoryName')
      .addSelect('SUM(transaction.amount)', 'total')
      .where('transaction.userId = :userId', { userId })
      .andWhere('transaction.type = :type', { type: 'expense' })
      .groupBy('transaction.categoryId')
      .addGroupBy('category.name')
      .orderBy('total', 'DESC')
      .getRawMany();

    return {
      code: 200,
      data: rows,
      message: 'Lấy chi tiêu theo danh mục thành công',
    };
  }
}
