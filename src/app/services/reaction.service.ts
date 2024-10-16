import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Reaction } from '../models/reaction';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReactionService {
  private apiUrl = "https://localhost:7070/api/Reaction";

  constructor(private http: HttpClient) { }

  react(reaction: Reaction): Observable<any>{
    return this.http.post<any>(`${this.apiUrl}/toggle`, reaction);
  }
}
