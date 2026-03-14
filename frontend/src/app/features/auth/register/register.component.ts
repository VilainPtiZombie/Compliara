import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    SelectButtonModule,
    MessageModule,
  ],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <h1>Compliara</h1>
          <p>Créez votre espace de gestion</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
          <h2>Créer un compte</h2>

          @if (error()) {
            <p-message severity="error" [text]="error()!" />
          }

          <div class="field-row">
            <div class="field">
              <label>Prénom</label>
              <input pInputText formControlName="firstName" placeholder="Jean" />
            </div>
            <div class="field">
              <label>Nom</label>
              <input pInputText formControlName="lastName" placeholder="Dupont" />
            </div>
          </div>

          <div class="field">
            <label>Entreprise</label>
            <input pInputText formControlName="tenantName" placeholder="Mon entreprise" />
          </div>

          <div class="field">
            <label>Email</label>
            <input pInputText type="email" formControlName="email" placeholder="jean@entreprise.fr" />
          </div>

          <div class="field">
            <label>Mot de passe</label>
            <input pInputText type="password" formControlName="password" placeholder="8 caractères minimum" autocomplete="new-password" />
          </div>

          <div class="field">
            <label>Votre profil</label>
            <p-selectbutton
              formControlName="profile"
              [options]="profileOptions"
              optionLabel="label"
              optionValue="value"
            />
            <small class="hint">
              {{ form.value.profile === 'AUDITOR'
                ? 'Mode expert : accès direct aux critères RGAA complets.'
                : 'Mode guidé : formulaire simplifié avec aide contextuelle.' }}
            </small>
          </div>

          <p-button
            type="submit"
            label="Créer mon compte"
            styleClass="w-full"
            [loading]="loading()"
            [disabled]="form.invalid"
          />

          <p class="auth-link">
            Déjà un compte ? <a routerLink="/auth/login">Se connecter</a>
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
      max-width: 480px;
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
      h2 { font-size: 1.25rem; font-weight: 600; }
    }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      label { font-weight: 500; font-size: 0.875rem; }
      input { width: 100%; }
    }
    .hint { color: var(--p-surface-500); font-size: 0.8rem; font-style: italic; }
    .auth-link {
      text-align: center;
      font-size: 0.875rem;
      color: var(--p-surface-500);
      a { color: var(--p-primary-500); text-decoration: none; font-weight: 500; }
    }
  `],
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);

  profileOptions = [
    { label: 'Guidé', value: 'NON_AUDITOR' },
    { label: 'Expert (auditeur)', value: 'AUDITOR' },
  ];

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    tenantName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    profile: ['NON_AUDITOR'],
  });

  onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);

    this.auth.register(this.form.value as any).subscribe({
      next: () => {
        this.auth.fetchCurrentUser().subscribe(() => {
          this.router.navigate(['/dashboard']);
        });
      },
      error: (err) => {
        console.error('Register error', err);
        const msg = err.error?.message ?? err.message ?? err.statusText ?? 'Une erreur est survenue';
        this.error.set(Array.isArray(msg) ? msg.join(', ') : msg);
        this.loading.set(false);
      },
    });
  }
}
