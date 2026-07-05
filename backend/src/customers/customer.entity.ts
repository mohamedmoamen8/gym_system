import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  phoneNumber!: string;

  @Column({ unique: true })
  barcodeCode!: string;

  @Column({ nullable: true, type: 'text' })
  membershipTier!: string | null;

  @Column({ type: 'datetime', nullable: true })
  subscriptionEndDate!: Date | null;

  @Column({ nullable: true, type: 'text' })
  photoPath!: string | null;

  @Column({ default: 'Active' })
  status!: 'Active' | 'Suspended' | 'Expired';

  @CreateDateColumn()
  createdAt!: Date;
}
