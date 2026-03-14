import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { IsString, IsUrl, IsOptional, IsNotEmpty } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ServicesService } from './services.service';

class CreateServiceDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() url: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() technologies?: string;
  @IsString() @IsOptional() contactName?: string;
  @IsString() @IsOptional() contactEmail?: string;
  @IsString() @IsOptional() contactPhone?: string;
}

@UseGuards(JwtAuthGuard)
@Controller('services')
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.servicesService.findAll(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.servicesService.findOne(id, req.user.tenantId);
  }

  @Post()
  create(@Body() body: CreateServiceDto, @Request() req: any) {
    return this.servicesService.create(body, req.user.tenantId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<CreateServiceDto>, @Request() req: any) {
    return this.servicesService.update(id, body, req.user.tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.servicesService.remove(id, req.user.tenantId);
  }
}
