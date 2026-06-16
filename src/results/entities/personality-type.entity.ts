import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('personality_types')
export class PersonalityType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  code: string;

  @Column()
  name: string;
}