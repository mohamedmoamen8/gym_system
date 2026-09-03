import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, Index } from 'typeorm';
import { Customer } from '../customers/customer.entity';

@Entity('member_checkins')
@Index(['customerId', 'createdAt'])
export class MemberCheckin {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  customerId!: string;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  customer!: Customer;

  @CreateDateColumn()
  createdAt!: Date;
}
