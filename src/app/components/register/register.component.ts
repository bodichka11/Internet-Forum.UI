import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RegisteredResponse } from 'src/app/models/registered-response';
import { UserRegister } from 'src/app/models/user-register';
import { UserService } from 'src/app/services/user.service';


@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  invalidLogin: boolean = false;
  user: UserRegister = {
    username: '',
    password: '',
    email: ''
  };

  constructor(private router: Router, private userService: UserService){}

  registerUser(loginForm: any): void {
    if (loginForm.valid) {
      this.userService.register(this.user).subscribe({
        next: (response: RegisteredResponse) => {
          console.log(response);
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.log(error);
          this.invalidLogin = true;
        }
      });
    } else {  
      this.invalidLogin = true;
    }
  }
}
