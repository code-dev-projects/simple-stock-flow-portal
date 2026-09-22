import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Credentials, Session } from '../../domain/models/session.model';
import { AuthRepositoryPort } from '../../application/ports/auth-repository.port';
import { environment } from '../../../environments/environment';
import { AuthResultDto } from './dto/api.dto';
import { toSession } from '../mappers/session.mapper';

@Injectable()
export class HttpAuthRepository extends AuthRepositoryPort {
  private readonly http = inject(HttpClient);

  async login(credentials: Credentials): Promise<Session> {
    const dto = await firstValueFrom(
      this.http.post<AuthResultDto>(`${environment.apiUrl}/auth/login`, credentials),
    );
    return toSession(dto);
  }

  /** E-02 answers 201 with the id alone and no Location header (D-C6). */
  async registerSeller(credentials: Credentials): Promise<string> {
    const created = await firstValueFrom(
      this.http.post<{ id: string }>(`${environment.apiUrl}/auth/register`, {
        ...credentials,
        role: 'seller',
      }),
    );
    return created.id;
  }
}
