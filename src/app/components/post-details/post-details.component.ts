import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReactionType } from 'src/app/enums/reaction-type';
import { Post } from 'src/app/models/post';
import { User } from 'src/app/models/user';
import { PostService } from 'src/app/services/post.service';
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
    private postService: PostService,
    private topicService: TopicService,
    private userService: UserService
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
    console.log('Edit post:', post);
    // Write your logic to edit the post
  }

  onDeletePost(post: Post): void {
    console.log('Delete post:', post);
    // Write your logic to delete the post
  }

  onReactToPost(event: { post: Post, reactionType: ReactionType }): void {
    console.log('React to post:', event);
    // Write your logic to react to the post
  }

  onAddCommentToPost(event: { postId: number, content: string }): void {
    console.log('Add comment to post:', event);
    // Write your logic to add comment to the post
  }

  onEditComment(event: { comment: any, content: string }): void {
    console.log('Edit comment:', event);
    // Write your logic to edit comment
  }

  onDeleteComment(comment: any): void {
    console.log('Delete comment:', comment);
    // Write your logic to delete comment
  }

  onReactToComment(event: { comment: any, reactionType: ReactionType }): void {
    console.log('React to comment:', event);
    // Write your logic to react to the comment
  }

  getImageUrl(imagePath: string): string {
    return this.postService.getImageUrl(imagePath);
  }

  onImageError(event: any) {
    event.target.src = this.postService.getPlaceholderImage();
  }
}
