import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from 'src/dto/user.dto';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { loginDto } from 'src/dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private async generateToken(userId: number, email: string): Promise<object> {
    const payload = {
      sub: userId,
      email,
    };
    // Tạo access token
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '1h',
      secret: this.configService.get('SECRET_KEY'),
    });
    // Tạo refresh token
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '1d',
      secret: this.configService.get('SECRET_KEY'),
    });

    await this.userRepository.update(
      {
        id: payload.sub,
        email: payload.email,
      },
      { refreshToken },
    );

    return {
      refreshToken,
      accessToken,
    };
  }

  private async refreshAccessToken(refreshToken: string) {
    try {
      const verify: {
        sub: number;
        email: string;
      } = await this.jwtService.verify(refreshToken, {
        secret: this.configService.get('SECRET_TOKEN'),
      });
      const userVerified = this.userRepository.findOneBy({
        id: verify.sub,
        email: verify.email,
      });
      if (!userVerified) {
        throw new HttpException(
          'Invalid refresh token',
          HttpStatus.BAD_REQUEST,
        );
      }
      const token = await this.generateToken(verify.sub, verify.email);
      return token;
    } catch (error) {
      throw new HttpException('Invalid refresh token', HttpStatus.BAD_REQUEST);
    }
  }

  async verify(payload: { id: number }) {
    try {
      const user = await this.userRepository.findOneBy({ id: payload.id });
      if (!user) {
        throw new HttpException(
          'Tài khoản/Mật khẩu không chính xác',
          HttpStatus.UNAUTHORIZED,
        );
      }
      if (user.isActive === false) {
        throw new HttpException('Tài khoản đã bị khoá', HttpStatus.FORBIDDEN);
      }
      return { code: 200 };
    } catch (error) {
      return error;
    }
  }

  async register(payload: CreateUserDto) {
    try {
      const isExistedEmai = await this.userRepository.findOneBy({
        email: payload.email,
      });

      if (isExistedEmai) {
        throw new HttpException('Email đã tồn tại', HttpStatus.BAD_REQUEST);
      }
      const saltOrRound = 10;
      const hassPass = await bcrypt.hash(payload.password, saltOrRound);

      const userData = {
        ...payload,
        password: hassPass,
        isActive: true,
      };

      const { password, ...userWithoutPassword } =
        await this.userRepository.save(userData);

      if (userWithoutPassword) {
        const token = await this.generateToken(
          userWithoutPassword.id,
          userWithoutPassword.email,
        );
        if (!token) {
          throw new HttpException(
            'Đã có lỗi xảy ra trong quá trình đăng ký',
            HttpStatus.BAD_REQUEST,
          );
        }
        return {
          code: 200,
          token,
          user: userWithoutPassword,
        };
      }
    } catch (error) {
      return error;
    }
  }

  async login(payload: loginDto) {
    try {
      const user = await this.userRepository.findOneBy({
        email: payload.email,
      });

      if (!user) {
        throw new HttpException(
          'Tài khoản/Mật khẩu không chính xác',
          HttpStatus.UNAUTHORIZED,
        );
      }

      if (user.isActive === false) {
        throw new HttpException('Tài khoản đã bị khoá', HttpStatus.FORBIDDEN);
      }

      const decode = await bcrypt.compare(payload.password, user.password);

      if (!decode) {
        throw new HttpException(
          'Tài khoản/Mật khẩu không chính xác',
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Tạo token
      const token = await this.generateToken(user.id, user.email);

      const { password, ...userWithoutPassword } = user;

      const respon = {
        user: userWithoutPassword,
        code: 200,
        token,
      };

      return respon;
    } catch (error) {
      return error;
    }
  }

  async refreshToken(refreshToken: string): Promise<any> {
    try {
      const token = await this.refreshAccessToken(refreshToken);
      return token;
    } catch (error) {
      return error;
    }
  }
}
