import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, map, switchMap } from 'rxjs';
import { ReactionType } from 'src/app/enums/reaction-type';
import { CommentCreateDto } from 'src/app/models/dto`s/comment/comment-create-dto';
import { CommentDto } from 'src/app/models/dto`s/comment/comment-dto';
import { PostCreateDto } from 'src/app/models/dto`s/post/post-create-dto';
import { PostUpdateDto } from 'src/app/models/dto`s/post/post-update-dto';
import { Post } from 'src/app/models/post';
import { Reaction } from 'src/app/models/reaction';
import { Topic } from 'src/app/models/topic';
import { User } from 'src/app/models/user';
import { CommentService } from 'src/app/services/comment.service';
import { PostService } from 'src/app/services/post.service';
import { ReactionService } from 'src/app/services/reaction.service';
import { TopicService } from 'src/app/services/topic.service';
import { UserService } from 'src/app/services/user.service';
import { BasePostComponent } from '../base-post/base-post.component';

@Component({
  selector: 'app-try',
  templateUrl: './try.component.html',
  styleUrls: ['./try.component.css']
})
export class TryComponent {

  posts: Post[] = [];
  currentUser: User | null = null;
  topics: Topic[] = [];
  postForm: FormGroup;
  editPostForm: FormGroup;
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalItems = 0;
  errorMessage = '';
  searchTerm = '';
  searchSubject = new Subject<string>();
  isSearching = false;
  selectedImages: File[] = [];
  editingPost: Post | null = null;

