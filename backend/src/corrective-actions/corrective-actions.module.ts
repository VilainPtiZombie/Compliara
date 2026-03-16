import { Module } from '@nestjs/common';
import { CorrectiveActionsService } from './corrective-actions.service';
import { CorrectiveActionsController } from './corrective-actions.controller';

@Module({
  providers: [CorrectiveActionsService],
  controllers: [CorrectiveActionsController],
})
export class CorrectiveActionsModule {}
