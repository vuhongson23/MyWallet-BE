import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateWalletDto } from 'src/dto/wallet.dto';
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
    private dataSource: DataSource,
  ) {}

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
}
