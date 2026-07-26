import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SortOrder } from '../common/dto/pagination-query.dto';
import { CustomerFilterDto } from './dto/customer-filter.dto';
import { Customer } from './entities/customer.entity';
import { CustomersRepository } from './customers.repository';
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

const mockFilter: CustomerFilterDto = { page: 1, limit: 20, order: SortOrder.ASC };

const mockPage = {
  items: [mockCustomer],
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
  findByEmail: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

describe('CustomersService', () => {
  let service: CustomersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CustomersService, { provide: CustomersRepository, useValue: mockRepo }],
    }).compile();

    service = module.get<CustomersService>(CustomersService);

    jest.clearAllMocks();
    mockRepo.findPaginated.mockResolvedValue(mockPage);
    mockRepo.findOneById.mockResolvedValue(mockCustomer);
    mockRepo.findOneWithOrders.mockResolvedValue({ ...mockCustomer, orders: [] });
    mockRepo.findByEmail.mockResolvedValue(null);
    mockRepo.save.mockResolvedValue(mockCustomer);
    mockRepo.remove.mockResolvedValue(undefined);
  });

  describe('findAll', () => {
    it('delegates to repository and returns paginated response', async () => {
      expect(await service.findAll(mockFilter)).toEqual(mockPage);
      expect(mockRepo.findPaginated).toHaveBeenCalledWith(mockFilter);
    });

    it('passes search term to repository', async () => {
      const query: CustomerFilterDto = { ...mockFilter, search: 'alice' };
      await service.findAll(query);
      expect(mockRepo.findPaginated).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('returns customer for valid id', async () => {
      expect(await service.findOne(1)).toEqual(mockCustomer);
    });

    it('throws NotFoundException for unknown id', async () => {
      mockRepo.findOneById.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('saves and returns a new customer when email is unique', async () => {
      const dto = {
        first_name: 'Bob',
        last_name: 'Johnson',
        telephone: '+1-555-0102',
        email: 'bob@example.com',
        address: '456 Oak Ave',
      };
      await service.create(dto);
      expect(mockRepo.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(mockRepo.save).toHaveBeenCalledWith(dto);
    });

    it('throws ConflictException for duplicate email', async () => {
      mockRepo.findByEmail.mockResolvedValue(mockCustomer);
      await expect(
        service.create({
          first_name: 'Dup',
          last_name: 'Email',
          telephone: '+1-555-9999',
          email: 'alice.martin@example.com',
          address: 'Somewhere',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('updates customer fields without email conflict check when email is unchanged', async () => {
      const dto = { first_name: 'Alicia', email: 'alice.martin@example.com' };
      await service.update(1, dto);
      expect(mockRepo.findByEmail).not.toHaveBeenCalled();
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('throws ConflictException when new email belongs to another customer', async () => {
      const other: Customer = { ...mockCustomer, id: 2, email: 'other@example.com' };
      mockRepo.findByEmail.mockResolvedValue(other);
      await expect(service.update(1, { email: 'other@example.com' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('updates email when new address is not taken', async () => {
      mockRepo.findByEmail.mockResolvedValue(null);
      await service.update(1, { email: 'new@example.com' });
      expect(mockRepo.findByEmail).toHaveBeenCalledWith('new@example.com');
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('throws NotFoundException for unknown customer id', async () => {
      mockRepo.findOneById.mockResolvedValue(null);
      await expect(service.update(999, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes customer without orders', async () => {
      await expect(service.remove(1)).resolves.toBeUndefined();
      expect(mockRepo.remove).toHaveBeenCalled();
    });

    it('throws NotFoundException when customer does not exist', async () => {
      mockRepo.findOneWithOrders.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when customer has associated orders', async () => {
      mockRepo.findOneWithOrders.mockResolvedValue({
        ...mockCustomer,
        orders: [{ id: 1, quantity: 1, total: 50 }],
      });
      await expect(service.remove(1)).rejects.toThrow(ConflictException);
    });
  });
});
