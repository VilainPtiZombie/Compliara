import { Component, input } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-declaration-public',
  standalone: true,
  imports: [CardModule],
  template: `
    <div class="public-page">
      <header class="public-header">
        <span class="logo">Compliara</span>
      </header>
      <main class="public-content">
        <p-card>
          <p>Chargement de la déclaration <strong>{{ token() }}</strong>…</p>
        </p-card>
      </main>
    </div>
  `,
  styles: [`
    .public-page { min-height: 100vh; background: var(--p-surface-50); }
    .public-header {
      background: var(--p-surface-0);
      border-bottom: 1px solid var(--p-surface-200);
      padding: 1rem 2rem;
      .logo { font-size: 1.25rem; font-weight: 700; color: var(--p-primary-500); }
    }
    .public-content { max-width: 900px; margin: 2rem auto; padding: 0 1rem; }
  `],
})
export class DeclarationPublicComponent {
  token = input<string>('');
}
