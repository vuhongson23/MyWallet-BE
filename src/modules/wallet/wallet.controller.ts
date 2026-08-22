import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Get,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateWalletDto, UpdateWalletDto } from 'src/dto/wallet.dto';
import { ResposeType } from 'src/types/response';
import { Wallet } from 'src/entities/wallet.entity';

@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getAll(@Request() req): Promise<ResposeType<Wallet[]>> {
    return this.walletService.getAllWalletByUserId(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:id')
  getOne(
    @Request() req,
    @Param('id') id: string,
  ): Promise<ResposeType<Wallet>> {
    return this.walletService.getWallet(Number(id), req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  createWallet(
    @Body() data: CreateWalletDto,
    @Request() req,
  ): Promise<ResposeType<Wallet>> {
    return this.walletService.createWallet(data, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/:id')
  deleteWallet(
    @Request() req,
    @Param('id') id: string,
  ): Promise<ResposeType<null>> {
    return this.walletService.deleteWallet(Number(id), req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('/:id')
  updateWallet(
    @Request() req,
    @Param('id') id: string,
    @Body() data: UpdateWalletDto,
  ) {
    return this.walletService.updateWallet(Number(id), req.user.id, data);
  }
}
