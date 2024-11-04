import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ReactionType } from 'src/app/enums/reaction-type';
import { Post } from 'src/app/models/post';
import { Reaction } from 'src/app/models/reaction';
import { Topic } from 'src/app/models/topic';
import { PostService } from 'src/app/services/post.service';
import { ReactionService } from 'src/app/services/reaction.service';
import { TopicService } from 'src/app/services/topic.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-popular-posts',
  templateUrl: './popular-posts.component.html',
  styleUrls: ['./popular-posts.component.css']
})
export class PopularPostsComponent implements OnInit {
  popularPosts: Post[] = [];
  currentUserId: number | undefined;
  errorMessage: string = '';
  topics: Topic[] = [];
  showPopularPosts: boolean = false;

  constructor(
    private postService: PostService,
    private reactionService: ReactionService,
    private userService: UserService,
    private topicService: TopicService
  ) { }

  ngOnInit(): void {
    this.getCurrentUserId();
    this.loadTopics();
    this.loadPopularPosts();
  }

  togglePopularPosts(): void {
    this.showPopularPosts = !this.showPopularPosts;
    if (this.showPopularPosts) {
      this.loadPopularPosts();
    } else {
      this.popularPosts = [];
    }
  }

  loadPopularPosts(): void {
    const count = 10;
    this.postService.getPopularPosts(count).subscribe(posts => {
      this.popularPosts = posts;
      this.popularPosts.forEach((post) => {
        this.getUser(post);
      });
    });
  }

  loadTopics(): void {
    this.topicService.getAllTopics().subscribe({
      next: (topics: Topic[]) => {
        this.topics = topics;
      },
      error: (error: any) => {
        console.error('Error loading topics:', error);
      }
    });
  }

  getCurrentUserId(): void {
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUserId = user.id;
      },
      error: (error) => {
        this.errorMessage = `Cannot load user data: ${error.message}`;
      }
    });
  }

  getUser(post: Post): void {
    this.userService.getUser(post.userId).subscribe({
      next: (user) => {
        post.author = user;
      },
      error: (error) => {
        this.errorMessage = `No user with id ${post.userId}: ${error.message}`;
      },
    });
  }

  onEdit(post: Post): void {
    // Handle edit logic
    console.log('Edit post:', post);
  }

  onDelete(post: Post): void {
    // Handle delete logic
    console.log('Delete post:', post);
  }

  onReact(event: { post: Post, reactionType: ReactionType }): void {
    this.reactionService.react({
      id: 0,
      userId: this.currentUserId!,
      postId: event.post.id,
      type: event.reactionType
    }).subscribe({
      next: () => this.loadPopularPosts(),
      error: (error) => this.errorMessage = `Error reacting to post: ${error.message}`,
    });
  }

  onAddComment(event: { postId: number, content: string }): void {
    // Handle add comment logic
    console.log('Add comment:', event);
  }

  onEditComment(event: { comment: any, content: string }): void {
    // Handle edit comment logic
    console.log('Edit comment:', event);
  }

  onDeleteComment(comment: any): void {
    // Handle delete comment logic
    console.log('Delete comment:', comment);
  }

  onReactToComment(event: { comment: any, reactionType: ReactionType }): void {
    // Handle react to comment logic
    console.log('React to comment:', event);
  }
}
