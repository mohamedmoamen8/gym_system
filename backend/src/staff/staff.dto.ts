import { IsString, IsNotEmpty, IsOptional, IsIn, MinLength } from 'class-validator';

export class CreateCaptainDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'Access code is required' })
  @MinLength(4, { message: 'Access code must be at least 4 characters' })
  accessCode!: string;
}

export class UpdateCaptainDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  accessCode?: string;

  @IsOptional()
  @IsIn(['Active', 'Inactive'])
  status?: 'Active' | 'Inactive';
}

export class ClockTriggerDto {
  @IsString()
  @IsNotEmpty({ message: 'Access code is required' })
  accessCode!: string;
}
