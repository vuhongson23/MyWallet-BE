import {
  Controller,
  Get,
  Param,
  Put,
  Request,
  UseGuards,
  Body,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from 'src/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserDto } from 'src/dto/user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('all')
  findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('info')
  getUserInfo(@Request() req): Promise<User | null> {
    return this.userService.getUserInfo(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('info')
  updateUser(@Request() req, @Body() data: UpdateUserDto) {
    return this.userService.updateUser(req.user.id, data);
  }
}
