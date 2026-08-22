import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Post,
} from '@nestjs/common';
import { CreateCategoryDto, UpdateCategoryDto } from 'src/dto/category.dto';
import { Category } from 'src/entities/category.entity';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll(): Promise<Category[]> {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Category> {
    return this.categoriesService.findOne(Number(id));
  }

  @Post()
  create(@Body() data: CreateCategoryDto): Promise<Category> {
    return this.categoriesService.create(data);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() data: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoriesService.update(Number(id), data);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
  ): Promise<{ code: number; message: string }> {
    await this.categoriesService.remove(Number(id));
    return { code: 200, message: 'Xoá danh mục thành công' };
  }
}
