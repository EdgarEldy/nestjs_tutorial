import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesRepository } from './categories.repository';
import { CategoriesService } from './categories.service';
import { PaginationQueryDto, SortOrder } from '../common/dto/pagination-query.dto';
import { Category } from './entities/category.entity';

const mockCategory: Category = { id: 1, category_name: 'Electronics', products: [] };

const mockPagination: PaginationQueryDto = { page: 1, limit: 20, order: SortOrder.ASC };

const mockPage = {
  items: [mockCategory],
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
  findOneWithProducts: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

describe('CategoriesService', () => {
  let service: CategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoriesService, { provide: CategoriesRepository, useValue: mockRepo }],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);

    jest.clearAllMocks();
    mockRepo.findPaginated.mockResolvedValue(mockPage);
    mockRepo.findOneById.mockResolvedValue(mockCategory);
    mockRepo.findOneWithProducts.mockResolvedValue({ ...mockCategory, products: [] });
    mockRepo.save.mockResolvedValue(mockCategory);
    mockRepo.remove.mockResolvedValue(undefined);
  });

  describe('findAll', () => {
    it('returns paginated results', async () => {
      const result = await service.findAll(mockPagination);
      expect(result).toEqual(mockPage);
      expect(mockRepo.findPaginated).toHaveBeenCalledWith(mockPagination);
    });
  });

  describe('findOne', () => {
    it('returns category for valid id', async () => {
      expect(await service.findOne(1)).toEqual(mockCategory);
    });

    it('throws NotFoundException for unknown id', async () => {
      mockRepo.findOneById.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('saves and returns new category', async () => {
      const dto = { category_name: 'Electronics' };
      const result = await service.create(dto);
      expect(result).toEqual(mockCategory);
      expect(mockRepo.save).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('merges dto into existing category and saves', async () => {
      const dto = { category_name: 'Updated' };
      const result = await service.update(1, dto);
      expect(result).toEqual(mockCategory);
      expect(mockRepo.save).toHaveBeenCalledWith({ ...mockCategory, ...dto });
    });

    it('throws NotFoundException for unknown id', async () => {
      mockRepo.findOneById.mockResolvedValue(null);
      await expect(service.update(999, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes category without products', async () => {
      await expect(service.remove(1)).resolves.toBeUndefined();
      expect(mockRepo.remove).toHaveBeenCalled();
    });

    it('throws NotFoundException when category does not exist', async () => {
      mockRepo.findOneWithProducts.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when category has associated products', async () => {
      mockRepo.findOneWithProducts.mockResolvedValue({
        ...mockCategory,
        products: [{ id: 1, product_name: 'Laptop', unit_price: 999 }],
      });
      await expect(service.remove(1)).rejects.toThrow(ConflictException);
    });
  });
});
