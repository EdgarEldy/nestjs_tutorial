import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderCreatedEvent } from '../../common/events/order-created.event';

@Injectable()
export class OrderCreatedListener {
  private readonly logger = new Logger(OrderCreatedListener.name);

  @OnEvent('order.created')
  handle(event: OrderCreatedEvent): void {
    this.logger.log(
      `Order #${event.orderId} created: customer=${event.customerId}, product=${event.productId}, total=${event.total}`,
    );
  }
}
