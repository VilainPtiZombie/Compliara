import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DeclarationsService } from './declarations.service';
import { DeclarationsController } from './declarations.controller';
import { RgaaExcelParserService } from './import/rgaa-excel-parser.service';
import { RgaaImportService } from './import/rgaa-import.service';

@Module({
  imports: [
    MulterModule.register({ storage: memoryStorage() }),
  ],
  providers: [DeclarationsService, RgaaExcelParserService, RgaaImportService],
  controllers: [DeclarationsController],
})
export class DeclarationsModule {}
