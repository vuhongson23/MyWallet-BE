import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
@Unique(['userId', 'name']) // 1 user không được tạo 2 ví trùng tên
export class Wallet {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  name: string;

  @Column({ default: 0 })
  balance: number;

  @Column({ default: 0 })
  totalExpense: number;

  @Column({ default: 0 })
  totalIncome: number;

  @Column({ nullable: true })
  description?: string;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ default: false })
  isDefault: boolean; // TRUE = ví tổng tài sản

  @ManyToOne(() => User, (user) => user.wallets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
