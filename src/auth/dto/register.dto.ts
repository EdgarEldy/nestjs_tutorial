import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Jane' })
  @IsString()
  @MaxLength(50)
  first_name: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MaxLength(100)
  last_name: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Secret@1234',
    description: 'Min 8 chars, one uppercase, one digit, one special character',
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/, {
    message:
      'password must contain at least one uppercase letter, one digit, and one special character',
  })
  password: string;
}
