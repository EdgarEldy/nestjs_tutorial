import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiResponse<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'OK' })
  message: string;

  @ApiPropertyOptional()
  data?: T;

  @ApiPropertyOptional({ type: [String] })
  errors?: string[];

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiPropertyOptional({ example: '/api/v1/categories' })
  path?: string;
}
