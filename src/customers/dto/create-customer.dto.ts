import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Alice', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  first_name: string;

  @ApiProperty({ example: 'Martin', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  last_name: string;

  @ApiProperty({ example: '+1-555-0101', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^\+?[\d\s\-().]{7,50}$/, { message: 'telephone must be a valid phone number' })
  telephone: string;

  @ApiProperty({ example: 'alice.martin@example.com', maxLength: 255 })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: '123 Maple Street, Springfield, IL 62701', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  address: string;
}
