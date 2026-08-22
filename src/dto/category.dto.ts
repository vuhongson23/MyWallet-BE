import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { TransactionType } from 'src/types/transaction';

export class CreateCategoryDto {
  @IsNotEmpty({ message: 'Tên danh mục không được để trống' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsEnum(TransactionType, { message: 'Type phải là expense hoặc income' })
  type!: TransactionType;
}
