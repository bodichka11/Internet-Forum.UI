import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Topic } from '../models/topic';

@Injectable({
  providedIn: 'root'
})
export class TopicService {
  private apiUrl = 'https://localhost:7070/api/Topic';

  constructor(private http: HttpClient) { }

  getAllTopics(): Observable<Topic[]> {
    return this.http.get<Topic[]>(this.apiUrl);
  }
}
