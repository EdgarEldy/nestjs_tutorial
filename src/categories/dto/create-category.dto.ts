import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Electronics', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  category_name: string;
}
