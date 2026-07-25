import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from '../categories/categories.service';
import { SortOrder } from '../common/dto/pagination-query.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { Product } from './entities/product.entity';
import { ProductsRepository } from './products.repository';
import { ProductsService } from './products.service';

const mockCategory = { id: 1, category_name: 'Electronics', products: [] };

const mockProduct: Product = {
  id: 1,
  product_name: 'Laptop Pro 15',
  unit_price: 1299.99,
  category: mockCategory,
  orders: [],
};

const mockFilter: ProductFilterDto = { page: 1, limit: 20, order: SortOrder.ASC };

const mockPage = {
  items: [mockProduct],
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
  findOneWithOrders: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

const mockCategoriesService = {
  findOne: jest.fn(),
};

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: ProductsRepository, useValue: mockRepo },
        { provide: CategoriesService, useValue: mockCategoriesService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);

    jest.clearAllMocks();
    mockRepo.findPaginated.mockResolvedValue(mockPage);
    mockRepo.findOneById.mockResolvedValue(mockProduct);
    mockRepo.findOneWithOrders.mockResolvedValue({ ...mockProduct, orders: [] });
    mockRepo.save.mockResolvedValue(mockProduct);
    mockRepo.remove.mockResolvedValue(undefined);
    mockCategoriesService.findOne.mockResolvedValue(mockCategory);
  });

  describe('findAll', () => {
    it('delegates to repository and returns paginated response', async () => {
      expect(await service.findAll(mockFilter)).toEqual(mockPage);
      expect(mockRepo.findPaginated).toHaveBeenCalledWith(mockFilter);
    });
  });

  describe('findOne', () => {
    it('returns product for valid id', async () => {
      expect(await service.findOne(1)).toEqual(mockProduct);
    });

    it('throws NotFoundException for unknown id', async () => {
      mockRepo.findOneById.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('verifies category exists and saves product', async () => {
      const dto = { categoryId: 1, product_name: 'Laptop Pro 15', unit_price: 1299.99 };
      await service.create(dto);
      expect(mockCategoriesService.findOne).toHaveBeenCalledWith(1);
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('throws NotFoundException when category does not exist', async () => {
      mockCategoriesService.findOne.mockRejectedValue(new NotFoundException());
      await expect(
        service.create({ categoryId: 999, product_name: 'X', unit_price: 9.99 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates product and verifies new category if changed', async () => {
      const dto = { categoryId: 2, product_name: 'Updated Laptop', unit_price: 999 };
      await service.update(1, dto);
      expect(mockCategoriesService.findOne).toHaveBeenCalledWith(2);
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('does not verify category when categoryId is not in dto', async () => {
      await service.update(1, { product_name: 'Renamed' });
      expect(mockCategoriesService.findOne).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for unknown product id', async () => {
      mockRepo.findOneById.mockResolvedValue(null);
      await expect(service.update(999, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes product without orders', async () => {
      await expect(service.remove(1)).resolves.toBeUndefined();
      expect(mockRepo.remove).toHaveBeenCalled();
    });

    it('throws NotFoundException when product does not exist', async () => {
      mockRepo.findOneWithOrders.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when product has associated orders', async () => {
      mockRepo.findOneWithOrders.mockResolvedValue({
        ...mockProduct,
        orders: [{ id: 1, quantity: 2, total: 100 }],
      });
      await expect(service.remove(1)).rejects.toThrow(ConflictException);
    });
  });
});
