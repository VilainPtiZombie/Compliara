import { Component, inject, signal, OnInit, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { DeclarationPreviewComponent } from '../shared/declaration-preview/declaration-preview.component';

@Component({
  selector: 'app-declaration-public',
  standalone: true,
  imports: [CommonModule, DeclarationPreviewComponent],
  template: `
    <div class="public-page">
      <header class="public-header">
        <span class="logo">Compliara</span>
      </header>
      <main class="public-content">
        @if (loading()) {
          <div class="loading">
            <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
            <p>Chargement de la déclaration…</p>
          </div>
        } @else if (error()) {
          <div class="error-state">
            <i class="pi pi-exclamation-triangle" style="font-size: 3rem; color: #dc2626"></i>
            <h2>Déclaration introuvable</h2>
            <p>Cette déclaration n'existe pas ou n'est plus disponible.</p>
          </div>
        } @else {
          <app-declaration-preview [declaration]="declaration()" />
        }
      </main>
      <footer class="public-footer">
        <p>Déclaration générée via <strong>Compliara</strong></p>
      </footer>
    </div>
  `,
  styles: [`
    .public-page { min-height: 100vh; background: #f9fafb; display: flex; flex-direction: column; }
    .public-header {
      background: white;
      border-bottom: 1px solid #e5e7eb;
      padding: 1rem 2rem;
      .logo { font-size: 1.25rem; font-weight: 700; color: #2563eb; }
    }
    .public-content { flex: 1; max-width: 900px; width: 100%; margin: 2rem auto; padding: 0 1.5rem; }
    .loading, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 4rem;
      text-align: center;
      color: #6b7280;
    }
    .error-state h2 { font-size: 1.25rem; font-weight: 700; color: #1a1a1a; }
    .public-footer {
      text-align: center;
      padding: 1.5rem;
      font-size: 0.8rem;
      color: #9ca3af;
      border-top: 1px solid #e5e7eb;
      background: white;
    }
  `],
})
export class DeclarationPublicComponent implements OnInit {
  token = input<string>('');

  private http = inject(HttpClient);

  declaration = signal<any>(null);
  loading = signal(true);
  error = signal(false);

  ngOnInit() {
    this.http.get<any>(`${environment.apiUrl}/public/${this.token()}`).subscribe({
      next: (d) => { this.declaration.set(d); this.loading.set(false); },
      error: () => { this.error.set(true); this.loading.set(false); },
    });
  }
}
