import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersModule } from '../customers/customers.module';
import { ProductsModule } from '../products/products.module';
import { CustomerOrdersController } from './customer-orders.controller';
import { Order } from './entities/order.entity';
import { OrderCreatedListener } from './listeners/order-created.listener';
import { OrdersController } from './orders.controller';
import { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    EventEmitterModule.forRoot(),
    CustomersModule,
    ProductsModule,
  ],
  controllers: [OrdersController, CustomerOrdersController],
  providers: [OrdersService, OrdersRepository, OrderCreatedListener],
  exports: [OrdersService],
})
export class OrdersModule {}
