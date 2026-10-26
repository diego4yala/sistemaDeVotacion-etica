import { Global, Module } from '@nestjs/common';
import { ResultadosGateway } from './resultados.gateway';

@Global()
@Module({ providers: [ResultadosGateway], exports: [ResultadosGateway] })
export class RealtimeModule {}
