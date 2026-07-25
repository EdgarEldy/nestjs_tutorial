import { ApiProperty } from '@nestjs/swagger';

class OrderCustomerDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Alice Martin' })
  fullName: string;
}

class OrderProductDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Laptop Pro 15' })
  productName: string;

  @ApiProperty({ example: 1299.99 })
  unitPrice: number;
}

export class OrderResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 2599.98 })
  total: number;

  @ApiProperty({ type: () => OrderCustomerDto })
  customer: OrderCustomerDto;

  @ApiProperty({ type: () => OrderProductDto })
  product: OrderProductDto;
}
