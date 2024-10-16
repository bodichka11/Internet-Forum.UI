import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ReactionType } from 'src/app/enums/reaction-type';
import { Post } from 'src/app/models/post';
import { Reaction } from 'src/app/models/reaction';
import { PostService } from 'src/app/services/post.service';
import { ReactionService } from 'src/app/services/reaction.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-popular-posts',
  templateUrl: './popular-posts.component.html',
  styleUrls: ['./popular-posts.component.css']
})
export class PopularPostsComponent implements OnInit {
  popularPosts: Post[] = [];
  ReactionType = ReactionType;
  currentUserId: number | undefined;
  errorMessage: string = '';

  constructor(
    private postService: PostService,
    private reactionService: ReactionService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.getCurrentUserId();
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

  getCurrentUserId(): void {
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUserId = user.id;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = `Cannot load user data: ${error.message}`;
      }
    });
  }

  getUser(post: Post): void {
    this.userService.getUser(post.userId).subscribe({
      next: (user) => {
        post.author = user;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = `No user with id ${post.userId}: ${error.message}`;
      },
    });
  }

  getReactionEmoji(reactionType: ReactionType): string {
    const emojiMap: Record<ReactionType, string> = {
      [ReactionType.Like]: "👍",
      [ReactionType.Dislike]: "👎",
      [ReactionType.Heart]: "❤️",
      [ReactionType.Angry]: "😡",
    };
    return emojiMap[reactionType] || "❓";
  }

  reactionTypeToString(reactionType: ReactionType): string {
    return ReactionType[reactionType] || "Unknown";
  }

  getUniqueReactions(reactions: Reaction[]): { type: number; count: number }[] {
    const reactionCounts: Record<number, number> = {};

    reactions.forEach((reaction) => {
      reactionCounts[reaction.type] = (reactionCounts[reaction.type] || 0) + 1;
    });

    return Object.entries(reactionCounts).map(([type, count]) => ({
      type: Number(type),
      count,
    }));
  }

  reactTo(reactionTarget: { userId: number, id: number }, reactionType: ReactionType, isComment = false): void {
    const reaction: Reaction = {
      id: 0,
      userId: reactionTarget.userId,
      type: reactionType,
    };

    if (isComment) {
      reaction.commentid = reactionTarget.id;
    } else {
      reaction.postId = reactionTarget.id;
    }

    this.reactionService.react(reaction).subscribe({
      next: () => this.loadPopularPosts(),
      error: (error: HttpErrorResponse) => (this.errorMessage = `Error reacting to ${isComment ? 'comment' : 'post'}: ${error.message}`),
    });
  }
}
