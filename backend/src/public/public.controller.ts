import { Controller, Get, Param } from '@nestjs/common';
import { PublicService } from './public.service';

@Controller('public')
export class PublicController {
  constructor(private publicService: PublicService) {}

  @Get(':token')
  findByToken(@Param('token') token: string) {
    return this.publicService.findByToken(token);
  }
}
