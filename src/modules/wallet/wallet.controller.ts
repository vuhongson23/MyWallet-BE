import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateWalletDto } from 'src/dto/wallet.dto';
import { ResposeType } from 'src/types/response';
import { Wallet } from 'src/entities/wallet.entity';

@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createWallet(
    @Body() data: CreateWalletDto,
    @Request() req,
  ): Promise<ResposeType<Wallet>> {
    return this.walletService.createWallet(data, req.user.id);
  }
}
