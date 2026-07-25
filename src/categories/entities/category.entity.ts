import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import type { Product } from '../../products/entities/product.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255, nullable: false })
  category_name: string;

  @OneToMany('Product', 'category')
  products: Product[];
}
