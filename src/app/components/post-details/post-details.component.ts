import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactionType } from 'src/app/enums/reaction-type';
import { CommentCreateDto } from 'src/app/models/dto`s/comment/comment-create-dto';
import { CommentDto } from 'src/app/models/dto`s/comment/comment-dto';
import { Post } from 'src/app/models/post';
import { Reaction } from 'src/app/models/reaction';
import { User } from 'src/app/models/user';
import { CommentService } from 'src/app/services/comment.service';
import { PostService } from 'src/app/services/post.service';
import { ReactionService } from 'src/app/services/reaction.service';
import { TopicService } from 'src/app/services/topic.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-post-details',
  templateUrl: './post-details.component.html',
  styleUrls: ['./post-details.component.css']
})
export class PostDetailsComponent {
  post: Post | null = null;
  errorMessage: string = '';
  currentUserId!: number;
  topics: any[] = [];
  user!: User;
  username: string | null = null;
  title: string | null = null;

  constructor(
    private route: ActivatedRoute,
  private router: Router,
  private postService: PostService,
  private topicService: TopicService,
  private userService: UserService,
  private commentService: CommentService,
  private reactionService: ReactionService
  ) {}

  ngOnInit(): void {
    const postId = this.route.snapshot.paramMap.get('id');
    this.username = this.route.snapshot.queryParamMap.get('username');
    this.title = this.route.snapshot.queryParamMap.get('title');
  
    console.log('Post ID:', postId);
    console.log('username:', this.username);
    console.log('Title:', this.title);
    if (postId) {
      this.loadPost(postId);
    }
    this.loadTopics();
    this.getCurrentUser();
  }

  getCurrentUser(): void {
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.user = user;
        this.currentUserId = user.id;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = `Cannot load user data: ${error.message}`;
      }
    });
  }

  private loadPost(postId: string): void {
    this.postService.getPostById(+postId).subscribe({
      next: (post) => {
        this.post = post;
        if (post.userId && !post.author) {
          this.userService.getUser(post.userId).subscribe(user => {
            post.author = user;
          });
        }
        post.comments?.forEach(comment => {
          this.userService.getUser(comment.userId).subscribe(user => {
            comment.author = user;
          });
          this.reactionService.getReactionsForComment(comment.id, 1, 10).subscribe(reactions => {
            comment.reactions = reactions;
          });
        });
      },
      error: (error) => this.errorMessage = 'Error loading post: ' + error.message
    });
  }

  private loadTopics(): void {
    this.topicService.getAllTopics().subscribe({
      next: (topics) => {
        this.topics = topics;
      },
      error: (error) => {
        console.error('Error loading topics:', error);
      }
    });
  }

  onEditPost(post: Post): void {
    // Перенаправлення на сторінку редагування з параметрами
    this.router.navigate(['/edit-post', post.id], {
      state: { post }
    });
  }
  
  onDeletePost(post: Post): void {
    if (confirm('Are you sure you want to delete this post?')) {
      this.postService.deletePost(post.id).subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (error) => {
          this.errorMessage = 'Failed to delete post: ' + error.message;
        }
      });
    }
  }
  
  onReactToPost(event: { post: Post, reactionType: ReactionType }): void {
    const reaction: Reaction = {
      id: 0, // Default value for id
      postId: event.post.id,
      userId: this.currentUserId,
      type: event.reactionType
    };
  
    this.reactionService.react(reaction).subscribe({
      next: () => {
        this.loadPost(event.post.id.toString());
      },
      error: (error) => {
        this.errorMessage = 'Failed to react to post: ' + error.message;
      }
    });
  }
  
  onAddCommentToPost(event: { postId: number, content: string }): void {
    if (!event.content.trim()) return;
  
    const newComment: CommentCreateDto = {
      postId: event.postId,
      content: event.content
    };
  
    this.commentService.createComment(newComment).subscribe({
      next: (comment) => {
        if (this.post) {
          this.post.comments = this.post.comments || [];
          this.post.comments.push(comment);
        }
      },
      error: (error) => {
        this.errorMessage = 'Failed to add comment: ' + error.message;
      }
    });
  }
  
  onEditComment(event: { comment: any, content: string }): void {
    const updatedComment: CommentDto = {
      ...event.comment,
      content: event.content
    };
  
    this.commentService.updateComment(event.comment.id, updatedComment).subscribe({
      next: (updatedComment) => {
        if (this.post) {
          const index = this.post.comments.findIndex(c => c.id === event.comment.id);
          if (index !== -1) {
            this.post.comments[index] = updatedComment;
          }
          this.loadPost(this.post.id.toString());
        }
      },
      error: (error) => {
        this.errorMessage = 'Failed to update comment: ' + error.message;
      }
    });
  }
  
  onDeleteComment(comment: any): void {
    if (confirm('Are you sure you want to delete this comment?')) {
      this.commentService.deleteComment(comment.id).subscribe({
        next: () => {
          if (this.post) {
            this.post.comments = this.post.comments.filter(c => c.id !== comment.id);
          }
        },
        error: (error) => {
          this.errorMessage = 'Failed to delete comment: ' + error.message;
        }
      });
    }
  }
  
  onReactToComment(event: { comment: any, reactionType: ReactionType }): void {
    const reaction: Reaction = {
      id: 0, // Default value for id
      commentId: event.comment.id,
      userId: this.currentUserId,
      type: event.reactionType,
    };
  
    this.reactionService.react(reaction).subscribe({
      next: () => {
        this.loadPost(this.post!.id.toString());
      },
      error: (error) => {
        this.errorMessage = 'Failed to react to comment: ' + error.message;
      }
    });
  }

  getImageUrl(imagePath: string): string {
    return this.postService.getImageUrl(imagePath);
  }

  onImageError(event: any) {
    event.target.src = this.postService.getPlaceholderImage();
  }
}
