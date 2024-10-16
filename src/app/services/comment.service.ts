import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommentCreateDto } from '../models/dto`s/comment/comment-create-dto';
import { Observable } from 'rxjs';
import { CommentDto } from '../models/dto`s/comment/comment-dto';
import { Comment } from '../models/comment';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private apiUrl = "https://localhost:7070/api/Comment"
  constructor(private http: HttpClient) { }

  createComment(comment: CommentCreateDto): Observable<CommentDto>{
    return this.http.post<CommentDto>(this.apiUrl, comment);
  }

  updateComment(id: number, comment: CommentDto): Observable<CommentDto>{
    return this.http.put<CommentDto>(`${this.apiUrl}/${id}`, comment);
  }

  deleteComment(id: number): Observable<void>{
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getCommentById(id: number): Observable<Comment> {
    return this.http.get<Comment>(`${this.apiUrl}/${id}`);
  }
}
