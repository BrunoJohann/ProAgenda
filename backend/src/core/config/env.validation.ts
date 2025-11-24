import { plainToInstance } from 'class-transformer';
import { IsString, IsNumber, IsOptional, validateSync, Min, Max } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  DATABASE_URL: string;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  JWT_EXPIRES_IN: string;

  @IsString()
  REFRESH_SECRET: string;

  @IsString()
  REFRESH_EXPIRES_IN: string;

  @IsString()
  APP_DEFAULT_TIMEZONE: string;

  @IsNumber()
  @Min(5)
  @Max(60)
  SLOT_GRANULARITY_MINUTES: number;

  @IsNumber()
  @IsOptional()
  PORT?: number;

  @IsString()
  @IsOptional()
  EMAIL_FROM?: string;

  @IsString()
  @IsOptional()
  EMAIL_SMTP_URL?: string;

  @IsString()
  @IsOptional()
  CORS_ORIGIN?: string;

  @IsString()
  WHATSAPP_INTEGRATION_TOKEN: string;
}

export function envValidation(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}

