import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import type { Order } from '../../orders/entities/order.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255, nullable: false })
  first_name: string;

  @Column({ length: 255, nullable: false })
  last_name: string;

  @Column({ length: 50, nullable: false })
  telephone: string;

  @Column({ length: 255, nullable: false, unique: true })
  email: string;

  @Column({ length: 255, nullable: false })
  address: string;

  @OneToMany('Order', 'customer')
  orders: Order[];
}
