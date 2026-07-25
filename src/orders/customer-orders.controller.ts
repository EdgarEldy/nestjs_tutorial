import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OrderResponseDto } from './dto/order-response.dto';
import { Order } from './entities/order.entity';
import { OrdersService } from './orders.service';

@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers/:customerId/orders')
export class CustomerOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all orders for a specific customer' })
  @ApiResponse({
    status: 200,
    description: 'Customer orders',
    type: OrderResponseDto,
    isArray: true,
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  findByCustomer(@Param('customerId', ParseIntPipe) customerId: number): Promise<Order[]> {
    return this.ordersService.findByCustomer(customerId);
  }
}
