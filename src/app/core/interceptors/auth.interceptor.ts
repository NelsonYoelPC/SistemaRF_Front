import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionService } from '../services/session.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const sessionService = inject(SessionService);
    const token = sessionService.token;

    const isApiRequest = req.url.startsWith(environment.apiUrl);

    if (!isApiRequest) {
        return next(req);
    }

    const headers: Record<string, string> = {
        Accept: 'application/json'
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const authReq = req.clone({
        setHeaders: headers
    });

    return next(authReq);
};