import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { Captain } from './captain.entity';

@Entity('captain_logs')
export class CaptainLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Captain, (captain) => captain.logs, { onDelete: 'CASCADE' })
  captain!: Captain;

  @CreateDateColumn()
  clockInTime!: Date;

  @Column({ type: 'datetime', nullable: true })
  clockOutTime!: Date | null;

  @Column({ type: 'float', nullable: true })
  hoursWorked!: number | null;
}
