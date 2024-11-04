import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Post } from '../models/post';
import { PostCreateDto } from '../models/dto`s/post/post-create-dto';
import { PostUpdateDto } from '../models/dto`s/post/post-update-dto';
import { CreatePostOnlyTitleRequestDto } from '../models/dto`s/post/post-create-onlytitle.dto';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private apiUrl = "https://localhost:7070/api/Post";
  private baseApiUrl = "https://localhost:7070"

  constructor(private http: HttpClient) { }

  getPosts(page: number, pageSize: number): Observable<{ posts: Post[], totalItems: number }> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<{ posts: Post[], totalItems: number }>(this.apiUrl, { params });
  }

  getPostById(id: number): Observable<Post> {
    return this.http.get<Post>(`${this.apiUrl}/${id}`);
  }

  deletePost(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getUsersPosts(): Observable<Post[]>{
    return this.http.get<Post[]>(`${this.apiUrl}/my-posts`);
  }

  getPopularPosts(count: number): Observable<Post[]> {
    const params = new HttpParams().set('count', count.toString());
    return this.http.get<Post[]>(`${this.apiUrl}/popular`, { params });
  }

  searchPostsByTitle(title: string, page: number, pageSize: number): Observable<Post[]> {
    const params = new HttpParams()
      .set('title', title)
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<Post[]>(`${this.apiUrl}/search`, { params });
  }


  createPost(post: PostCreateDto, images: File[]): Observable<Post> {
    const formData = new FormData();
    formData.append('topicId', post.topicId.toString());
    formData.append('title', post.title);
    formData.append('content', post.content);
    post.tags.forEach((tag, index) => {
      formData.append(`tags[${index}].name`, tag.name);
    });
    images.forEach(image => {
      formData.append('images', image, image.name);
    });
    return this.http.post<Post>(this.apiUrl, formData);
  }

  updatePost(id: number, post: PostUpdateDto, images: File[]): Observable<Post> {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('title', post.title);
    formData.append('content', post.content);
    formData.append('topicId', post.topicId.toString());
    post.tags.forEach((tag, index) => {
      formData.append(`tags[${index}].name`, tag.name);
    });
    images.forEach(image => {
      formData.append('images', image, image.name);
    });
    return this.http.put<Post>(`${this.apiUrl}/${id}`, formData);
  }

  generatePost(createPostRequest: CreatePostOnlyTitleRequestDto): Observable<Post> {
    return this.http.post<Post>(`${this.apiUrl}/generate`, createPostRequest);
  }

  getImageUrl(imagePath: string): string {
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    return `${this.baseApiUrl}${imagePath}`;
  }

  getPlaceholderImage(): string {
    return 'assets/placeholder-image.png';
  }

  searchPosts(term: string, page: number, pageSize: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/search?term=${term}&page=${page}&pageSize=${pageSize}`);
  }
  
}
