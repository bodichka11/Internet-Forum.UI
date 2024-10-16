import { HttpErrorResponse } from "@angular/common/http";
import { Component, OnInit } from "@angular/core";
import { FormArray, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { debounceTime, distinctUntilChanged, map, Subject, switchMap } from "rxjs";
import { ReactionType } from "src/app/enums/reaction-type";
import { CommentCreateDto } from "src/app/models/dto`s/comment/comment-create-dto";
import { CommentDto } from "src/app/models/dto`s/comment/comment-dto";
import { PostCreateDto } from "src/app/models/dto`s/post/post-create-dto";
import { PostUpdateDto } from "src/app/models/dto`s/post/post-update-dto";
import { TagDto } from "src/app/models/dto`s/tag/tag-dto";
import { Post } from "src/app/models/post";
import { Reaction } from "src/app/models/reaction";
import { Topic } from "src/app/models/topic";
import { User } from "src/app/models/user";
import { CommentService } from "src/app/services/comment.service";
import { PostService } from "src/app/services/post.service";
import { ReactionService } from "src/app/services/reaction.service";
import { TopicService } from "src/app/services/topic.service";
import { UserService } from "src/app/services/user.service";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
})
export class HomeComponent implements OnInit {
  searchTerm: string = '';
  searchSubject: Subject<string> = new Subject<string>();

  selectedImages: File[] = [];

  newCommentContent = '';
  editingCommentId: number | null = null;
  editingCommentContent = '';

  editingPostId: number | null = null;
  editingPostContent = '';
  editingPostTitle = '';
  editingPostTopicId: number | null = null;
  editingPostTags: TagDto[] = [];

  topics: Topic[] = [];
  selectedTopicName: string = '';

  posts: Post[] = [];
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalItems = 0;
  
  errorMessage = "";
  user: User | null = null;
  ReactionType = ReactionType;
  postForm: FormGroup;
  currentUserId: number | undefined;
  isSearching: boolean = false;

