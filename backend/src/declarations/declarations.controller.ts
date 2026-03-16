import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Query,
  Put,
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MulterFile = any;
import {
  IsString,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DeclarationsService } from './declarations.service';
import { RgaaImportService } from './import/rgaa-import.service';

// ── DTOs déclaration ──────────────────────────────────────────────────────────

class CreatePageDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() url: string;
  @IsString() @IsOptional() pageType?: string;
}

class CreateDeclarationDto {
  @IsString() @IsNotEmpty() serviceId: string;
  @IsString() @IsOptional() rgaaVersion?: string;
  @IsDateString() @IsOptional() dateAudit?: string;
  @IsString() @IsOptional() auditCompany?: string;
  @IsString() @IsOptional() contactName?: string;
  @IsString() @IsOptional() contactEmail?: string;
  @IsString() @IsOptional() contactPhone?: string;
  @IsString() @IsOptional() tools?: string;
  @IsArray() @IsOptional() @ValidateNested({ each: true }) @Type(() => CreatePageDto) pages?: CreatePageDto[];
}

class UpdateDeclarationDto {
  @IsString() @IsOptional() rgaaVersion?: string;
  @IsDateString() @IsOptional() dateAudit?: string;
  @IsString() @IsOptional() status?: string;
  @IsString() @IsOptional() auditCompany?: string;
  @IsString() @IsOptional() contactName?: string;
  @IsString() @IsOptional() contactEmail?: string;
  @IsString() @IsOptional() contactPhone?: string;
  @IsString() @IsOptional() tools?: string;
}

// ── DTOs audit ────────────────────────────────────────────────────────────────

class UpdatePageDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() url: string;
  @IsString() @IsOptional() pageType?: string;
}

class UpdatePagesBodyDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => UpdatePageDto)
  pages: UpdatePageDto[];
}

class CriterionUpdateDto {
  @IsString() @IsNotEmpty() criterionRef: string;
  @IsString() @IsNotEmpty() status: string;
  @IsString() @IsOptional() comment?: string;
  @IsString() @IsOptional() impact?: string;
  @IsArray() @IsOptional() affectedPageIds?: string[];
}

class BulkCriteriaBodyDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => CriterionUpdateDto)
  criteria: CriterionUpdateDto[];
}

class SingleCriterionUpdateDto {
  @IsString() @IsNotEmpty() status: string;
  @IsString() @IsOptional() comment?: string;
  @IsString() @IsOptional() impact?: string;
  @IsArray() @IsOptional() affectedPageIds?: string[];
}

// ── Controller ────────────────────────────────────────────────────────────────

@UseGuards(JwtAuthGuard)
@Controller('declarations')
export class DeclarationsController {
  constructor(
    private declarationsService: DeclarationsService,
    private importService: RgaaImportService,
  ) {}

  // ── Créer une déclaration manuellement ─────────────────────────────────────
  @Post()
  create(@Body() body: CreateDeclarationDto, @Request() req: any) {
    return this.declarationsService.create(body, req.user.tenantId);
  }

  // ── Statistiques du tenant ─────────────────────────────────────────────────
  @Get('stats')
  stats(@Request() req: any) {
    return this.declarationsService.stats(req.user.tenantId);
  }

  // ── Lister les déclarations du tenant ──────────────────────────────────────
  @Get()
  findAll(@Request() req: any, @Query('serviceId') serviceId?: string) {
    return this.declarationsService.findAll(req.user.tenantId, serviceId);
  }

  // ── Détail d'une déclaration ───────────────────────────────────────────────
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.declarationsService.findOne(id, req.user.tenantId);
  }

  // ── Modifier une déclaration ───────────────────────────────────────────────
  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateDeclarationDto, @Request() req: any) {
    return this.declarationsService.update(id, body, req.user.tenantId);
  }

  // ── Initialiser l'audit (génère les 106 CriterionResult NON_AUDITE) ────────
  @Post(':id/audit/init')
  initAudit(@Param('id') id: string, @Request() req: any) {
    return this.declarationsService.initAudit(id, req.user.tenantId);
  }

  // ── Remplacer les pages auditées ───────────────────────────────────────────
  @Put(':id/audit/pages')
  updatePages(
    @Param('id') id: string,
    @Body() body: UpdatePagesBodyDto,
    @Request() req: any,
  ) {
    return this.declarationsService.updatePages(id, req.user.tenantId, body.pages);
  }

  // ── Mise à jour bulk des critères (sauvegarde brouillon) ───────────────────
  @Put(':id/audit/criteria')
  bulkUpdateCriteria(
    @Param('id') id: string,
    @Body() body: BulkCriteriaBodyDto,
    @Request() req: any,
  ) {
    return this.declarationsService.bulkUpdateCriteria(id, req.user.tenantId, body.criteria);
  }

  // ── Mise à jour d'un seul critère (auto-save) ──────────────────────────────
  @Patch(':id/audit/criteria/:ref')
  updateCriterion(
    @Param('id') id: string,
    @Param('ref') ref: string,
    @Body() body: SingleCriterionUpdateDto,
    @Request() req: any,
  ) {
    return this.declarationsService.updateCriterion(id, ref, req.user.tenantId, body);
  }

  // ── Import Excel ───────────────────────────────────────────────────────────
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType: /(spreadsheetml|ms-excel|opendocument\.spreadsheet)/,
          }),
        ],
        fileIsRequired: true,
      }),
    )
    file: MulterFile,
    @Body('serviceId') serviceId: string,
    @Request() req: any,
  ) {
    return this.importService.importFromBuffer(
      file.buffer,
      serviceId,
      req.user.tenantId,
    );
  }
}
