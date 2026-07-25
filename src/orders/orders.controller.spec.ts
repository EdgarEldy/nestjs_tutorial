import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SortOrder } from '../common/dto/pagination-query.dto';
import { OrderFilterDto } from './dto/order-filter.dto';
import { Order } from './entities/order.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

const mockOrder: Order = {
  id: 1,
  quantity: 2,
  total: 2599.98,
  customer: { id: 1, first_name: 'Alice', last_name: 'Martin' } as never,
  product: { id: 1, product_name: 'Laptop', unit_price: 1299.99 } as never,
};

const mockPage = {
  items: [mockOrder],
  total: 1,
  page: 1,
  limit: 20,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
};

const mockService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  findByCustomer: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('OrdersController', () => {
  let controller: OrdersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [{ provide: OrdersService, useValue: mockService }],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);

    jest.clearAllMocks();
    mockService.findAll.mockResolvedValue(mockPage);
    mockService.findOne.mockResolvedValue(mockOrder);
    mockService.create.mockResolvedValue(mockOrder);
    mockService.update.mockResolvedValue(mockOrder);
    mockService.remove.mockResolvedValue(undefined);
  });

  describe('findAll', () => {
    it('passes filter query to service and returns paginated response', async () => {
      const query: OrderFilterDto = { page: 1, limit: 20, order: SortOrder.ASC, customerId: 1 };
      expect(await controller.findAll(query)).toEqual(mockPage);
      expect(mockService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('returns order for valid id', async () => {
      expect(await controller.findOne(1)).toEqual(mockOrder);
      expect(mockService.findOne).toHaveBeenCalledWith(1);
    });

    it('propagates NotFoundException from service', async () => {
      mockService.findOne.mockRejectedValue(new NotFoundException());
      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('passes dto to service and returns created order', async () => {
      const dto = { customerId: 1, productId: 1, quantity: 2 };
      expect(await controller.create(dto)).toEqual(mockOrder);
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('passes id and dto to service and returns updated order', async () => {
      const dto = { quantity: 3 };
      expect(await controller.update(1, dto)).toEqual(mockOrder);
      expect(mockService.update).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('remove', () => {
    it('calls service remove and returns undefined', async () => {
      expect(await controller.remove(1)).toBeUndefined();
      expect(mockService.remove).toHaveBeenCalledWith(1);
    });
  });
});
