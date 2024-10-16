import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Post } from 'src/app/models/post';
import { User } from 'src/app/models/user';
import { PostService } from 'src/app/services/post.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  user: User | null = null;
  posts: Post[] = [];
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private postService: PostService,
  ) {
    this.profileForm = this.fb.group({
      username: [''],
      emailAddress: [''],
    });
  }

  ngOnInit(): void {
    this.user = this.userService.getCurrentUserFromLocalStorage();
    if (this.user) {
      this.profileForm.patchValue(this.user);
      this.loadMyPosts();
    } else {
      this.userService.getCurrentUser().subscribe(user => {
        this.user = user;
        this.profileForm.patchValue(user);
        this.loadMyPosts();
      });
    }
  }

  loadMyPosts(): void {
    this.postService.getUsersPosts().subscribe(posts => {
      this.posts = posts;
    });
  }

  onSubmit(): void {
    if (this.profileForm.valid && this.user) {
      const updatedUser = { ...this.user, ...this.profileForm.value };
      this.userService.updateUser(updatedUser).subscribe(() => {
        alert('Profile updated successfully');
      });
    }
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0] as File;
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
}
