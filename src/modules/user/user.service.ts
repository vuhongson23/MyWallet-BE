import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    const result = this.userRepository.find();
    return result;
  }

  getUserInfo(userId: number): Promise<User | null> {
    const result = this.userRepository.findOne({
      where: {
        id: userId,
      },
    });
    return result;
  }
}
