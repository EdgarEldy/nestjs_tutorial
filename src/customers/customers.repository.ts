import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageResponse } from '../common/dto/page-response.dto';
import { SortOrder } from '../common/dto/pagination-query.dto';
import { CustomerFilterDto } from './dto/customer-filter.dto';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomersRepository {
  constructor(
    @InjectRepository(Customer)
    private readonly repo: Repository<Customer>,
  ) {}

  async findPaginated(query: CustomerFilterDto): Promise<PageResponse<Customer>> {
    const { page, limit, sortBy, order, search } = query;
    const skip = (page - 1) * limit;

    const qb = this.repo.createQueryBuilder('customer');

    if (search) {
      const term = `%${search}%`;
      qb.where(
        'customer.first_name ILIKE :term OR customer.last_name ILIKE :term OR customer.email ILIKE :term',
        { term },
      );
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

  findOneById(id: number): Promise<Customer | null> {
    return this.repo.findOne({ where: { id } });
  }

  findOneWithOrders(id: number): Promise<Customer | null> {
    return this.repo.findOne({ where: { id }, relations: ['orders'] });
  }

  findByEmail(email: string): Promise<Customer | null> {
    return this.repo.findOne({ where: { email } });
  }

  save(customer: Partial<Customer>): Promise<Customer> {
    return this.repo.save(customer);
  }

  async remove(customer: Customer): Promise<void> {
    await this.repo.remove(customer);
  }

  private resolveSortColumn(sortBy?: string): string {
    switch (sortBy) {
      case 'first_name':
        return 'customer.first_name';
      case 'last_name':
        return 'customer.last_name';
      case 'email':
        return 'customer.email';
      default:
        return 'customer.id';
    }
  }
}
