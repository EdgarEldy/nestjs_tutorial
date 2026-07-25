import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty() id: number;
  @ApiProperty() first_name: string;
  @ApiProperty() last_name: string;
  @ApiProperty() email: string;
  @ApiProperty({ type: [String] }) roles: string[];
}

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;
}
