import { Injectable } from "@angular/core";

import { BehaviorSubject, Observable, of } from "rxjs";
import { UserService } from "./user.service";
import { User } from "../models/user";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  userSubject: BehaviorSubject<User | undefined>;

  currentUser$: Observable<User | undefined>;

  private userKeyName = "userInfo";
  private tokenKeyName = "accessToken";

  constructor(private userService: UserService) {
    this.userSubject = new BehaviorSubject<User | undefined>(
      this.getUserInfo()
    );
    this.currentUser$ = this.userSubject.asObservable();
  }

  isAuthorized() {
    return this.getUserToken() && this.getUserInfo();
  }

  logout() {
    this.removeUserInfo();
    this.userSubject.next(undefined);
  }

  getUserToken(): string | null {
    return localStorage.getItem(this.tokenKeyName);
  }

  getUserInfo(): User | undefined {
    const userInfo = localStorage.getItem(this.userKeyName);
    return userInfo ? JSON.parse(userInfo) : undefined;
  }

  getUser(): Observable<User | undefined> {
    return of(this.getUserInfo()!);
  }

  setUserInfo(user: User) {
    localStorage.setItem(this.userKeyName, JSON.stringify(user));
    this.userSubject.next(user);
  }

  private removeUserInfo() {
    localStorage.removeItem(this.userKeyName);
  }
}
