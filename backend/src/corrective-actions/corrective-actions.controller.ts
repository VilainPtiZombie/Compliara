import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, Request,
} from '@nestjs/common';
import {
  IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString,
} from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CorrectiveActionsService } from './corrective-actions.service';
import { ActionStatus, ImpactLevel } from '@prisma/client';

class CreateCorrectiveActionDto {
  @IsString() @IsNotEmpty() criterionResultId: string;
  @IsString() @IsOptional() title?: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() note?: string;
  @IsEnum(ImpactLevel) @IsOptional() priority?: ImpactLevel;
  @IsEnum(ActionStatus) @IsOptional() status?: ActionStatus;
  @IsString() @IsOptional() assignedToId?: string;
  @IsDateString() @IsOptional() dueDate?: string;
  @IsString() @IsOptional() sprint?: string;
}

class UpdateCorrectiveActionDto {
  @IsString() @IsOptional() title?: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() note?: string;
  @IsEnum(ImpactLevel) @IsOptional() priority?: ImpactLevel;
  @IsEnum(ActionStatus) @IsOptional() status?: ActionStatus;
  @IsString() @IsOptional() assignedToId?: string | null;
  @IsDateString() @IsOptional() dueDate?: string | null;
  @IsString() @IsOptional() sprint?: string;
  @IsString() @IsOptional() wontFixReason?: string;
}

class BatchCreateDto {
  @IsString() @IsNotEmpty() declarationId: string;
}

@UseGuards(JwtAuthGuard)
@Controller('corrective-actions')
export class CorrectiveActionsController {
  constructor(private readonly service: CorrectiveActionsService) {}

  @Get()
  findAll(
    @Request() req: any,
    @Query('declarationId') declarationId?: string,
    @Query('status') status?: string,
    @Query('sprint') sprint?: string,
    @Query('serviceId') serviceId?: string,
  ) {
    return this.service.findAll(req.user.tenantId, {
      declarationId,
      status,
      sprint,
      serviceId,
    });
  }

  // IMPORTANT: ces routes statiques doivent être AVANT /:id
  @Get('team-users')
  getTeamUsers(@Request() req: any) {
    return this.service.getTeamUsers(req.user.tenantId);
  }

  @Get('stats/:declarationId')
  getStats(@Request() req: any, @Param('declarationId') declarationId: string) {
    return this.service.getStats(declarationId, req.user.tenantId);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateCorrectiveActionDto) {
    return this.service.create(dto, req.user.tenantId);
  }

  @Post('batch')
  batchCreate(@Request() req: any, @Body() dto: BatchCreateDto) {
    return this.service.batchCreate(dto.declarationId, req.user.tenantId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.service.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCorrectiveActionDto,
  ) {
    return this.service.update(id, dto, req.user.tenantId);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.service.remove(id, req.user.tenantId);
  }
}
