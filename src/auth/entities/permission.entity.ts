import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import type { Role } from './role.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, nullable: false })
  resource: string;

  @Column({ length: 50, nullable: false })
  action: string;

  /**
   * The inverse side of the Role ↔ Permission many-to-many. The join table
   * (role_permission) is owned by Role via @JoinTable, so Permission does not
   * declare @JoinTable here.
   */
  @ManyToMany('Role', 'permissions')
  roles: Role[];
}
