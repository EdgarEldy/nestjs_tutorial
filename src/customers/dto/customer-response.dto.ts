import { ApiProperty } from '@nestjs/swagger';

export class CustomerResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Alice' })
  first_name: string;

  @ApiProperty({ example: 'Martin' })
  last_name: string;

  @ApiProperty({ example: '+1-555-0101' })
  telephone: string;

  @ApiProperty({ example: 'alice.martin@example.com' })
  email: string;

  @ApiProperty({ example: '123 Maple Street, Springfield, IL 62701' })
  address: string;
}
