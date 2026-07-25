import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { PageResponse } from '../common/dto/page-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Injectable()
export class CategoriesRepository {
  constructor(
    @InjectRepository(Category)
    private readonly repo: Repository<Category>,
  ) {}

  async findPaginated(query: PaginationQueryDto): Promise<PageResponse<Category>> {
    const { page, limit, sortBy, order } = query;
    const skip = (page - 1) * limit;

    const [items, total] = await this.repo.findAndCount({
      skip,
      take: limit,
      order: sortBy ? { [sortBy]: order } : { id: 'ASC' },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  findOneById(id: number): Promise<Category | null> {
    return this.repo.findOne({ where: { id } });
  }

  findOneWithProducts(id: number): Promise<Category | null> {
    return this.repo.findOne({ where: { id }, relations: ['products'] });
  }

  save(category: Partial<Category>): Promise<Category> {
    return this.repo.save(category);
  }

  async remove(category: Category): Promise<void> {
    await this.repo.remove(category);
  }
}
