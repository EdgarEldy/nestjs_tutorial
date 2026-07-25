import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SortOrder } from '../common/dto/pagination-query.dto';
import { CustomerFilterDto } from './dto/customer-filter.dto';
import { Customer } from './entities/customer.entity';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

const mockCustomer: Customer = {
  id: 1,
  first_name: 'Alice',
  last_name: 'Martin',
  telephone: '+1-555-0101',
  email: 'alice.martin@example.com',
  address: '123 Maple Street, Springfield, IL 62701',
  orders: [],
};

const mockPage = {
  items: [mockCustomer],
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
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('CustomersController', () => {
  let controller: CustomersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [{ provide: CustomersService, useValue: mockService }],
    }).compile();

    controller = module.get<CustomersController>(CustomersController);

    jest.clearAllMocks();
    mockService.findAll.mockResolvedValue(mockPage);
    mockService.findOne.mockResolvedValue(mockCustomer);
    mockService.create.mockResolvedValue(mockCustomer);
    mockService.update.mockResolvedValue(mockCustomer);
    mockService.remove.mockResolvedValue(undefined);
  });

  describe('findAll', () => {
    it('passes filter query to service and returns paginated response', async () => {
      const query: CustomerFilterDto = {
        page: 1,
        limit: 20,
        order: SortOrder.ASC,
        search: 'alice',
      };
      expect(await controller.findAll(query)).toEqual(mockPage);
      expect(mockService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('returns customer for valid id', async () => {
      expect(await controller.findOne(1)).toEqual(mockCustomer);
      expect(mockService.findOne).toHaveBeenCalledWith(1);
    });

    it('propagates NotFoundException from service', async () => {
      mockService.findOne.mockRejectedValue(new NotFoundException());
      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('passes dto to service and returns created customer', async () => {
      const dto = {
        first_name: 'Alice',
        last_name: 'Martin',
        telephone: '+1-555-0101',
        email: 'alice.martin@example.com',
        address: '123 Maple Street',
      };
      expect(await controller.create(dto)).toEqual(mockCustomer);
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('passes id and dto to service and returns updated customer', async () => {
      const dto = { first_name: 'Alicia' };
      expect(await controller.update(1, dto)).toEqual(mockCustomer);
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
