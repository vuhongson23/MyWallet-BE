import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { UpdateUserDto } from 'src/dto/user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  getUserInfo(userId: number): Promise<User | null> {
    const result = this.userRepository.findOne({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        created_at: true,
        updated_at: true,
        wallets: true,
      },
      relations: {
        wallets: true,
      },
    });
    return result;
  }

  async updateUser(
    userId: number,
    data: UpdateUserDto,
  ): Promise<Partial<User> | null> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) return null;
    Object.assign(user, data);
    const saved = await this.userRepository.save(user);
    const { password, refreshToken, ...publicUser } = saved;
    return publicUser;
  }
}
