import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ReactionType } from 'src/app/enums/reaction-type';
import { Post } from 'src/app/models/post';

@Component({
  selector: 'app-post-list',
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.css']
})
export class PostListComponent {
  @Input() posts: Post[] = [];
  @Input() currentUserId!: number;
  @Input() topics: any[] = [];
  @Output() delete = new EventEmitter<Post>();
  @Output() react = new EventEmitter<{ post: Post, reactionType: ReactionType }>();
  @Output() addComment = new EventEmitter<{ postId: number, content: string }>();
  @Output() editComment = new EventEmitter<{ comment: any, content: string }>();
  @Output() deleteComment = new EventEmitter<any>();
  @Output() reactToComment = new EventEmitter<{ comment: any, reactionType: ReactionType }>();
  @Output() edit = new EventEmitter<Post>();

  onEditClicked(post: Post): void {
    this.edit.emit(post);
  }
}
