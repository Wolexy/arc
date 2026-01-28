import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity({ name: 'energy_results' })
export class EnergyResult {
  @PrimaryColumn({ name: 'session_id' })
  sessionId: string;

  @Column({ name: 'gut_score' })
  gutScore: number;

  @Column({ name: 'heart_score' })
  heartScore: number;

  @Column({ name: 'head_score' })
  headScore: number;

  @Column({ name: 'dominant_center' })
  dominantCenter: string;

  @CreateDateColumn({ name: 'calculated_at' })
  calculatedAt: Date;
}
