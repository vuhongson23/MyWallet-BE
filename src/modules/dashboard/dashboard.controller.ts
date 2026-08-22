import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResposeType } from 'src/types/response';
import { Wallet } from 'src/entities/wallet.entity';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/summary')
  getSummary(@Request() req): Promise<ResposeType<Wallet>> {
    return this.dashboardService.getSummary(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/spending-by-category')
  getSpendingByCategory(@Request() req) {
    return this.dashboardService.getSpendingByCategory(req.user.id);
  }
}
