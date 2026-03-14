import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  CurrentUser,
  LoginRequest,
  RegisterRequest,
} from './auth.models';

const TOKEN_KEY = 'compliara_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _currentUser = signal<CurrentUser | null>(null);
  private _token = signal<string | null>(
    localStorage.getItem(TOKEN_KEY)
  );

  currentUser = this._currentUser.asReadonly();
  isAuthenticated = computed(() => !!this._token());
  token = this._token.asReadonly();

  login(body: LoginRequest) {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, body)
      .pipe(tap((res) => this.storeToken(res.access_token)));
  }

  register(body: RegisterRequest) {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, body)
      .pipe(tap((res) => this.storeToken(res.access_token)));
  }

  fetchCurrentUser() {
    return this.http
      .get<CurrentUser>(`${environment.apiUrl}/auth/me`)
      .pipe(tap((user) => this._currentUser.set(user)));
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    this._token.set(null);
    this._currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  private storeToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
    this._token.set(token);
  }
}
