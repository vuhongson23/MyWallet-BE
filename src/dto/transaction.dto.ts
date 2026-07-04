import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { TransactionType } from 'src/types/transaction';

export class CreateTransactionDto {
  @IsNotEmpty({ message: 'Vui lòng nhập tiêu đề' })
  title: string;

  @IsEnum(TransactionType, { message: 'Type phải là expense hoặc income' })
  type: TransactionType;

  @IsNumber()
  @Min(1, { message: 'Số tiền phải lớn hơn 0' })
  amount: number;

  @IsNumber({}, { message: 'categoryId không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng chọn 1 danh mục' })
  categoryId: number;

  @IsNumber({}, { message: 'userId không hợp lệ' })
  @IsNotEmpty({ message: 'userId không được trống' })
  userId: number;

  @IsDateString({}, { message: 'Ngày giao dịch không hợp lệ' })
  transactionDate: string;

  @IsOptional()
  @IsString()
  note?: string;
}
