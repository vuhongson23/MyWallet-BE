import { IsNotEmpty } from 'class-validator';

export class loginDto {
  @IsNotEmpty({ message: 'Vui lòng nhập email' })
  email!: string;

  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu' })
  password!: string;
}
