import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [CardModule],
  template: `
    <div class="page-header">
      <h2>Planning des correctifs</h2>
      <p>Planifiez et suivez les actions correctives d'accessibilité</p>
    </div>
    <p-card>
      <p style="color: var(--p-surface-400); text-align: center; padding: 2rem;">
        Aucune action corrective — les correctifs apparaîtront ici depuis vos déclarations.
      </p>
    </p-card>
  `,
  styles: [`
    .page-header {
      margin-bottom: 1.5rem;
      h2 { font-size: 1.5rem; font-weight: 700; }
      p { color: var(--p-surface-500); margin-top: 0.25rem; }
    }
  `],
})
export class PlanningComponent {}
