import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Vui lòng nhập tên người dùng' })
  name: string;

  @IsNotEmpty({ message: 'Vui lòng nhập email' })
  @IsEmail()
  email: string;

  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu' })
  password: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
