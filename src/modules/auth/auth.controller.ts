import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/dto/user.dto';
import { loginDto } from 'src/dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  async register(@Body() payload: CreateUserDto) {
    return this.authService.register(payload);
  }

  @Post('login')
  async login(@Body() payload: loginDto) {
    return this.authService.login(payload);
  }
}
