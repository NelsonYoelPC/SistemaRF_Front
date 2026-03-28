import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { UserRole } from '../types/user-role.type';

export interface SessionUser {
    id: number;
    usuarioId: number;
    username: string;
    fullName: string;
    email: string;
    roleId: number;
    role: UserRole;
    roleDescription: string;
    token: string;
}

@Injectable({
    providedIn: 'root'
})
export class SessionService {
    private readonly storageKey = 'session_user';
    private readonly currentUserSubject = new BehaviorSubject<SessionUser | null>(null);

    constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {
        this.currentUserSubject.next(this.loadUser());
    }

    get user$() {
        return this.currentUserSubject.asObservable();
    }

    get user(): SessionUser | null {
        return this.currentUserSubject.value;
    }

    get role(): UserRole | null {
        return this.user?.role ?? null;
    }

    get token(): string | null {
        return this.user?.token ?? null;
    }

    isAuthenticated(): boolean {
        return !!this.token;
    }

    setSession(user: SessionUser): void {
        this.currentUserSubject.next(user);

        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(this.storageKey, JSON.stringify(user));
        }
    }

    clearSession(): void {
        this.currentUserSubject.next(null);

        if (isPlatformBrowser(this.platformId)) {
            localStorage.removeItem(this.storageKey);
        }
    }

    private loadUser(): SessionUser | null {
        if (!isPlatformBrowser(this.platformId)) {
            return null;
        }

        const raw = localStorage.getItem(this.storageKey);
        if (!raw) {
            return null;
        }

        try {
            return JSON.parse(raw) as SessionUser;
        } catch {
            localStorage.removeItem(this.storageKey);
            return null;
        }
    }
}