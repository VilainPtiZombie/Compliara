import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { DeclarationsService } from '../../core/services/declarations.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CardModule, ButtonModule, SkeletonModule],
  template: `
    <div class="page-header">
      <div>
        <h2>Tableau de bord</h2>
        <p>Vue d'ensemble de vos déclarations d'accessibilité</p>
      </div>
      <div class="header-actions">
        <p-button label="Nouvelle déclaration" icon="pi pi-plus"
          routerLink="/declarations/create" severity="primary" />
      </div>
    </div>

    <div class="stats-grid">
      <p-card>
        <div class="stat">
          <span class="stat-label">Services actifs</span>
          @if (loading()) { <p-skeleton height="2.5rem" /> }
          @else { <span class="stat-value">{{ stats()?.services ?? '—' }}</span> }
        </div>
      </p-card>
      <p-card>
        <div class="stat">
          <span class="stat-label">Déclarations publiées</span>
          @if (loading()) { <p-skeleton height="2.5rem" /> }
          @else { <span class="stat-value">{{ stats()?.published ?? '—' }}</span> }
        </div>
      </p-card>
      <p-card>
        <div class="stat">
          <span class="stat-label">Non-conformités ouvertes</span>
          @if (loading()) { <p-skeleton height="2.5rem" /> }
          @else {
            <span class="stat-value" [style.color]="stats()?.ncCount > 0 ? 'var(--p-red-500)' : 'var(--p-green-600)'">
              {{ stats()?.ncCount ?? '—' }}
            </span>
          }
        </div>
      </p-card>
      <p-card>
        <div class="stat">
          <span class="stat-label">Taux moyen de conformité</span>
          @if (loading()) { <p-skeleton height="2.5rem" /> }
          @else {
            <span class="stat-value" [style.color]="getRateColor(stats()?.avgRate)">
              {{ stats()?.avgRate !== null ? stats()!.avgRate + '%' : '—' }}
            </span>
          }
        </div>
      </p-card>
    </div>

    <!-- Raccourcis -->
    <div class="shortcuts" style="margin-top: 2rem">
      <h3>Accès rapide</h3>
      <div class="shortcut-grid">
        <p-card (click)="router.navigate(['/services'])" class="shortcut-card">
          <div class="shortcut">
            <i class="pi pi-globe"></i>
            <span>Gérer les services</span>
          </div>
        </p-card>
        <p-card (click)="router.navigate(['/declarations'])" class="shortcut-card">
          <div class="shortcut">
            <i class="pi pi-file-check"></i>
            <span>Voir les déclarations</span>
          </div>
        </p-card>
        <p-card (click)="router.navigate(['/declarations/create'])" class="shortcut-card">
          <div class="shortcut">
            <i class="pi pi-plus-circle"></i>
            <span>Créer une déclaration</span>
          </div>
        </p-card>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      h2 { font-size: 1.5rem; font-weight: 700; }
      p { color: var(--p-surface-500); margin-top: 0.25rem; }
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1rem;
    }
    .stat { display: flex; flex-direction: column; gap: 0.5rem; }
    .stat-label { font-size: 0.875rem; color: var(--p-surface-500); }
    .stat-value { font-size: 2rem; font-weight: 700; color: var(--p-primary-500); }
    h3 { font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; }
    .shortcut-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      max-width: 600px;
    }
    .shortcut {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      cursor: pointer;
      i { font-size: 1.75rem; color: var(--p-primary-400); }
      span { font-size: 0.875rem; font-weight: 500; text-align: center; }
    }
  `],
})
export class DashboardComponent implements OnInit {
  router = inject(Router);
  private declarationsService = inject(DeclarationsService);

  stats = signal<any>(null);
  loading = signal(true);

  ngOnInit() {
    this.declarationsService.stats().subscribe({
      next: (s) => { this.stats.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  getRateColor(rate: number | null | undefined): string {
    if (rate == null) return 'var(--p-primary-500)';
    if (rate >= 75) return 'var(--p-green-600)';
    if (rate >= 50) return 'var(--p-orange-500)';
    return 'var(--p-red-500)';
  }
}
