import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { CustomersService } from '../customers/customers.service';
import { ProductsService } from '../products/products.service';
import { SortOrder } from '../common/dto/pagination-query.dto';
import { OrderCreatedEvent } from '../common/events/order-created.event';
import { OrderFilterDto } from './dto/order-filter.dto';
import { Order } from './entities/order.entity';
import { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';

const mockCustomer = {
  id: 1,
  first_name: 'Alice',
  last_name: 'Martin',
  email: 'alice@example.com',
};
const mockProduct = { id: 1, product_name: 'Laptop', unit_price: 1299.99 };

const mockOrder: Order = {
  id: 1,
  quantity: 2,
  total: 2599.98,
  customer: mockCustomer as never,
  product: mockProduct as never,
};

const mockFilter: OrderFilterDto = { page: 1, limit: 20, order: SortOrder.ASC };

const mockPage = {
  items: [mockOrder],
  total: 1,
  page: 1,
  limit: 20,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
};

const mockRepo = {
  findPaginated: jest.fn(),
  findOneById: jest.fn(),
  findByCustomerId: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

const mockCustomersService = { findOne: jest.fn() };
const mockProductsService = { findOne: jest.fn() };
const mockEventEmitter = { emit: jest.fn() };

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: OrdersRepository, useValue: mockRepo },
        { provide: CustomersService, useValue: mockCustomersService },
        { provide: ProductsService, useValue: mockProductsService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);

    jest.clearAllMocks();
    mockRepo.findPaginated.mockResolvedValue(mockPage);
    mockRepo.findOneById.mockResolvedValue(mockOrder);
    mockRepo.findByCustomerId.mockResolvedValue([mockOrder]);
    mockRepo.save.mockResolvedValue(mockOrder);
    mockRepo.remove.mockResolvedValue(undefined);
    mockCustomersService.findOne.mockResolvedValue(mockCustomer);
    mockProductsService.findOne.mockResolvedValue(mockProduct);
  });

  describe('findAll', () => {
    it('delegates to repository and returns paginated response', async () => {
      expect(await service.findAll(mockFilter)).toEqual(mockPage);
      expect(mockRepo.findPaginated).toHaveBeenCalledWith(mockFilter);
    });
  });

  describe('findOne', () => {
    it('returns order for valid id', async () => {
      expect(await service.findOne(1)).toEqual(mockOrder);
    });

    it('throws NotFoundException for unknown id', async () => {
      mockRepo.findOneById.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCustomer', () => {
    it('returns orders for a customer', async () => {
      expect(await service.findByCustomer(1)).toEqual([mockOrder]);
      expect(mockRepo.findByCustomerId).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    it('verifies customer and product, computes total, saves order', async () => {
      const dto = { customerId: 1, productId: 1, quantity: 2 };
      await service.create(dto);
      expect(mockCustomersService.findOne).toHaveBeenCalledWith(1);
      expect(mockProductsService.findOne).toHaveBeenCalledWith(1);
      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 2, total: 2 * mockProduct.unit_price }),
      );
    });

    it('publishes OrderCreatedEvent after saving', async () => {
      const dto = { customerId: 1, productId: 1, quantity: 2 };
      await service.create(dto);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'order.created',
        expect.any(OrderCreatedEvent),
      );
    });

    it('throws NotFoundException when customer does not exist', async () => {
      mockCustomersService.findOne.mockRejectedValue(new NotFoundException());
      await expect(service.create({ customerId: 999, productId: 1, quantity: 1 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when product does not exist', async () => {
      mockProductsService.findOne.mockRejectedValue(new NotFoundException());
      await expect(service.create({ customerId: 1, productId: 999, quantity: 1 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('recomputes total when quantity changes', async () => {
      const dto = { quantity: 5 };
      await service.update(1, dto);
      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 5, total: 5 * mockProduct.unit_price }),
      );
    });

    it('keeps existing total basis when quantity is unchanged', async () => {
      await service.update(1, {});
      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: mockOrder.quantity,
          total: mockOrder.quantity * mockProduct.unit_price,
        }),
      );
    });

    it('throws NotFoundException for unknown order id', async () => {
      mockRepo.findOneById.mockResolvedValue(null);
      await expect(service.update(999, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes the order', async () => {
      await expect(service.remove(1)).resolves.toBeUndefined();
      expect(mockRepo.remove).toHaveBeenCalledWith(mockOrder);
    });

    it('throws NotFoundException for unknown order id', async () => {
      mockRepo.findOneById.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
