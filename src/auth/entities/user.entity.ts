import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import type { Role } from './role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, nullable: false })
  first_name: string;

  @Column({ length: 100, nullable: false })
  last_name: string;

  @Column({ length: 100, nullable: false, unique: true })
  email: string;

  /**
   * password is nullable because OAuth/SSO users may not have a local password.
   * It stores a bcrypt hash, never plaintext.
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string | null;

  @Column({ default: false, nullable: false })
  enabled: boolean;

  @Column({ default: false, nullable: false })
  account_locked: boolean;

  @ManyToMany('Role', 'users')
  @JoinTable({
    name: 'role_user',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];
}
