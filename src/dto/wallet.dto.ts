import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateWalletDto {
  @IsNotEmpty({ message: 'Tên ví không được để trống' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsNotEmpty({ message: 'Số dư không được để trống' })
  @IsNumber()
  balance!: number;

  @IsOptional()
  description?: string;
}
