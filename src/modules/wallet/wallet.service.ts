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
import { QueryFailedError, Repository } from 'typeorm';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createWallet(
    data: CreateWalletDto,
    userId: number,
  ): Promise<ResposeType<Wallet>> {
    if (!userId) {
      throw new UnauthorizedException('Người dùng không hợp lệ');
    }

    // Đảm bảo user tồn tại trước khi tạo ví (tránh lỗi FK khó hiểu)
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    try {
      const walletSaved = this.walletRepository.create({
        ...data,
        userId,
      });

      const result = await this.walletRepository.save(walletSaved);

      return {
        code: 201,
        data: result,
        message: 'Tạo ví thành công',
      };
    } catch (error) {
      // Bắt lỗi trùng key (VD: unique constraint tên ví + userId)
      if (
        error instanceof QueryFailedError &&
        (error as any).code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException('Tên ví này đã tồn tại');
      }

      // Log lỗi thực tế để debug, không throw error gốc ra ngoài cho client
      console.error('createWallet error:', error);
      throw new InternalServerErrorException(
        'Không thể tạo ví, vui lòng thử lại',
      );
    }
  }
}
