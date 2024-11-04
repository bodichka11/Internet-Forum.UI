import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ReactionType } from 'src/app/enums/reaction-type';
import { Post } from 'src/app/models/post';
import { PostService } from 'src/app/services/post.service';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.css']
})
export class PostComponent {

  constructor(private postService : PostService)
  {

  }

  @Input() post!: Post;
  @Input() currentUserId!: number;
  @Input() topics: any[] = [];
  @Output() edit = new EventEmitter<Post>();
  @Output() delete = new EventEmitter<Post>();
  @Output() react = new EventEmitter<{ post: Post, reactionType: ReactionType }>();
  @Output() addComment = new EventEmitter<{ postId: number, content: string }>();
  @Output() editComment = new EventEmitter<{ comment: any, content: string }>();
  @Output() deleteComment = new EventEmitter<any>();
  @Output() reactToComment = new EventEmitter<{ comment: any, reactionType: ReactionType }>();

  ReactionType = ReactionType;
  editingCommentId: number | null = null;
  editingCommentContent = '';
  newCommentContent = '';

  getTopicName(topicId: number): string {
    const topic = this.topics.find(t => t.id === topicId);
    return topic ? topic.name : 'Unknown';
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

  getUniqueReactions(reactions: any[]): { type: number; count: number }[] {
    const reactionCounts: Record<number, number> = {};

    reactions.forEach((reaction) => {
      reactionCounts[reaction.type] = (reactionCounts[reaction.type] || 0) + 1;
    });

    return Object.entries(reactionCounts).map(([type, count]) => ({
      type: Number(type),
      count,
    }));
  }

  onReact(reactionType: ReactionType): void {
    this.react.emit({ post: this.post, reactionType });
  }

  onAddComment(): void {
    if (this.newCommentContent.trim()) {
      this.addComment.emit({ postId: this.post.id, content: this.newCommentContent });
      this.newCommentContent = '';
    }
  }

  onStartEditingComment(comment: any): void {
    this.editingCommentId = comment.id;
    this.editingCommentContent = comment.content;
  }

  onCancelEditingComment(): void {
    this.editingCommentId = null;
    this.editingCommentContent = '';
  }

  onUpdateComment(comment: any): void {
    if (this.editingCommentContent.trim()) {
      this.editComment.emit({ comment, content: this.editingCommentContent });
      this.onCancelEditingComment();
    }
  }

  onDeleteComment(comment: any): void {
    this.deleteComment.emit(comment);
  }

  onReactToComment(comment: any, reactionType: ReactionType): void {
    this.reactToComment.emit({ comment, reactionType });
  }

  getImageUrl(imagePath: string): string {
    return this.postService.getImageUrl(imagePath);
  }

  onImageError(event: any) {
    event.target.src = this.postService.getPlaceholderImage();
  }

  copyLinkToClipboard(link: string): void {
    const inputElement = document.createElement('textarea');
    inputElement.value = link;
    document.body.appendChild(inputElement);
    inputElement.select();
    document.execCommand('copy');
    document.body.removeChild(inputElement);

    alert('Link copied to clipboard!');
  }
}
