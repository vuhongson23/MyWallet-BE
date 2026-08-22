import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateWalletDto, UpdateWalletDto } from 'src/dto/wallet.dto';
import { Transaction } from 'src/entities/transaction.entity';
import { User } from 'src/entities/user.entity';
import { Wallet } from 'src/entities/wallet.entity';
import { ResposeType } from 'src/types/response';
import { DataSource, QueryFailedError, Repository } from 'typeorm';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private dataSource: DataSource,
  ) {}

  async getAllWalletByUserId(userId: number): Promise<ResposeType<Wallet[]>> {
    try {
      const response = await this.walletRepository.find({
        where: {
          userId,
          isActive: true,
        },
      });

      return {
        code: 200,
        data: response,
        message: 'Lấy danh sách ví thành công',
      };
    } catch (error) {
      throw new HttpException(
        'Lấy danh sách ví thất bại',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async createWallet(
    data: CreateWalletDto,
    userId: number,
  ): Promise<ResposeType<Wallet>> {
    if (!userId) {
      throw new UnauthorizedException('Người dùng không hợp lệ');
    }

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newWallet = queryRunner.manager.create(Wallet, {
        ...data,
        userId,
      });

      const result = await queryRunner.manager.save(Wallet, newWallet);

      // Chỉ cộng dồn vào ví tổng tài sản nếu ví vừa tạo KHÔNG PHẢI là ví tổng tài sản
      // (tránh cộng 2 lần lên chính nó)
      if (!result.isDefault && data.balance) {
        const defaultWallet = await queryRunner.manager.findOneBy(Wallet, {
          userId,
          isDefault: true,
        });

        if (!defaultWallet) {
          throw new InternalServerErrorException(
            'Không tìm thấy ví tổng tài sản của người dùng',
          );
        }

        await queryRunner.manager.increment(
          Wallet,
          { id: defaultWallet.id },
          'balance',
          data.balance,
        );
        await queryRunner.manager.increment(
          Wallet,
          { id: defaultWallet.id },
          'totalIncome',
          data.balance,
        );
      }

      await queryRunner.commitTransaction();

      return {
        code: 201,
        data: result,
        message: 'Tạo ví thành công',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (
        error instanceof QueryFailedError &&
        (error as any).code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException('Tên ví này đã tồn tại');
      }

      console.error('createWallet error:', error);
      throw new InternalServerErrorException(
        'Không thể tạo ví, vui lòng thử lại',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async getWallet(
    walletId: number,
    userId: number,
  ): Promise<ResposeType<Wallet>> {
    const wallet = await this.walletRepository.findOneBy({
      id: walletId,
      userId,
      isActive: true,
    });
    if (!wallet) throw new NotFoundException('Ví không tồn tại');
    return { code: 200, data: wallet, message: 'Lấy thông tin ví thành công' };
  }

  async updateWallet(
    walletId: number,
    userId: number,
    data: UpdateWalletDto,
  ): Promise<ResposeType<Wallet>> {
    const wallet = await this.walletRepository.findOneBy({
      id: walletId,
      userId,
      isActive: true,
    });
    if (!wallet) throw new NotFoundException('Ví không tồn tại');
    Object.assign(wallet, data);
    try {
      const saved = await this.walletRepository.save(wallet);
      return { code: 200, data: saved, message: 'Cập nhật ví thành công' };
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as any).code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException('Tên ví này đã tồn tại');
      }
      throw error;
    }
  }

  async deleteWallet(
    walletId: number,
    userId: number,
  ): Promise<ResposeType<null>> {
    const currentWallet = await this.walletRepository.findOneBy({
      id: walletId,
    });

    if (!currentWallet) {
      throw new NotFoundException('Ví không tồn tại!');
    }

    if (currentWallet.userId !== userId) {
      throw new UnauthorizedException('Bạn không có quyền xoá ví này');
    }

    if (currentWallet.isDefault) {
      throw new HttpException(
        'Không thể xoá ví tổng tài sản',
        HttpStatus.BAD_REQUEST,
      );
    }

    const transactionCount = await this.transactionRepository.count({
      where: { walletId },
    });

    if (transactionCount > 0) {
      // throw new HttpException(
      //   'Ví đã tồn tại giao dịch không thể xoá!',
      //   HttpStatus.BAD_REQUEST,
      // );
      await this.walletRepository.update(walletId, { isActive: false });

      return {
        code: 200,
        data: null,
        message: `Ví ${currentWallet.name} đã được lưu trữ (còn ${transactionCount} nên không thể xoá vĩnh viễn)`,
      };
    }

    await this.walletRepository.delete(walletId);

    return {
      code: 200,
      data: null,
      message: `Xoá ví ${currentWallet?.name} thành công`,
    };
  }
}
