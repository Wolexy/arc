import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { OneToMany } from 'typeorm';

import { TestSession } from '../../sessions/entities/test-session.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'email', unique: true })
  email: string;

  @Column({ name: 'password', type: 'text' })
  passwordHash: string;

  @Column({ default: 'USER' })
  role: 'USER' | 'ADMIN';

  @Column({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Column({ name: 'access_granted', default: false })
  accessGranted: boolean;

  @Column({ name: 'access_granted_at', nullable: true })
  accessGrantedAt: Date;

  @Column({ name: 'access_granted_by', nullable: true })
  accessGrantedBy: number;

  @Column({ name: 'last_login_at', nullable: true })
  lastLoginAt: Date;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'email_verification_token', nullable: true, type: 'text' })
  emailVerificationToken?: string | null;

  @Column({
    name: 'email_verification_expires',
    type: 'timestamp',
    nullable: true,
  })
  emailVerificationExpires?: Date;

  @OneToMany(
    () => TestSession,

    (session) => session.user,
  )
  testSessions: TestSession[];
}
