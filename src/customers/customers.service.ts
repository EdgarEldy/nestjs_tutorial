import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PageResponse } from '../common/dto/page-response.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerFilterDto } from './dto/customer-filter.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './entities/customer.entity';
import { CustomersRepository } from './customers.repository';

@Injectable()
export class CustomersService {
  constructor(private readonly customersRepository: CustomersRepository) {}

  findAll(query: CustomerFilterDto): Promise<PageResponse<Customer>> {
    return this.customersRepository.findPaginated(query);
  }

  async findOne(id: number): Promise<Customer> {
    const customer = await this.customersRepository.findOneById(id);
    if (!customer) {
      throw new NotFoundException(`Customer #${id} not found`);
    }
    return customer;
  }

  async create(dto: CreateCustomerDto): Promise<Customer> {
    const existing = await this.customersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(`Email ${dto.email} is already in use`);
    }
    return this.customersRepository.save(dto);
  }

  async update(id: number, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);
    if (dto.email !== undefined && dto.email !== customer.email) {
      const conflict = await this.customersRepository.findByEmail(dto.email);
      if (conflict) {
        throw new ConflictException(`Email ${dto.email} is already in use`);
      }
    }
    return this.customersRepository.save({ ...customer, ...dto });
  }

  async remove(id: number): Promise<void> {
    const customer = await this.customersRepository.findOneWithOrders(id);
    if (!customer) {
      throw new NotFoundException(`Customer #${id} not found`);
    }
    if (customer.orders && customer.orders.length > 0) {
      throw new ConflictException(
        `Customer #${id} cannot be deleted because they have associated orders`,
      );
    }
    await this.customersRepository.remove(customer);
  }
}
