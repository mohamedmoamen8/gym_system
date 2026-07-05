import { IsString, IsNotEmpty, IsOptional, IsIn, IsDateString, MinLength } from 'class-validator';

export class RegisterCustomerDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  phoneNumber!: string;

  @IsString()
  @IsNotEmpty({ message: 'Barcode code is required' })
  @MinLength(3, { message: 'Barcode must be at least 3 characters' })
  barcodeCode!: string;

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
