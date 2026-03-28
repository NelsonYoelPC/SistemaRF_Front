import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionService } from '../services/session.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const sessionService = inject(SessionService);
    const token = sessionService.token;

    const isApiRequest = req.url.startsWith(environment.apiUrl);
    const isLoginRequest = req.url.endsWith('/login');

    if (!token || !isApiRequest || isLoginRequest) {
        return next(req);
    }

    const authReq = req.clone({
        setHeaders: {
            Authorization: `Bearer ${token}`
        }
    });

    return next(authReq);
};