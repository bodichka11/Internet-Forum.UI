import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { CommentCreateDto } from '../models/dto`s/comment/comment-create-dto';
import { CommentDto } from '../models/dto`s/comment/comment-dto';
import { PostCreateDto } from '../models/dto`s/post/post-create-dto';
import { PostUpdateDto } from '../models/dto`s/post/post-update-dto';
import { Post } from '../models/post';
import { Reaction } from '../models/reaction';
import { CommentService } from './comment.service';
import { PostService } from './post.service';
import { ReactionService } from './reaction.service';

@Injectable({
  providedIn: 'root'
})
export class PostManagmentService {

  constructor(
    private postService: PostService,
    private commentService: CommentService,
    private reactionService: ReactionService
  ) {}

  createPost(postData: PostCreateDto, images: File[]): Observable<Post> {
    return this.postService.createPost(postData, images);
  }

  updatePost(postId: number, postData: PostUpdateDto, images: File[]): Observable<Post> {
    return this.postService.updatePost(postId, postData, images);
  }

  deletePost(postId: number): Observable<void> {
    return this.postService.deletePost(postId);
  }

  addComment(commentData: CommentCreateDto): Observable<CommentDto> {
    return this.commentService.createComment(commentData);
  }

  updateComment(commentId: number, commentData: CommentDto): Observable<CommentDto> {
    return this.commentService.updateComment(commentId, commentData);
  }

  deleteComment(commentId: number): Observable<void> {
    return this.commentService.deleteComment(commentId);
  }

  addReaction(reaction: Reaction): Observable<any> {
    return this.reactionService.react(reaction);
  }

  searchPosts(term: string, page: number, pageSize: number): Observable<{posts: Post[], totalItems: number}> {
    if (term.trim() === '') {
      return this.postService.getPosts(page, pageSize);
    } else {
      return this.postService.searchPostsByTitle(term, page, pageSize).pipe(
        map(posts => ({
          posts: posts,
          totalItems: posts.length // Припускаємо, що всі результати пошуку повертаються одразу
        })),
        catchError(error => {
          console.error('Error searching posts:', error);
          return of({ posts: [], totalItems: 0 });
        })
      );
    }
  }
}
