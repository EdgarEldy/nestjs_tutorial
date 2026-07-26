import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Order } from './entities/order.entity';
import { CustomerOrdersController } from './customer-orders.controller';
import { OrdersService } from './orders.service';

const mockOrder: Order = {
  id: 1,
  quantity: 2,
  total: 2599.98,
  customer: { id: 1, first_name: 'Alice', last_name: 'Martin' } as never,
  product: { id: 1, product_name: 'Laptop', unit_price: 1299.99 } as never,
};

const mockService = {
  findByCustomer: jest.fn(),
};

describe('CustomerOrdersController', () => {
  let controller: CustomerOrdersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerOrdersController],
      providers: [{ provide: OrdersService, useValue: mockService }],
    }).compile();

    controller = module.get<CustomerOrdersController>(CustomerOrdersController);

    jest.clearAllMocks();
    mockService.findByCustomer.mockResolvedValue([mockOrder]);
  });

  describe('findByCustomer', () => {
    it('returns orders for a customer', async () => {
      expect(await controller.findByCustomer(1)).toEqual([mockOrder]);
      expect(mockService.findByCustomer).toHaveBeenCalledWith(1);
    });

    it('propagates NotFoundException from service', async () => {
      mockService.findByCustomer.mockRejectedValue(new NotFoundException());
      await expect(controller.findByCustomer(999)).rejects.toThrow(NotFoundException);
    });
  });
});
