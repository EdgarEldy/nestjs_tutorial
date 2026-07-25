import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CategoriesService } from '../categories/categories.service';
import { PageResponse } from '../common/dto/page-response.dto';
import { Category } from '../categories/entities/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { ProductsRepository } from './products.repository';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly categoriesService: CategoriesService,
  ) {}

  findAll(query: ProductFilterDto): Promise<PageResponse<Product>> {
    return this.productsRepository.findPaginated(query);
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productsRepository.findOneById(id);
    if (!product) {
      throw new NotFoundException(`Product #${id} not found`);
    }
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    await this.categoriesService.findOne(dto.categoryId);
    return this.productsRepository.save({
      product_name: dto.product_name,
      unit_price: dto.unit_price,
      category: { id: dto.categoryId } as Category,
    });
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    if (dto.categoryId !== undefined) {
      await this.categoriesService.findOne(dto.categoryId);
    }
    const updates: Partial<Product> = {};
    if (dto.product_name !== undefined) updates.product_name = dto.product_name;
    if (dto.unit_price !== undefined) updates.unit_price = dto.unit_price;
    if (dto.categoryId !== undefined) updates.category = { id: dto.categoryId } as Category;
    return this.productsRepository.save({ ...product, ...updates });
  }

  async remove(id: number): Promise<void> {
    const product = await this.productsRepository.findOneWithOrders(id);
    if (!product) {
      throw new NotFoundException(`Product #${id} not found`);
    }
    if (product.orders && product.orders.length > 0) {
      throw new ConflictException(
        `Product #${id} cannot be deleted because it is referenced by existing orders`,
      );
    }
    await this.productsRepository.remove(product);
  }
}
