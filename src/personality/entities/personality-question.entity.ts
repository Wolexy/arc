// src/personality/entities/personality-question.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('personality_questions')
@Index(['stageId', 'questionOrder'], { unique: true })
export class PersonalityQuestion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'stage_id', type: 'int' })
  stageId: number;
  // Links to assessment_stages:
  // Gut / Head / Heart personality stage

  @Column({ type: 'text' })
  text: string;

  @Column({ name: 'question_order', type: 'int' })
  questionOrder: number; // 1..45
}
