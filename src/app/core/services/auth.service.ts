import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, tap } from 'rxjs';

import { SessionService, SessionUser } from './session.service';
import { UserRole } from '../types/user-role.type';
import { environment } from '../../../environments/environment';

interface LoginRequest {
    name: string;
    password: string;
}

interface LoginResponse {
    success: boolean;
    message: string;
    data: {
        token: string;
        user: {
            id: number;
            usuario_id: number;
            username: string;
            full_name: string;
            email: string;
            role_id: number;
            role: UserRole;
            role_description: string;
        };
    };
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly apiUrl = environment.apiUrl;

    constructor(
        private readonly http: HttpClient,
        private readonly sessionService: SessionService
    ) { }

    login(payload: LoginRequest): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.apiUrl}/login`, payload).pipe(
            tap((response) => {
                const user = response.data.user;

                const sessionUser: SessionUser = {
                    id: user.id,
                    usuarioId: user.usuario_id,
                    username: user.username,
                    fullName: user.full_name,
                    email: user.email,
                    roleId: user.role_id,
                    role: user.role,
                    roleDescription: user.role_description,
                    token: response.data.token
                };

                this.sessionService.setSession(sessionUser);
            })
        );
    }

    logout(): Observable<void> {
        return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
            map(() => void 0),
            tap(() => this.sessionService.clearSession()),
            catchError(() => {
                this.sessionService.clearSession();
                return of(void 0);
            })
        );
    }

    me(): Observable<LoginResponse['data']['user']> {
        return this.http.get<{ success: boolean; data: { user: LoginResponse['data']['user'] } }>(`${this.apiUrl}/me`).pipe(
            map((response) => response.data.user)
        );
    }
}