import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DbModule } from './db/db.module';
import { AccountModule } from './account/account.module';
import { CompetitionModule } from './competition/competition.module';
import { PersonModule } from './person/person.module';
import { ResultModule } from './result/result.module';
import { AttemptModule } from './attempt/attempt.module';
import { SettingsModule } from './settings/settings.module';
import { StationModule } from './station/station.module';

@Module({
  imports: [
    DbModule,
    AuthModule,
    AccountModule,
    CompetitionModule,
    PersonModule,
    ResultModule,
    AttemptModule,
    SettingsModule,
    StationModule,
  ],
})
export class AppModule {}
