import { HttpClient, HttpParams } from '@angular/common/http';
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

  getReactionsForComment(commentId: number, page: number, pageSize: number): Observable<Reaction[]> {
     const params = new HttpParams()
          .set('page', page.toString())
          .set('pageSize', pageSize.toString());
          
    return this.http.get<Reaction[]>(`${this.apiUrl}/comment/${commentId}`, { params });
  }
}
