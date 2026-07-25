import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderCreatedEvent } from '../common/events/order-created.event';
import { CustomersService } from '../customers/customers.service';
import { ProductsService } from '../products/products.service';
import { PageResponse } from '../common/dto/page-response.dto';
import { Customer } from '../customers/entities/customer.entity';
import { Product } from '../products/entities/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderFilterDto } from './dto/order-filter.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './entities/order.entity';
import { OrdersRepository } from './orders.repository';

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly customersService: CustomersService,
    private readonly productsService: ProductsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  findAll(query: OrderFilterDto): Promise<PageResponse<Order>> {
    return this.ordersRepository.findPaginated(query);
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.ordersRepository.findOneById(id);
    if (!order) {
      throw new NotFoundException(`Order #${id} not found`);
    }
    return order;
  }

  findByCustomer(customerId: number): Promise<Order[]> {
    return this.ordersRepository.findByCustomerId(customerId);
  }

  async create(dto: CreateOrderDto): Promise<Order> {
    const customer = await this.customersService.findOne(dto.customerId);
    const product = await this.productsService.findOne(dto.productId);
    const total = dto.quantity * product.unit_price;

    const order = await this.ordersRepository.save({
      quantity: dto.quantity,
      total,
      customer: { id: customer.id } as Customer,
      product: { id: product.id } as Product,
    });

    this.eventEmitter.emit(
      'order.created',
      new OrderCreatedEvent(order.id, customer.id, product.id, total),
    );

    return order;
  }

  async update(id: number, dto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);

    let customer = order.customer;
    let product = order.product;

    if (dto.customerId !== undefined) {
      customer = await this.customersService.findOne(dto.customerId);
    }

    if (dto.productId !== undefined) {
      product = await this.productsService.findOne(dto.productId);
    }

    const quantity = dto.quantity ?? order.quantity;
    const total = quantity * product.unit_price;

    return this.ordersRepository.save({
      ...order,
      quantity,
      total,
      customer: { id: customer.id } as Customer,
      product: { id: product.id } as Product,
    });
  }

  async remove(id: number): Promise<void> {
    const order = await this.findOne(id);
    await this.ordersRepository.remove(order);
  }
}
