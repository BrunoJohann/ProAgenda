import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async updateSettings(tenantId: string, filialId: string, dto: UpdateSettingsDto) {
    // Validate slot granularity
    if (dto.slotGranularity !== null && dto.slotGranularity !== undefined) {
      this.validateSlotGranularity(dto.slotGranularity);
    }

    // Upsert settings
    const settings = await this.prisma.filialSettings.upsert({
      where: { filialId },
      create: {
        tenantId,
        filialId,
        slotGranularity: dto.slotGranularity,
      },
      update: {
        slotGranularity: dto.slotGranularity,
      },
    });

    return settings;
  }

  async getSettings(filialId: string) {
    return this.prisma.filialSettings.findUnique({
      where: { filialId },
    });
  }

  /**
   * Get effective slot granularity for a filial (with fallback to env)
   */
  async getSlotGranularity(filialId: string): Promise<number> {
    const settings = await this.getSettings(filialId);

    if (settings?.slotGranularity) {
      return settings.slotGranularity;
    }

    // Fallback to environment variable
    return this.configService.get<number>('SLOT_GRANULARITY_MINUTES', 15);
  }

  private validateSlotGranularity(value: number) {
    const validValues = [5, 10, 15, 20, 30, 60];

    if (!validValues.includes(value)) {
      throw new BadRequestException(
        `Slot granularity must be one of: ${validValues.join(', ')} (must be a divisor of 60)`,
      );
    }
  }
}

