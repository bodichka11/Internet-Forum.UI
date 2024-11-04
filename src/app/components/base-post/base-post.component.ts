import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ReactionType } from 'src/app/enums/reaction-type';
import { Comment } from 'src/app/models/comment';
import { Post } from 'src/app/models/post';
import { Topic } from 'src/app/models/topic';
import { User } from 'src/app/models/user';
import { PostManagmentService } from 'src/app/services/post-managment.service';
import { TopicService } from 'src/app/services/topic.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-base-post',
  templateUrl: './base-post.component.html',
  styleUrls: ['./base-post.component.css']
})
export class BasePostComponent {
  posts: Post[] = [];
  currentUser: User | null = null;
  topics: Topic[] = [];
  errorMessage = '';
  
  constructor(
    protected fb: FormBuilder,
    protected postManagement: PostManagmentService,
    protected userService: UserService,
    protected topicService: TopicService
  ) {}

  ngOnInit() {
    this.loadTopics();
    this.getCurrentUser();
  }

  loadTopics(): void {
    this.topicService.getAllTopics().subscribe({
      next: (topics) => {
        this.topics = topics;
      },
      error: (error) => {
        console.error('Error loading topics:', error);
      }
    });
  }

  getCurrentUser(): void {
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
      },
      error: (error) => {
        this.errorMessage = `Cannot load user data: ${error.message}`;
      }
    });
  }

  onDeletePost(post: Post): void {
    if (confirm('Are you sure you want to delete this post?')) {
      this.postManagement.deletePost(post.id).subscribe({
        next: () => {
          this.posts = this.posts.filter(p => p.id !== post.id);
        },
        error: (error: { message: any; }) => {
          this.errorMessage = `Error deleting post: ${error.message}`;
        }
      });
    }
  }

  onReact(event: { post: Post, reactionType: ReactionType }): void {
    const reaction = {
      id: 0,
      userId: this.currentUser?.id ?? 0,
      postId: event.post.id,
      type: event.reactionType
    };
    this.postManagement.addReaction(reaction).subscribe({
      next: () => this.loadPosts(),
      error: (error: { message: any; }) => this.errorMessage = `Error reacting to post: ${error.message}`
    });
  }

  onAddComment(event: { postId: number, content: string }): void {
    this.postManagement.addComment(event).subscribe({
      next: (comment: Comment) => {
        const post = this.posts.find(p => p.id === event.postId);
        if (post) {
          post.comments.push(comment);
        }
        this.loadPosts();
      },
      error: (error: { message: any; }) => this.errorMessage = `Error adding comment: ${error.message}`
    });
  }

  onEditComment(event: { comment: any, content: string }): void {
    this.postManagement.updateComment(event.comment.id, { ...event.comment, content: event.content }).subscribe({
      next: (updatedComment: Comment) => {
        const post = this.posts.find(p => p.comments.some(c => c.id === event.comment.id));
        if (post) {
          const commentIndex = post.comments.findIndex(c => c.id === event.comment.id);
          if (commentIndex !== -1) {
            post.comments[commentIndex] = updatedComment;
          }
        }
        this.loadPosts();
      },
      error: (error: { message: any; }) => this.errorMessage = `Error updating comment: ${error.message}`
    });
  }

  onDeleteComment(comment: any): void {
    if (confirm('Are you sure you want to delete this comment?')) {
      this.postManagement.deleteComment(comment.id).subscribe({
        next: () => {
          const post = this.posts.find(p => p.comments.some(c => c.id === comment.id));
          if (post) {
            post.comments = post.comments.filter(c => c.id !== comment.id);
          }
        },
        error: (error: { message: any; }) => this.errorMessage = `Error deleting comment: ${error.message}`
      });
    }
  }

  onReactToComment(event: { comment: any, reactionType: ReactionType }): void {
    const reaction = {
      id: 0,
      userId: this.currentUser?.id ?? 0,
      commentid: event.comment.id,
      type: event.reactionType
    };
    this.postManagement.addReaction(reaction).subscribe({
      next: () => this.loadPosts(),
      error: (error: { message: any; }) => this.errorMessage = `Error reacting to comment: ${error.message}`
    });
  }

  loadPosts(): void {
    // This method should be implemented in child components
  }
}
