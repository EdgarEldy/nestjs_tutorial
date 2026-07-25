import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { PageResponse } from '../common/dto/page-response.dto';
import { SortOrder } from '../common/dto/pagination-query.dto';
import { ProductFilterDto } from './dto/product-filter.dto';

@Injectable()
export class ProductsRepository {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
  ) {}

  async findPaginated(query: ProductFilterDto): Promise<PageResponse<Product>> {
    const { page, limit, sortBy, order, categoryId } = query;
    const skip = (page - 1) * limit;

    const qb = this.repo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    if (categoryId) {
      qb.where('category.id = :categoryId', { categoryId });
    }

    const sortColumn = this.resolveSortColumn(sortBy);
    qb.orderBy(sortColumn, order ?? SortOrder.ASC)
      .skip(skip)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
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

  findOneById(id: number): Promise<Product | null> {
    return this.repo.findOne({ where: { id }, relations: ['category'] });
  }

  findOneWithOrders(id: number): Promise<Product | null> {
    return this.repo.findOne({ where: { id }, relations: ['orders'] });
  }

  save(product: Partial<Product>): Promise<Product> {
    return this.repo.save(product);
  }

  async remove(product: Product): Promise<void> {
    await this.repo.remove(product);
  }

  private resolveSortColumn(sortBy?: string): string {
    switch (sortBy) {
      case 'product_name':
        return 'product.product_name';
      case 'unit_price':
        return 'product.unit_price';
      default:
        return 'product.id';
    }
  }
}
