import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class OrderFilterDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Filter by customer ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  customerId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Filter by product ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  productId?: number;
}
