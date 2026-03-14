import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    CardModule,
    MessageModule,
  ],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <h1>Compliara</h1>
          <p>Gestion des déclarations d'accessibilité</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
          <h2>Connexion</h2>

          @if (error()) {
            <p-message severity="error" [text]="error()!" />
          }

          <div class="field">
            <label for="email">Email</label>
            <input
              pInputText
              id="email"
              type="email"
              formControlName="email"
              placeholder="vous@entreprise.fr"
              [class.ng-invalid]="isInvalid('email')"
            />
            @if (isInvalid('email')) {
              <small class="error-msg">Email invalide</small>
            }
          </div>

          <div class="field">
            <label for="password">Mot de passe</label>
            <input
              pInputText
              id="password"
              type="password"
              formControlName="password"
              placeholder="••••••••"
              autocomplete="current-password"
              [class.ng-invalid]="isInvalid('password')"
            />
          </div>

          <p-button
            type="submit"
            label="Se connecter"
            styleClass="w-full"
            [loading]="loading()"
            [disabled]="form.invalid"
          />

          <p class="auth-link">
            Pas encore de compte ?
            <a routerLink="/auth/register">Créer un compte</a>
          </p>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: var(--p-surface-50);
      padding: 1rem;
    }
    .auth-card {
      background: var(--p-surface-0);
      border: 1px solid var(--p-surface-200);
      border-radius: 12px;
      padding: 2.5rem;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.06);
    }
    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
      h1 { font-size: 2rem; font-weight: 700; color: var(--p-primary-500); }
      p { color: var(--p-surface-500); margin-top: 0.25rem; font-size: 0.9rem; }
    }
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      h2 { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.25rem; }
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      label { font-weight: 500; font-size: 0.875rem; }
      input { width: 100%; }
    }
    .error-msg { color: var(--p-red-500); font-size: 0.8rem; }
    .auth-link {
      text-align: center;
      font-size: 0.875rem;
      color: var(--p-surface-500);
      a { color: var(--p-primary-500); text-decoration: none; font-weight: 500; }
    }
  `],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  isInvalid(field: string) {
    const ctrl = this.form.get(field);
    return ctrl?.invalid && ctrl?.touched;
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);

    this.auth.login(this.form.value as any).subscribe({
      next: () => {
        this.auth.fetchCurrentUser().subscribe(() => {
          this.router.navigate(['/dashboard']);
        });
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'Identifiants incorrects');
        this.loading.set(false);
      },
    });
  }
}
