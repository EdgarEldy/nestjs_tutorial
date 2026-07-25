import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import type { User } from './user.entity';
import type { Permission } from './permission.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, nullable: false, unique: true })
  role_name: string;

  /**
   * The inverse side of the User ↔ Role many-to-many. The join table (role_user)
   * is owned by User, so Role does not repeat the @JoinTable decorator here.
   */
  @ManyToMany('User', 'roles')
  users: User[];

  @ManyToMany('Permission', 'roles')
  @JoinTable({
    name: 'role_permission',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permission[];
}
