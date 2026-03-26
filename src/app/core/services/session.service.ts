import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { UserRole } from '../types/user-role.type';

export interface SessionUser {
    id: number;
    fullName: string;
    role: UserRole;
}

@Injectable({
    providedIn: 'root'
})
export class SessionService {
    private currentUser: SessionUser;

    constructor(@Inject(PLATFORM_ID) private platformId: object) {
        this.currentUser = this.loadUser();
    }

    get user(): SessionUser {
        return this.currentUser;
    }

    get role(): UserRole {
        return this.currentUser.role;
    }

    setRole(role: UserRole): void {
        this.currentUser = {
            ...this.currentUser,
            role
        };
    }

    logout(): void {
        this.currentUser = {
            id: 1,
            fullName: 'Mendoza',
            role: 'JEFE_SEGURIDAD'
        };
    }

    private loadUser(): SessionUser {
        return {
            id: 1,
            fullName: 'Tetsu',
            role: 'ADMINISTRADOR'
        };
    }
}