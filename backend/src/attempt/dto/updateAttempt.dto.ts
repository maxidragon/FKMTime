import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { AttemptStatus, AttemptType } from '@prisma/client';

export class UpdateAttemptDto {
  @IsInt()
  @Min(1)
  attemptNumber: number;

  @IsOptional()
  @IsInt()
  replacedBy: number;

  @IsString()
  @IsOptional()
  judgeId: string;

  @IsString()
  @IsOptional()
  deviceId: string;

  @IsEnum(AttemptStatus)
  status: AttemptStatus;

  @IsEnum(AttemptType)
  type: AttemptType;

  @IsInt()
  penalty: number;

  @IsInt()
  value: number;

  @IsString()
  @IsOptional()
  comment: string;

  @IsOptional()
  @IsBoolean()
  submitToWcaLive: boolean;

  @IsOptional()
  @IsBoolean()
  updateReplacedBy: boolean;
}
