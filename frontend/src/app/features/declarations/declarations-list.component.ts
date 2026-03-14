import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ImportDeclarationComponent } from './import/import-declaration.component';
import { DeclarationsService } from '../../core/services/declarations.service';

@Component({
  selector: 'app-declarations-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    DialogModule,
    ImportDeclarationComponent,
  ],
  template: `
    <div class="page-header">
      <div>
        <h2>Déclarations d'accessibilité</h2>
        <p>Créez, importez et publiez vos déclarations RGAA</p>
      </div>
      <div class="actions">
        <p-button label="Importer Excel" icon="pi pi-upload" severity="secondary"
          (onClick)="showImport.set(true)" />
        <p-button label="Nouvelle déclaration" icon="pi pi-plus"
          routerLink="/declarations/create" />
      </div>
    </div>

    <!-- Dialog import -->
    <p-dialog
      header="Importer une déclaration"
      [(visible)]="showImport"
      [modal]="true"
      [style]="{width: '560px'}"
      [draggable]="false"
    >
      <app-import-declaration (imported)="onImported($event)" />
    </p-dialog>

    <!-- Tableau -->
    @if (declarations().length > 0) {
      <p-table [value]="declarations()" [loading]="loading()" styleClass="p-datatable-sm">
        <ng-template pTemplate="header">
          <tr>
            <th>Service</th>
            <th>Version RGAA</th>
            <th>Taux conformité</th>
            <th>Statut</th>
            <th>Date audit</th>
            <th></th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-d>
          <tr>
            <td><strong>{{ d.service?.name }}</strong></td>
            <td>{{ d.rgaaVersion }}</td>
            <td>
              @if (d.complianceRate !== null) {
                <span [style.color]="getRateColor(d.complianceRate)">
                  {{ d.complianceRate }}%
                </span>
              } @else { — }
            </td>
            <td>
              <p-tag [value]="d.status" [severity]="getStatusSeverity(d.status)" />
            </td>
            <td>{{ d.dateAudit ? (d.dateAudit | date:'dd/MM/yyyy') : '—' }}</td>
            <td>
              <p-button icon="pi pi-eye" [text]="true" severity="secondary"
                [routerLink]="['/declarations', d.id]" />
            </td>
          </tr>
        </ng-template>
      </p-table>
    } @else if (!loading()) {
      <p-card>
        <p style="color: var(--p-surface-400); text-align: center; padding: 2rem;">
          Aucune déclaration — importez un fichier Excel ou créez une nouvelle déclaration.
        </p>
      </p-card>
    }
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
    .actions { display: flex; gap: 0.5rem; }
  `],
})
export class DeclarationsListComponent implements OnInit {
  private declarationsService = inject(DeclarationsService);

  declarations = signal<any[]>([]);
  loading = signal(false);
  showImport = signal(false);

  ngOnInit() {
    this.loadDeclarations();
  }

  loadDeclarations() {
    this.loading.set(true);
    this.declarationsService.findAll().subscribe({
      next: (data) => { this.declarations.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onImported(result: any) {
    this.showImport.set(false);
    this.loadDeclarations();
  }

  getRateColor(rate: number): string {
    if (rate >= 75) return 'var(--p-green-600)';
    if (rate >= 50) return 'var(--p-orange-500)';
    return 'var(--p-red-500)';
  }

  getStatusSeverity(status: string): 'success' | 'warn' | 'secondary' {
    return { PUBLISHED: 'success', DRAFT: 'warn', ARCHIVED: 'secondary' }[status] as any ?? 'secondary';
  }
}
