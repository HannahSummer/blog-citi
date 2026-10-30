import { Module } from '@nestjs/common'
import { RadarController } from './radar.controller'
import { RadarGuard } from './radar.guard'

@Module({ controllers: [RadarController], providers: [RadarGuard] })
export class RadarModule {}
