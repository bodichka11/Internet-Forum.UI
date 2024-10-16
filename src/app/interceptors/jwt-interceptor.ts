import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
    constructor(private authService: AuthService) {}

    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        const userToken = this.authService.getUserToken();
        console.log('Token in interceptor:', userToken); // Add this line
        
        if (userToken) {
            const requestWithAuth = request.clone({
                setHeaders: {
                    Authorization: `Bearer ${userToken}`
                }
            });
            return next.handle(requestWithAuth);
        }
    
        return next.handle(request);
    }
}
