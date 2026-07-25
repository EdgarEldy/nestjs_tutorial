import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import type { User } from './user.entity';

@Entity('activation_tokens')
export class ActivationToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  token: string | null;

  @CreateDateColumn({ nullable: false })
  created_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  expires_at: Date | null;

  /**
   * validated_at is set when the token is consumed. A non-null value means
   * the token has already been used and must be rejected on re-submission.
   */
  @Column({ type: 'timestamptz', nullable: true })
  validated_at: Date | null;

  @ManyToOne('User', { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
