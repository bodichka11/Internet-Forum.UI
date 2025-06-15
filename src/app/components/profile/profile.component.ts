import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, Validators } from '@angular/forms';
import { ReactionType } from 'src/app/enums/reaction-type';
import { UpdateConfirmDto } from 'src/app/models/dto`s/user/update-confirm';
import { Post } from 'src/app/models/post';
import { Reaction } from 'src/app/models/reaction';
import { Topic } from 'src/app/models/topic';
import { User } from 'src/app/models/user';
import { PostService } from 'src/app/services/post.service';
import { ReactionService } from 'src/app/services/reaction.service';
import { TopicService } from 'src/app/services/topic.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  newComment: string = '';
  reactionTypes = Object.values(ReactionType).filter(value => typeof value === 'number');
  
  profileForm: FormGroup;
  user: User | null = null;
  posts: Post[] = [];
  selectedFile: File | null = null;
  updateUserDto: UpdateConfirmDto | null = null;

  editingPostId: number | null = null;
  editingPostContent = '';
  editingPostTitle = '';
  editingPostTopicId: number | null = null;
  editingPostTags: { name: string }[] = [];

  topics: Topic[] = [];
  selectedTopicName: string = '';
  ReactionType: any;
  showConfirmation = false;


  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private postService: PostService,
    private topicService: TopicService,
    private reactionsService: ReactionService,
  ) {
    this.profileForm = this.fb.group({
      username: [''],
      emailAddress: [''],
      confirmationCode: [''],
    });
  }

  ngOnInit(): void {
    this.user = this.userService.getCurrentUserFromLocalStorage();
    if (this.user) {
      this.profileForm.patchValue(this.user);
      this.loadMyPosts();
      this.loadTopics();
    } else {
      this.userService.getCurrentUser().subscribe(user => {
        this.user = user;
        this.profileForm.patchValue(user);
        this.loadMyPosts();
        this.loadTopics();
      });
    }
  }


  loadMyPosts(): void {
    this.postService.getUsersPosts().subscribe(posts => {
      this.posts = posts;
    });
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

  onSubmit(): void {
    if (this.profileForm.valid && this.user) {
      const updatedUser = { ...this.user, ...this.profileForm.value };
      this.userService.updateUser(updatedUser).subscribe(() => {
        alert('Profile updated successfully');
      });
      this.showConfirmation = true;
    }
  }

  confirmUpdate(): void {
    if (confirm("Are you sure you want to confirm profile update?")) {
      const code = this.profileForm.get('confirmationCode')?.value;
      if (!code) {
        alert('Please enter a confirmation code');
        return;
      }
  
      const email = this.user?.emailAddress ?? '';
      this.updateUserDto = {
        email: email,
        code: code
      };
        
      this.userService.confirmUpdate(this.updateUserDto).subscribe({
        next: (response) => {
          console.log('Server response:', response);
          alert('Profile update confirmed successfully');
          this.showConfirmation = false;
          
          this.userService.getCurrentUser().subscribe({
            next: (user) => {
              this.user = user;
              this.profileForm.patchValue(user);
              this.loadMyPosts();
            },
            error: (err) => {
              console.error('Error reloading user:', err);
            }
          });
        },
        error: (err) => {
          console.error('Error confirming update:', err);
          alert('Failed to confirm update. Please check the code and try again.');
        }
      });
    }
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0] as File;
    this.uploadAvatar();
  }

  uploadAvatar(): void {
    if (this.selectedFile) {
      this.userService.uploadAvatar(this.selectedFile).subscribe({
        next: (avatarUrl) => {
          if (this.user) {
            this.user.imageUrl = avatarUrl;
          }
          alert('Avatar uploaded successfully');
        },
        error: (error) => {
          console.error('Error uploading avatar:', error);
          alert('Failed to upload avatar');
        }
      });
    } else {
      alert('Please select a file first');
    }
  }

  startEditingPost(post: Post): void {
    this.editingPostId = post.id;
    this.editingPostContent = post.content;
    this.editingPostTitle = post.title;
    this.selectedTopicName = this.topics.find(t => t.id === post.topicId)?.name ?? '';
    this.editingPostTags = post.tags ? post.tags.map(tag => ({ name: tag.name })) : [];
  }

  cancelEditingPost(): void {
    this.editingPostId = null;
    this.editingPostContent = '';
    this.editingPostTitle = '';
    this.editingPostTopicId = null;
    this.editingPostTags = [];
  }

  updatePost(post: Post): void {
    const selectedTopic = this.topics.find(t => t.name === this.selectedTopicName);
    if (!selectedTopic) {
      alert('Please select a valid topic');
      return;
    }

    const updatedPost = {
      id: post.id,
      content: this.editingPostContent,
      title: this.editingPostTitle,
      topicId: selectedTopic.id,
      tags: this.editingPostTags.map(tag => ({ id: 0, name: tag.name, posts: [] }))
    };

    this.postService.updatePost(post.id, updatedPost, []).subscribe({
      next: () => {
        const index = this.posts.findIndex(p => p.id === post.id);
        if (index !== -1) {
          this.posts[index] = { 
            ...this.posts[index], 
            ...updatedPost, 
            tags: updatedPost.tags.map(tag => ({ id: tag.id, name: tag.name, posts: tag.posts }))
          };
        }
        this.cancelEditingPost();
      },
      error: (error) => {
        console.error('Error updating post:', error);
        alert('Failed to update post');
      }
    });
  }

  deletePost(post: Post): void {
    if (confirm('Are you sure you want to delete this post?')) {
      this.postService.deletePost(post.id).subscribe({
        next: () => {
          this.posts = this.posts.filter(p => p.id !== post.id);
        },
        error: (error) => {
          console.error('Error deleting post:', error);
          alert('Failed to delete post');
        }
      });
    }
  }

  reactTo(post: Post, reactionType: ReactionType): void {
    if (!this.user?.id) {
      alert('User ID is missing. Please log in again.');
      return;
    }

    const reaction = {
      id: 0,
      userId: this.user.id,
      postId: post.id,
      type: reactionType
    };

    this.reactionsService.react(reaction).subscribe({
      next: () => {
        this.loadMyPosts();
      },
      error: (error) => {
        console.error('Error reacting to post:', error);
        alert('Failed to react to post');
      }
    });
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

  getImageUrl(imagePath: string): string {
    return this.postService.getImageUrl(imagePath);
  }
}
