import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 1, description: 'ID of the parent category' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  categoryId: number;

  @ApiProperty({ example: 'Laptop Pro 15', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  product_name: string;

  @ApiProperty({ example: 1299.99, description: 'Price must be greater than 0' })
  @IsNumber()
  @IsPositive()
  unit_price: number;
}
