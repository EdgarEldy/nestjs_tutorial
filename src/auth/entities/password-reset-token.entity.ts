import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import type { User } from './user.entity';

@Entity('password_reset_tokens')
export class PasswordResetToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255, nullable: false })
  token: string;

  /**
   * type discriminates between different reset flows (e.g. 'PASSWORD_RESET',
   * 'EMAIL_CHANGE') so one table serves multiple use cases.
   */
  @Column({ length: 255, nullable: false })
  type: string;

  @Column({ type: 'timestamptz', nullable: false })
  expiry_date: Date;

  @ManyToOne('User', { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
