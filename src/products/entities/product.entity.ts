import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import type { Category } from '../../categories/entities/category.entity';
import type { Order } from '../../orders/entities/order.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255, nullable: false })
  product_name: string;

  @Column({ type: 'float', nullable: false })
  unit_price: number;

  /**
   * The @ManyToOne decorator implicitly creates the category_id FK column in the
   * database. @JoinColumn pins the column name to 'category_id' so the generated
   * SQL always matches the spec regardless of TypeORM's naming strategy.
   */
  @ManyToOne('Category', 'products', { nullable: false })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany('Order', 'product')
  orders: Order[];
}
