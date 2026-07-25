import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
import { PageResponse } from '../common/dto/page-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  findAll(query: PaginationQueryDto): Promise<PageResponse<Category>> {
    return this.categoriesRepository.findPaginated(query);
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoriesRepository.findOneById(id);
    if (!category) {
      throw new NotFoundException(`Category #${id} not found`);
    }
    return category;
  }

  create(dto: CreateCategoryDto): Promise<Category> {
    return this.categoriesRepository.save(dto);
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);
    return this.categoriesRepository.save({ ...category, ...dto });
  }

  async remove(id: number): Promise<void> {
    const category = await this.categoriesRepository.findOneWithProducts(id);
    if (!category) {
      throw new NotFoundException(`Category #${id} not found`);
    }
    if (category.products && category.products.length > 0) {
      throw new ConflictException(
        `Category #${id} cannot be deleted because it has associated products`,
      );
    }
    await this.categoriesRepository.remove(category);
  }
}
