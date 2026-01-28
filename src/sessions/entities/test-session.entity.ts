import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'test_sessions' })
export class TestSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId: number | null;

  @Column({ name: 'guest_email', type:'text', nullable: true })
  guestEmail: string | null;

  @CreateDateColumn({ name: 'started_at' })
  startedAt: Date;

  @Column({ name: 'stage1_completed_at', type: 'timestamp', nullable: true })
  stage1CompletedAt: Date | null;

  @Column({ name: 'stage2_unlocked_at', type: 'timestamp', nullable: true })
  stage2UnlockedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;
}
