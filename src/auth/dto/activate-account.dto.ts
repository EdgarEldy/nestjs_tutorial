import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ActivateAccountDto {
  @ApiProperty({ example: 'some-uuid-activation-token' })
  @IsString()
  @IsNotEmpty()
  token: string;
}
