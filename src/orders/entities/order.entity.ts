import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import type { Customer } from '../../customers/entities/customer.entity';
import type { Product } from '../../products/entities/product.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  quantity: number;

  /**
   * total is always computed in the service as quantity × product.unit_price.
   * It is stored in the database so that historical totals remain correct even
   * if a product's unit_price changes after the order is created.
   */
  @Column({ type: 'float', nullable: false })
  total: number;

  @ManyToOne('Customer', 'orders', { nullable: false })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne('Product', 'orders', { nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