  constructor(
    private fb: FormBuilder,
    private postService: PostService,
    private userService: UserService,
    private reactionService: ReactionService,
    private commentService: CommentService,
    private topicService: TopicService
  ) {
    this.postForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      content: ['', Validators.required],
      topicName: ['', Validators.required],
      tags: this.fb.array([]),
      images: [null],
    });
    this.editPostForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      content: ['', Validators.required],
      topicName: ['', Validators.required],
      tags: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadTopics();
    this.loadPosts();
    this.getCurrentUser();
    this.setupSearch();
  }

  setupSearch(): void {
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
      error: (error) => {
        this.errorMessage = `Cannot load posts: ${error.message}`;
      }
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
        },
        error: (error) => {
          this.errorMessage = `Cannot load posts: ${error.message}`;
        }
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
          this.posts.unshift(createdPost);
          this.postForm.reset();
          this.clearTags();
          this.selectedImages = [];
        },
        error: (error) => {
          console.error("Error creating post:", error.message);
        }
      });
    }
  }

  startEditingPost(post: Post): void {
    this.editingPost = post;
  const topicName = this.topics.find(t => t.id === post.topicId)?.name || '';

  this.editPostForm.reset({
    title: post.title,
    content: post.content,
    topicName: topicName
  });

  const tagFormArray = this.editPostForm.get('tags') as FormArray;
  tagFormArray.clear();
  post.tags.forEach(tag => {
    tagFormArray.push(this.fb.control(tag.name, Validators.required));
  });

  this.selectedImages = [];
  }

  cancelEditingPost(): void {
    this.editingPost = null;
    this.editPostForm.reset();
    this.selectedImages = [];
  }

  onEditPostSubmit(): void {
    if (this.editPostForm.valid && this.editingPost) {
      const selectedTopic = this.topics.find(t => t.name === this.editPostForm.value.topicName);
      if (!selectedTopic) {
        this.errorMessage = 'Please select a valid topic';
        return;
      }

      const updatedPost: PostUpdateDto = {
        id: this.editingPost.id,
        title: this.editPostForm.value.title,
        content: this.editPostForm.value.content,
        topicId: selectedTopic.id,
        tags: this.editPostForm.value.tags.map((name: string) => ({ name }))
      };

      this.postService.updatePost(updatedPost.id, updatedPost, this.selectedImages).subscribe({
        next: (updated) => {
          const index = this.posts.findIndex(p => p.id === updated.id);
          if (index !== -1) {
            this.posts[index] = updated;
          }
          this.editingPost = null;
          this.selectedImages = [];
        },
        error: (error) => {
          this.errorMessage = `Error updating post: ${error.message}`;
        }
      });
    }
  }

  onDeletePost(post: Post): void {
    if (confirm('Are you sure you want to delete this post?')) {
      this.postService.deletePost(post.id).subscribe({
        next: () => {
          this.posts = this.posts.filter(p => p.id !== post.id);
        },
        error: (error) => {
          this.errorMessage = `Error deleting post: ${error.message}`;
        }
      });
    }
  }

  onReact(event: { post: Post, reactionType: ReactionType }): void {
    const reaction: Reaction = {
      id: 0,
      userId: this.currentUser?.id ?? 0,
      postId: event.post.id,
      type: event.reactionType
    };
    this.reactionService.react(reaction).subscribe({
      next: () => this.loadPosts(),
      error: (error) => this.errorMessage = `Error reacting to post: ${error.message}`
    });
  }

  onAddComment(event: { postId: number, content: string }): void {
    const commentData: CommentCreateDto = {
      postId: event.postId,
      content: event.content
    };

    this.commentService.createComment(commentData).subscribe({
      next: (comment) => {
        const post = this.posts.find(p => p.id === event.postId);
        if (post) {
          post.comments.push(comment);
        }
        this.loadPosts();
      },
      error: (error) => this.errorMessage = `Error adding comment: ${error.message}`
    });
  }

  onEditComment(event: { comment: any, content: string }): void {
    const updatedComment: CommentDto = {
      ...event.comment,
      content: event.content
    };
    this.commentService.updateComment(event.comment.id, updatedComment).subscribe({
      next: (updatedComment) => {
        const post = this.posts.find(p => p.comments.some(c => c.id === event.comment.id));
        if (post) {
          const commentIndex = post.comments.findIndex(c => c.id === event.comment.id);
          if (commentIndex !== -1) {
            post.comments[commentIndex] = updatedComment;
          }
        }
        this.loadPosts();
      },
      error: (error) => this.errorMessage = `Error updating comment: ${error.message}`
    });
  }

  onDeleteComment(comment: any): void {
    if (confirm('Are you sure you want to delete this comment?')) {
      this.commentService.deleteComment(comment.id).subscribe({
        next: () => {
          const post = this.posts.find(p => p.comments.some(c => c.id === comment.id));
          if (post) {
            post.comments = post.comments.filter(c => c.id !== comment.id);
          }
        },
        error: (error) => this.errorMessage = `Error deleting comment: ${error.message}`
      });
    }
  }

  onReactToComment(event: { comment: any, reactionType: ReactionType }): void {
    const reaction: Reaction = {
      id: 0,
      userId: this.currentUser?.id ?? 0,
      commentId: event.comment.id,
      type: event.reactionType
    };
    this.reactionService.react(reaction).subscribe({
      next: () => this.loadPosts(),
      error: (error) => this.errorMessage = `Error reacting to comment: ${error.message}`
    });
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

  get tags(): FormArray {
    return this.postForm.get('tags') as FormArray;
  }

  addTag(): void {
    this.tags.push(this.fb.control('', Validators.required));
  }

  removeTag(index: number): void {
    this.tags.removeAt(index);
  }

  clearTags(): void {
    while (this.tags.length !== 0) {
      this.tags.removeAt(0);
    }
  }

  generatePost(): void {
    const title = this.postForm.get('title')?.value;
    if (!title) {
      this.errorMessage = 'Please provide a title to generate the post.';
      return;
    }

    this.postService.generatePost({ title }).subscribe({
      next: (generatedPost) => {
        this.postForm.patchValue({
          content: generatedPost.content,
          topicName: this.topics.find(t => t.id === generatedPost.topicId)?.name
        });
        this.clearTags();
        generatedPost.tags.forEach(tag => {
          this.tags.push(this.fb.control(tag.name, Validators.required));
        });
      },
      error: (error) => {
        this.errorMessage = `Error generating post: ${error.message}`;
      }
    });
  }

  copyLinkToClipboard(link: string): void {
    navigator.clipboard.writeText(link).then(() => {
      alert('Link copied to clipboard!');
    }).catch(err => {
      console.error('Could not copy text: ', err);
    });
  }

  addEditTag(): void {
    const tags = this.editPostForm.get('tags') as FormArray;
    tags.push(this.fb.control('', Validators.required));
  }
  
  removeEditTag(index: number): void {
    const tags = this.editPostForm.get('tags') as FormArray;
    tags.removeAt(index);
  }
  
}
