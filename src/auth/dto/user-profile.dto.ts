import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty() id: number;
  @ApiProperty() first_name: string;
  @ApiProperty() last_name: string;
  @ApiProperty() email: string;
  @ApiProperty() enabled: boolean;
  @ApiProperty() account_locked: boolean;
  @ApiProperty({ type: [String] }) roles: string[];
}
