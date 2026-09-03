import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, Index } from 'typeorm';
import { Customer } from '../customers/customer.entity';

@Entity('payments')
@Index(['customerId', 'createdAt'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  customerId!: string;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  customer!: Customer;

  @Column('decimal', { precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: 'text', nullable: true })
  method!: string | null;

  @Column({ default: 'pending' })
  status!: 'pending' | 'paid' | 'failed' | 'refunded';

  @Column({ type: 'text', nullable: true })
  note!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
