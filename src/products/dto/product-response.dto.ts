import { ApiProperty } from '@nestjs/swagger';
import { CategoryResponseDto } from '../../categories/dto/category-response.dto';

export class ProductResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Laptop Pro 15' })
  product_name: string;

  @ApiProperty({ example: 1299.99 })
  unit_price: number;

  @ApiProperty({ type: () => CategoryResponseDto })
  category: CategoryResponseDto;
}
