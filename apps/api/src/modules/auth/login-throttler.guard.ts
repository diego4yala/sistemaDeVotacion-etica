import { Injectable } from '@nestjs/common';
import { ThrottlerException, ThrottlerGuard } from '@nestjs/throttler';

/** Rate limit del login: cuenta los intentos por IP y código de usuario. */
@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const codigo = typeof req.body?.codigo === 'string' ? req.body.codigo.trim().toLowerCase() : '';
    return `${req.ip}:${codigo}`;
  }

  protected async throwThrottlingException(): Promise<void> {
    throw new ThrottlerException('Demasiados intentos. Espera un minuto e inténtalo de nuevo.');
  }
}
