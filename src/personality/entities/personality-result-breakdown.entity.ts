// src/personality/entities/personality-result-breakdown.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('personality_result_breakdown')
@Unique(['personalitySessionId', 'personalityTypeId'])
export class PersonalityResultBreakdown {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'personality_session_id' })
  personalitySessionId: string;

  @Column({ name: 'personality_type_id' })
  personalityTypeId: string;

  @Column()
  score: number;

  @Column({ name: 'is_dominant', default: false })
  isDominant: boolean;
}
