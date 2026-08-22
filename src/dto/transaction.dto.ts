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

  @IsDateString({}, { message: 'Ngày giao dịch không hợp lệ' })
  transactionDate: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsNumber({}, { message: 'walletId không hợp lệ' })
  walletId: number;
}

export class UpdateTransactionDto {
  @IsOptional()
  @IsNotEmpty({ message: 'Vui lòng nhập tiêu đề' })
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(TransactionType, { message: 'Type phải là expense hoặc income' })
  type?: TransactionType;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Số tiền phải lớn hơn 0' })
  amount?: number;

  @IsOptional()
  @IsNumber({}, { message: 'categoryId không hợp lệ' })
  categoryId?: number;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày giao dịch không hợp lệ' })
  transactionDate?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsNumber({}, { message: 'walletId không hợp lệ' })
  walletId?: number;
}
