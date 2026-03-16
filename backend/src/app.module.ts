import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';
import { ServicesModule } from './services/services.module';
import { DeclarationsModule } from './declarations/declarations.module';
import { PublicModule } from './public/public.module';
import { CorrectiveActionsModule } from './corrective-actions/corrective-actions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    ServicesModule,
    DeclarationsModule,
    PublicModule,
    CorrectiveActionsModule,
  ],
})
export class AppModule {}
