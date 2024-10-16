import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthenticatedResponse } from '../models/authenticated-response';
@Injectable({
  providedIn: 'root'
})
export class AuthGuard{
  constructor(private router:Router, private jwtHelper: JwtHelperService, private http: HttpClient){}
  
  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const token = localStorage.getItem("jwt");
    if (token && !this.jwtHelper.isTokenExpired(token)){
      console.log(this.jwtHelper.isTokenExpired(token))
      return true;
    }
    const isRefreshSuccess = await this.tryRefreshingTokens(token); 
    if (!isRefreshSuccess) { 
      this.router.navigate(["login"]); 
    }
    return isRefreshSuccess;
  }

  private async tryRefreshingTokens(token: string | null): Promise<boolean> {
    const refreshToken: string | null = localStorage.getItem("refreshToken");
    if (!token || !refreshToken) { 
       return false;
    }
       
    const credentials = JSON.stringify({ accessToken: token, refreshToken: refreshToken });
    let isRefreshSuccess: boolean;
    const refreshRes = await new Promise<AuthenticatedResponse>((resolve, reject) => {
       this.http.post<AuthenticatedResponse>("https://localhost:7070/api/Token/refresh", credentials, {
         headers: new HttpHeaders({
           "Content-Type": "application/json"
         })
       }).subscribe({
         next: (res: AuthenticatedResponse) => resolve(res),
         error: (error: any) => { reject(error); isRefreshSuccess = false;}
       });
    });
    localStorage.setItem("accessToken", refreshRes.accessToken);
    localStorage.setItem("refreshToken", refreshRes.refreshToken);
    isRefreshSuccess = true;
    return isRefreshSuccess;
   }
}