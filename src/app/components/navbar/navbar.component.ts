import { Component, OnInit } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { User } from 'src/app/models/user';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  user: User | null = null;

  avatarUrl: string = 'assets/default-avatar.png';

  constructor(
    private jwtHelper: JwtHelperService,
    private authService: AuthService,
    private userService: UserService
  ) {}


  ngOnInit(): void {
    this.getUserInfo();
    this.userService.getCurrentUser().subscribe(
      user => {
        this.user = user;
        this.avatarUrl = user.imageUrl ?? 'assets/default-avatar.png';;
      }
    )
  }

  isUserAuthenticated = (): boolean => {
    const token = localStorage.getItem('accessToken');
    if (token && !this.jwtHelper.isTokenExpired(token)) {
      return true;
    }
    return false;
  };
  logOut = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  getUserInfo(): void {
    const user = this.authService.getUserInfo();
    if (user) {
      this.user = user;
    }
  }

  handleImageError(event: any) {
    event.target.src = 'assets/default-avatar.png';
  }

}
