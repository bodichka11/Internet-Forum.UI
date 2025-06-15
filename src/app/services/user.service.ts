import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UserLogin } from '../models/user-login';
import { map, Observable, tap } from 'rxjs';
import { AuthenticatedResponse } from '../models/authenticated-response';
import { UserRegister } from '../models/user-register';
import { RegisteredResponse } from '../models/registered-response';
import { User } from '../models/user';
import { UpdateConfirmDto } from '../models/dto`s/user/update-confirm';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'https://localhost:7070/api/User';
  private baseUrl = 'https://localhost:7070';

  constructor(private http: HttpClient) { }

  login(userLogin: UserLogin): Observable<AuthenticatedResponse>
  {
    return this.http.post<AuthenticatedResponse>(`${this.apiUrl}/login`, userLogin);
  }

  register(userRegister: UserRegister): Observable<RegisteredResponse>
  {
    return this.http.post<RegisteredResponse>(`${this.apiUrl}/register`, userRegister);
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/current`).pipe(
      map(user => ({
        ...user,
        imageUrl: user.imageUrl ? `${this.baseUrl}${user.imageUrl}` : null
      } as User)),
      tap(user => {
        localStorage.setItem('userInfo', JSON.stringify(user));
        localStorage.setItem('currentUser', JSON.stringify(user));
      })
    );
  }

  getUser(id: number): Observable<User>
  {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }
  
  updateUser(user: User): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}`, user);
  }

  confirmUpdate(updatedUser: UpdateConfirmDto): Observable<string> {
    return this.http.post(`${this.apiUrl}/confirm-update`, { updatedUser }, { responseType: 'text' }).pipe(
      tap(() => {
      })
    );
  }
  

  getCurrentUserFromLocalStorage(): User | null {
    const user = localStorage.getItem('userInfo');
    return user ? JSON.parse(user) : null;
  }

  setCurrentUserInLocalStorage(user: User): void {
  localStorage.setItem('currentUser', JSON.stringify(user));
  }

  uploadAvatar(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
  
    return this.http.post<{ avatarUrl: string }>(`${this.apiUrl}/avatar`, formData)
      .pipe(
        map(response => `${this.baseUrl}${response.avatarUrl}`),
        tap(avatarUrl => {
          const currentUser = this.getCurrentUserFromLocalStorage();
          if (currentUser) {
            currentUser.imageUrl = avatarUrl;
            localStorage.setItem('userInfo', JSON.stringify(currentUser));
          }
        })
      );
    }
}
