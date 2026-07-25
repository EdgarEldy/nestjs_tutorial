export class OrderCreatedEvent {
  constructor(
    public readonly orderId: number,
    public readonly customerId: number,
    public readonly productId: number,
    public readonly total: number,
  ) {}
}
