import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SortOrder } from '../common/dto/pagination-query.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { Product } from './entities/product.entity';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

const mockProduct: Product = {
  id: 1,
  product_name: 'Laptop Pro 15',
  unit_price: 1299.99,
  category: { id: 1, category_name: 'Electronics', products: [] },
  orders: [],
};

const mockPage = {
  items: [mockProduct],
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

describe('ProductsController', () => {
  let controller: ProductsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: mockService }],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);

    jest.clearAllMocks();
    mockService.findAll.mockResolvedValue(mockPage);
    mockService.findOne.mockResolvedValue(mockProduct);
    mockService.create.mockResolvedValue(mockProduct);
    mockService.update.mockResolvedValue(mockProduct);
    mockService.remove.mockResolvedValue(undefined);
  });

  describe('findAll', () => {
    it('passes filter query to service and returns paginated response', async () => {
      const query: ProductFilterDto = { page: 1, limit: 20, order: SortOrder.ASC, categoryId: 1 };
      expect(await controller.findAll(query)).toEqual(mockPage);
      expect(mockService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('returns product for valid id', async () => {
      expect(await controller.findOne(1)).toEqual(mockProduct);
      expect(mockService.findOne).toHaveBeenCalledWith(1);
    });

    it('propagates NotFoundException from service', async () => {
      mockService.findOne.mockRejectedValue(new NotFoundException());
      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('passes dto to service and returns created product', async () => {
      const dto = { categoryId: 1, product_name: 'Laptop', unit_price: 999 };
      expect(await controller.create(dto)).toEqual(mockProduct);
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('passes id and dto to service and returns updated product', async () => {
      const dto = { product_name: 'Updated Laptop' };
      expect(await controller.update(1, dto)).toEqual(mockProduct);
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
