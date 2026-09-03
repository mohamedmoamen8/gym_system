import { IsString, IsNotEmpty, IsOptional, IsIn, IsDateString, MinLength } from 'class-validator';

export class RegisterCustomerDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  phoneNumber!: string;

  /** Omit to auto-assign the next 4-digit code (0001, 0002, …). */
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Barcode must not be empty' })
  barcodeCode?: string;

  @IsOptional()
  @IsString()
  membershipTier?: string;

  @IsOptional()
  @IsDateString()
  subscriptionEndDate?: string;
}

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  membershipTier?: string;

  @IsOptional()
  @IsDateString()
  subscriptionEndDate?: string;

  @IsOptional()
  @IsIn(['Active', 'Suspended', 'Expired'])
  status?: 'Active' | 'Suspended' | 'Expired';
}
