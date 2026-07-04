import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from 'src/entities/user.entity';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('all')
  findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Get('info/:userId')
  getUserInfo(@Param() param): Promise<User | null> {
    const { userId } = param;
    return this.userService.getUserInfo(userId);
  }
}
