import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from 'src/dto/user.dto';
import { User } from 'src/entities/user.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { loginDto } from 'src/dto/auth.dto';
import { Wallet } from 'src/entities/wallet.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private dataSource: DataSource,
  ) {}

  private async generateToken(
    userId: number,
    email: string,
    manager?: EntityManager, // truyền vào khi đang trong transaction
  ): Promise<object> {
    const payload = { sub: userId, email };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '1h',
      secret: this.configService.get('SECRET_KEY'),
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '1d',
      secret: this.configService.get('SECRET_KEY'),
    });

    // Dùng manager của transaction nếu có, không thì dùng repository mặc định
    const repo = manager ? manager.getRepository(User) : this.userRepository;

    await repo.update(
      { id: payload.sub, email: payload.email },
      { refreshToken },
    );

    return { refreshToken, accessToken };
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
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const isExistedEmai = await queryRunner.manager.findOneBy(User, {
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

      // Dùng queryRunner.manager để nằm trong transaction
      const savedUser = await queryRunner.manager.save(User, userData);
      const { password, ...userWithoutPassword } = savedUser;

      // Tạo ví mặc định "Tổng tài sản" cho user vừa tạo
      await queryRunner.manager.save(Wallet, {
        name: 'Tổng tài sản',
        balance: 0,
        totalExpense: 0,
        totalIncome: 0,
        description: 'Save all your money',
        isDefault: true,
        userId: userWithoutPassword.id, // hoặc userId: userWithoutPassword.id, tuỳ tên cột FK trong entity Wallet
      });

      const token = await this.generateToken(
        userWithoutPassword.id,
        userWithoutPassword.email,
        queryRunner.manager,
      );
      if (!token) {
        throw new HttpException(
          'Đã có lỗi xảy ra trong quá trình đăng ký',
          HttpStatus.BAD_REQUEST,
        );
      }

      await queryRunner.commitTransaction();

      return {
        code: 200,
        token,
        user: userWithoutPassword,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return error;
    } finally {
      await queryRunner.release();
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

      const { password, refreshToken, ...userWithoutPassword } = user;

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
