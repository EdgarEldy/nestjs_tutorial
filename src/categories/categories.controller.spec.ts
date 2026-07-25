import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { PaginationQueryDto, SortOrder } from '../common/dto/pagination-query.dto';
import { Category } from './entities/category.entity';

const mockCategory: Category = { id: 1, category_name: 'Electronics', products: [] };

const mockPage = {
  items: [mockCategory],
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

describe('CategoriesController', () => {
  let controller: CategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [{ provide: CategoriesService, useValue: mockService }],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);

    jest.clearAllMocks();
    mockService.findAll.mockResolvedValue(mockPage);
    mockService.findOne.mockResolvedValue(mockCategory);
    mockService.create.mockResolvedValue(mockCategory);
    mockService.update.mockResolvedValue(mockCategory);
    mockService.remove.mockResolvedValue(undefined);
  });

  describe('findAll', () => {
    it('delegates to service and returns paginated response', async () => {
      const query: PaginationQueryDto = { page: 1, limit: 20, order: SortOrder.ASC };
      expect(await controller.findAll(query)).toEqual(mockPage);
      expect(mockService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('returns category for valid id', async () => {
      expect(await controller.findOne(1)).toEqual(mockCategory);
      expect(mockService.findOne).toHaveBeenCalledWith(1);
    });

    it('propagates NotFoundException from service', async () => {
      mockService.findOne.mockRejectedValue(new NotFoundException());
      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('passes dto to service and returns created category', async () => {
      const dto = { category_name: 'Electronics' };
      expect(await controller.create(dto)).toEqual(mockCategory);
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('passes id and dto to service and returns updated category', async () => {
      const dto = { category_name: 'Updated' };
      expect(await controller.update(1, dto)).toEqual(mockCategory);
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
