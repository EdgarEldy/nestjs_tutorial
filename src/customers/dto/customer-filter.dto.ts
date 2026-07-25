import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class CustomerFilterDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'alice',
    description: 'Search by first name, last name, or email',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
