import { Role, Session } from '../../domain/models/session.model';
import { AuthResultDto } from '../http/dto/api.dto';

export function toSession(dto: AuthResultDto): Session {
  return {
    accessToken: dto.accessToken,
    expiresAt: new Date(dto.expiresAt),
    username: dto.username,
    role: dto.role as Role,
  };
}
