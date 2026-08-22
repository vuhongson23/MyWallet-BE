import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCategoryDto, UpdateCategoryDto } from 'src/dto/category.dto';
import { Category } from 'src/entities/category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      order: { type: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOneBy({ id });
    if (!category) throw new NotFoundException('Danh mục không tồn tại');
    return category;
  }

  async create(data: CreateCategoryDto): Promise<Category> {
    const exists = await this.categoryRepository.findOneBy({
      name: data.name,
      type: data.type,
    });
    if (exists) throw new ConflictException('Danh mục đã tồn tại');
    return this.categoryRepository.save(this.categoryRepository.create(data));
  }

  async update(id: number, data?: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    if (!data || Object.keys(data).length === 0) {
      throw new BadRequestException(
        'Vui lòng gửi ít nhất name hoặc type để cập nhật',
      );
    }

    const nextName = data.name ?? category.name;
    const nextType = data.type ?? category.type;

    if (nextName !== category.name || nextType !== category.type) {
      const duplicate = await this.categoryRepository.findOne({
        where: {
          name: nextName,
          type: nextType,
        },
      });
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException('Danh mục đã tồn tại');
      }
    }

    await this.categoryRepository.update(id, {
      name: nextName,
      type: nextType,
    });
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.categoryRepository.delete(id);
  }
}
