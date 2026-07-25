import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import type { User } from './user.entity';

@Entity('blacklisted_tokens')
export class BlacklistedToken {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Stores the full JWT string. Length 768 accommodates standard JWTs which
   * can reach ~500–700 characters with typical payload sizes.
   */
  @Column({ length: 768, nullable: false })
  token: string;

  /**
   * jti is the JWT ID claim (UUID). Indexed and unique so the JwtStrategy can
   * perform a fast blacklist check on every authenticated request.
   */
  @Column({ length: 255, nullable: true, unique: true })
  jti: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  blacklisted_at: Date | null;

  @CreateDateColumn({ nullable: false })
  created_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  expires_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  validated_at: Date | null;

  @ManyToOne('User', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;
}
