import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageResponse } from '../common/dto/page-response.dto';
import { SortOrder } from '../common/dto/pagination-query.dto';
import { OrderFilterDto } from './dto/order-filter.dto';
import { Order } from './entities/order.entity';

@Injectable()
export class OrdersRepository {
  constructor(
    @InjectRepository(Order)
    private readonly repo: Repository<Order>,
  ) {}

  async findPaginated(query: OrderFilterDto): Promise<PageResponse<Order>> {
    const { page, limit, sortBy, order, customerId, productId } = query;
    const skip = (page - 1) * limit;

    const qb = this.repo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.product', 'product');

    if (customerId) {
      qb.andWhere('customer.id = :customerId', { customerId });
    }

    if (productId) {
      qb.andWhere('product.id = :productId', { productId });
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

  findOneById(id: number): Promise<Order | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['customer', 'product'],
    });
  }

  findByCustomerId(customerId: number): Promise<Order[]> {
    return this.repo.find({
      where: { customer: { id: customerId } },
      relations: ['customer', 'product'],
      order: { id: 'ASC' },
    });
  }

  save(order: Partial<Order>): Promise<Order> {
    return this.repo.save(order);
  }

  async remove(order: Order): Promise<void> {
    await this.repo.remove(order);
  }

  private resolveSortColumn(sortBy?: string): string {
    switch (sortBy) {
      case 'quantity':
        return 'order.quantity';
      case 'total':
        return 'order.total';
      default:
        return 'order.id';
    }
  }
}
