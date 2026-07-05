import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { CaptainLog } from './captain-log.entity';

@Entity('captains')
export class Captain {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  accessCode!: string;

  @Column({ nullable: true, type: 'text' })
  photoPath!: string | null;

  @Column({ default: 'Active' })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => CaptainLog, (log) => log.captain)
  logs!: CaptainLog[];
}
