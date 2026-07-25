import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ example: 1, description: 'ID of the customer placing the order' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  customerId: number;

  @ApiProperty({ example: 1, description: 'ID of the product being ordered' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  productId: number;

  @ApiProperty({ example: 2, description: 'Quantity must be greater than 0' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  quantity: number;
}
