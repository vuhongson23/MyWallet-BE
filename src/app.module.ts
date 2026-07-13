import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './modules/user/user.module';
import { Transaction } from './entities/transaction.entity';
import { Category } from './entities/category.entity';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { AuthModule } from './modules/auth/auth.module';
import { Wallet } from './entities/wallet.entity';
import { WalletModule } from './modules/wallet/wallet.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql', // Loại DB: mysql, postgres,...
      host: process.env.DB_HOST,
      port: Number(process.env.PORT_DB),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [User, Transaction, Category, Wallet], // Danh sách các entities ánh xạ
      synchronize: true, // Tự động tạo bảng từ entity (chỉ dùng trong dev)
    }),
    UserModule,
    TransactionsModule,
    AuthModule,
    WalletModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