  constructor(
    private postService: PostService,
    private userService: UserService,
    private reactionService: ReactionService,
    private fb: FormBuilder,
    private commentService: CommentService,
    private topicService: TopicService,
  ) {
    this.postForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      content: ['', Validators.required],
      topicName: ['', Validators.required],
      tags: this.fb.array([]),
      images: [null],
    });
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term) => {
        if (term.trim() === '') {
          this.isSearching = false;
          return this.postService.getPosts(this.currentPage, this.pageSize).pipe(
            map(response => ({ posts: response.posts, totalItems: response.totalItems }))
          );
        } else {
          this.isSearching = true;
          return this.postService.searchPostsByTitle(term, this.currentPage, this.pageSize).pipe(
            map(posts => ({ posts: posts, totalItems: posts.length }))
          );
        }
      })
    ).subscribe({
      next: (response) => {
        this.posts = response.posts;
        this.totalItems = response.totalItems;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = `Cannot load posts: ${error.message}`;
      }
    });

  }

  ngOnInit(): void {
    this.loadTopics();
    this.loadPosts();
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

  onSubmit(): void {
    if (this.postForm.valid) {
      const selectedTopic = this.topics.find(t => t.name === this.postForm.value.topicName);
      if (!selectedTopic) {
        this.errorMessage = 'Please select a valid topic';
        return;
      }

      const postData: PostCreateDto = {
        topicId: selectedTopic.id,
        title: this.postForm.value.title,
        content: this.postForm.value.content,
        tags: this.postForm.value.tags.map((tag: { name: string }) => ({
          name: tag.name,
        })),
      };

      this.postService.createPost(postData, this.selectedImages).subscribe({
        next: (createdPost) => {
          createdPost.topic = selectedTopic;
          if (this.user) {
            createdPost.author = this.user;
          }
          this.posts.unshift(createdPost);
          this.postForm.reset();
          this.clearTags();
          this.selectedImages = [];
        },
        error: (error: HttpErrorResponse) => {
          console.error("Помилка створення поста:", error.message);
        },
      });
    } else {
      console.warn("Форма недійсна");
    }
  }

  get tags(): FormArray {
    return this.postForm.get("tags") as FormArray;
  }

  addTag(): void {
    this.tags.push(
      this.fb.group({
        name: ["", Validators.required],
      })
    );
  }

  removeTag(index: number): void {
    this.tags.removeAt(index);
  }

  clearTags(): void {
    this.tags.clear();
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
      next: () => this.loadPosts(),
      error: (error: HttpErrorResponse) => (this.errorMessage = `Error reacting to ${isComment ? 'comment' : 'post'}: ${error.message}`),
    });
  }

  loadPosts(): void {
    if (this.isSearching) {
      this.searchSubject.next(this.searchTerm);
    } else {
      this.postService.getPosts(this.currentPage, this.pageSize).subscribe({
        next: (response) => {
          this.posts = response.posts;
          this.totalItems = response.totalItems;
          this.totalPages = Math.ceil(this.totalItems / this.pageSize);
          this.posts.forEach((post) => {
            this.getUser(post);
          });
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage = `Cannot load posts: ${error.message}`;
        },
      });
    }
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

  addComment(postId: number): void {
    if (!this.newCommentContent.trim()) return;

    const newComment: CommentCreateDto = {
      postId: postId,
      content: this.newCommentContent,
    };

    this.commentService.createComment(newComment).subscribe({
      next: (comment) => {
        const post = this.posts.find(p => p.id === postId);
        if (post) {
          post.comments.push(comment);
        }
        this.newCommentContent = '';
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = `Error adding comment: ${error.message}`;
      }
    });
  }

  startEditingComment(comment: CommentDto): void {
    if (comment && comment.userId === this.currentUserId) {
      this.editingCommentId = comment.id;
      this.editingCommentContent = comment.content;
    }
  }

  cancelEditingComment(): void {
    this.editingCommentId = null;
    this.editingCommentContent = '';
  }

  updateComment(comment: CommentDto): void {
    if (!comment || !this.editingCommentContent.trim()) return;

    const updatedComment: CommentDto = {
      ...comment,
      content: this.editingCommentContent
    };

    this.commentService.updateComment(comment.id, updatedComment).subscribe({
      next: (updatedComment) => {
        const post = this.posts.find(p => p.comments.some(c => c && c.id === comment.id));
        if (post) {
          const index = post.comments.findIndex(c => c && c.id === comment.id);
          if (index !== -1) {
            post.comments[index] = updatedComment;
          }
        }
        this.cancelEditingComment();
        this.loadPosts();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = `Error updating comment: ${error.message}`;
      }
    });
  }

  deleteComment(comment: CommentDto): void {
    if (!comment || comment.userId !== this.currentUserId) return;
  
    if (confirm('Are you sure you want to delete this comment?')) {
      this.commentService.deleteComment(comment.id).subscribe({
        next: () => {
          const post = this.posts.find(p => p.comments.some(c => c && c.id === comment.id));
          if (post) {
            post.comments = post.comments.filter(c => c && c.id !== comment.id);
          }
          this.loadPosts();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage = `Error deleting comment: ${error.message}`;
        }
      });
    }
  }

  startEditingPost(post: Post): void {
    if (post && post.userId === this.currentUserId) {
      this.editingPostId = post.id;
      this.editingPostContent = post.content;
      this.editingPostTitle = post.title;
      this.selectedTopicName = this.topics.find(t => t.id === post.topicId)?.name ?? '';
      this.editingPostTags = post.tags ? post.tags.map(tag => ({ name: tag.name })) : [];
    }
  }

  cancelEditingPost(): void {
    this.editingPostId = null;
    this.editingPostContent = '';
    this.editingPostTitle = '';
    this.editingPostTopicId = null;
    this.editingPostTags = [];
  }

  updatePost(post: Post): void {
    if (!post || !this.editingPostContent.trim() || !this.editingPostTitle.trim()) return;

    const selectedTopic = this.topics.find(t => t.name === this.selectedTopicName);
    if (!selectedTopic) {
      this.errorMessage = 'Please select a valid topic';
      return;
    }

    const updatedPost: PostUpdateDto = {
      id: post.id,
      content: this.editingPostContent,
      title: this.editingPostTitle,
      topicId: selectedTopic.id,
      tags: this.editingPostTags
    };

    this.postService.updatePost(post.id, updatedPost, this.selectedImages).subscribe({
      next: (updatedPost) => {
        const index = this.posts.findIndex(p => p.id === post.id);
        if (index !== -1) {
          this.posts[index] = {
            ...this.posts[index],
            ...updatedPost,
            topic: selectedTopic
          };
        }
        this.cancelEditingPost();
        this.selectedImages = [];
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error updating post:', error);
        if (error.error instanceof ErrorEvent) {
          this.errorMessage = `Error: ${error.error.message}`;
        } else {
          this.errorMessage = `Error ${error.status}: ${error.error}`;
        }
      }
    });
  }

  addTagToEditingPost(): void {
    this.editingPostTags.push({ name: '' });
  }

  removeTagFromEditingPost(index: number): void {
    this.editingPostTags.splice(index, 1);
  }

  deletePost(post: Post): void {
    if (!post || post.userId !== this.currentUserId) return;
  
    if (confirm('Are you sure you want to delete this post?')) {
      this.postService.deletePost(post.id).subscribe({
        next: () => {
          this.posts = this.posts.filter(p => p.id !== post.id);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage = `Error deleting post: ${error.message}`;
        }
      });
    }
  }

  getTopicName(topicId: number): string {
    const topic = this.topics.find(t => t.id === topicId);
    return topic ? topic.name : 'Unknown';
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadPosts();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadPosts();
    }
  }

  searchPosts(): void {
    this.currentPage = 1;
    this.searchSubject.next(this.searchTerm);
  }
  
  resetSearch(): void {
    this.searchTerm = '';
    this.isSearching = false;
    this.currentPage = 1;
    this.loadPosts();
  }

  onFileSelected(event: any): void {
    this.selectedImages = Array.from(event.target.files);
  }

  getImageUrl(imagePath: string): string {
    return this.postService.getImageUrl(imagePath);
  }

  onImageError(event: any) {
    event.target.src = this.postService.getPlaceholderImage();
  }
}