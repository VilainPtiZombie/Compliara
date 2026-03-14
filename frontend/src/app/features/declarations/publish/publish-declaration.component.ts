import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { DeclarationsService } from '../../../core/services/declarations.service';
import { DeclarationPreviewComponent } from '../../../shared/declaration-preview/declaration-preview.component';

@Component({
  selector: 'app-publish-declaration',
  standalone: true,
  providers: [MessageService],
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    CardModule,
    ButtonModule,
    SelectModule,
    DividerModule,
    ToastModule,
    TagModule,
    SkeletonModule,
    DeclarationPreviewComponent,
  ],
  template: `
    <p-toast />

    <div class="page-header">
      <div>
        <p-button icon="pi pi-arrow-left" [text]="true" severity="secondary"
          routerLink="/declarations" label="Retour" />
        <h2>Publication d'une déclaration</h2>
        <p>Sélectionnez une déclaration pour la prévisualiser et la publier</p>
      </div>
    </div>

    <div class="publish-layout">

      <!-- Panneau gauche : configuration -->
      <div class="config-panel">
        <p-card>
          <h3>Configuration</h3>

          <div class="field">
            <label>Déclaration</label>
            <p-select
              [(ngModel)]="selectedId"
              [options]="declarations()"
              optionLabel="label"
              optionValue="value"
              placeholder="Choisir une déclaration..."
              styleClass="w-full"
              [filter]="true"
              filterPlaceholder="Rechercher..."
              (onChange)="onSelect($event.value)"
            />
          </div>

          @if (selected()) {
            <div class="declaration-info">
              <div class="info-row">
                <span class="info-label">Statut actuel</span>
                <p-tag [value]="getStatusLabel(selected()!.status)"
                  [severity]="getStatusSeverity(selected()!.status)" />
              </div>
              <div class="info-row">
                <span class="info-label">Version RGAA</span>
                <span>{{ selected()!.rgaaVersion }}</span>
              </div>
              @if (selected()!.complianceRate !== null) {
                <div class="info-row">
                  <span class="info-label">Taux de conformité</span>
                  <span [style.color]="getRateColor(selected()!.complianceRate)" style="font-weight: 700">
                    {{ selected()!.complianceRate }}%
                  </span>
                </div>
              }
              @if (selected()!.status === 'PUBLISHED') {
                <div class="public-url">
                  <span class="info-label">URL publique</span>
                  <div class="url-row">
                    <input readonly [value]="publicUrl()" class="url-input" />
                    <p-button icon="pi pi-copy" [text]="true" (onClick)="copyUrl()" />
                    <p-button icon="pi pi-external-link" [text]="true" (onClick)="openUrl()" />
                  </div>
                </div>
              }
            </div>

            <div class="action-buttons">
              @if (selected()!.status !== 'PUBLISHED') {
                <p-button
                  label="Publier la déclaration"
                  icon="pi pi-globe"
                  [loading]="saving()"
                  (onClick)="publish()"
                />
              } @else {
                <p-button
                  label="Dépublier"
                  icon="pi pi-eye-slash"
                  severity="secondary"
                  [outlined]="true"
                  [loading]="saving()"
                  (onClick)="unpublish()"
                />
              }
            </div>
          }
        </p-card>
      </div>

      <!-- Panneau droit : preview live -->
      <div class="preview-panel">
        <div class="preview-header">
          <span class="preview-label">
            <i class="pi pi-eye"></i> Prévisualisation en direct
          </span>
          @if (selected()) {
            <span class="preview-info">Se met à jour automatiquement</span>
          }
        </div>

        <div class="preview-content">
          @if (!selectedId) {
            <div class="empty-preview">
              <i class="pi pi-file" style="font-size: 3rem; color: var(--p-surface-300)"></i>
              <p>Sélectionnez une déclaration pour voir la prévisualisation</p>
            </div>
          } @else if (loadingPreview()) {
            <div style="padding: 2rem; display: flex; flex-direction: column; gap: 1rem">
              <p-skeleton height="2rem" />
              <p-skeleton height="1rem" width="60%" />
              <p-skeleton height="1rem" width="40%" />
              <p-skeleton height="8rem" />
              <p-skeleton height="1rem" width="80%" />
              <p-skeleton height="1rem" width="70%" />
            </div>
          } @else {
            <app-declaration-preview [declaration]="selected()" />
          }
        </div>
      </div>

    </div>
  `,
  styles: [`
    .page-header {
      margin-bottom: 1.5rem;
      h2 { font-size: 1.5rem; font-weight: 700; margin-top: 0.25rem; }
      p { color: var(--p-surface-500); margin-top: 0.25rem; }
    }
    .publish-layout {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 1.5rem;
      align-items: start;
    }
    .config-panel h3 { font-size: 1rem; font-weight: 600; margin-bottom: 1.25rem; }
    .field { display: flex; flex-direction: column; gap: 0.375rem; margin-bottom: 1.25rem;
      label { font-weight: 500; font-size: 0.875rem; }
    }
    .declaration-info { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }
    .info-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.875rem; }
    .info-label { color: var(--p-surface-500); }
    .public-url { display: flex; flex-direction: column; gap: 0.375rem; font-size: 0.875rem; }
    .url-row { display: flex; align-items: center; gap: 0.25rem; }
    .url-input {
      flex: 1;
      padding: 0.375rem 0.5rem;
      border: 1px solid var(--p-surface-300);
      border-radius: 6px;
      font-size: 0.75rem;
      background: var(--p-surface-50);
      color: var(--p-primary-600);
      font-family: monospace;
    }
    .action-buttons { display: flex; gap: 0.5rem; }

    .preview-panel {
      border: 1px solid var(--p-surface-200);
      border-radius: 8px;
      overflow: hidden;
      background: white;
    }
    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: var(--p-surface-50);
      border-bottom: 1px solid var(--p-surface-200);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--p-surface-600);
    }
    .preview-info { font-size: 0.75rem; color: var(--p-surface-400); font-weight: 400; }
    .preview-content { padding: 2rem; max-height: 80vh; overflow-y: auto; }
    .empty-preview {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 4rem 2rem;
      color: var(--p-surface-400);
      text-align: center;
    }
  `],
})
export class PublishDeclarationComponent implements OnInit {
  private declarationsService = inject(DeclarationsService);
  private messageService = inject(MessageService);

  declarations = signal<{ label: string; value: string }[]>([]);
  selected = signal<any>(null);
  selectedId = '';
  loadingPreview = signal(false);
  saving = signal(false);

  ngOnInit() {
    this.declarationsService.findAll().subscribe(list => {
      this.declarations.set(list.map((d: any) => ({
        label: `${d.service?.name ?? '—'} — RGAA ${d.rgaaVersion} (${this.getStatusLabel(d.status)})`,
        value: d.id,
      })));
    });
  }

  onSelect(id: string) {
    if (!id) { this.selected.set(null); return; }
    this.loadingPreview.set(true);
    this.declarationsService.findOne(id).subscribe({
      next: (d) => { this.selected.set(d); this.loadingPreview.set(false); },
      error: () => this.loadingPreview.set(false),
    });
  }

  publicUrl(): string {
    return `${window.location.origin}/public/${this.selected()?.publicToken}`;
  }

  copyUrl() {
    navigator.clipboard.writeText(this.publicUrl());
    this.messageService.add({ severity: 'info', summary: 'Copié', detail: 'URL copiée dans le presse-papier' });
  }

  openUrl() {
    window.open(this.publicUrl(), '_blank');
  }

  publish() {
    this.saving.set(true);
    this.declarationsService.update(this.selected()!.id, {
      status: 'PUBLISHED',
      dateAudit: this.selected()!.dateAudit,
    }).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.selected.set({ ...this.selected(), status: 'PUBLISHED' });
        this.messageService.add({ severity: 'success', summary: 'Publiée', detail: 'La déclaration est maintenant publique' });
        this.refreshDeclarations();
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de publier' });
      },
    });
  }

  unpublish() {
    this.saving.set(true);
    this.declarationsService.update(this.selected()!.id, { status: 'DRAFT' }).subscribe({
      next: () => {
        this.saving.set(false);
        this.selected.set({ ...this.selected(), status: 'DRAFT' });
        this.messageService.add({ severity: 'info', summary: 'Dépubliée', detail: 'La déclaration est repassée en brouillon' });
        this.refreshDeclarations();
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de dépublier' });
      },
    });
  }

  private refreshDeclarations() {
    this.declarationsService.findAll().subscribe(list => {
      this.declarations.set(list.map((d: any) => ({
        label: `${d.service?.name ?? '—'} — RGAA ${d.rgaaVersion} (${this.getStatusLabel(d.status)})`,
        value: d.id,
      })));
    });
  }

  getStatusLabel(status: string): string {
    return ({ PUBLISHED: 'Publiée', DRAFT: 'Brouillon', ARCHIVED: 'Archivée' } as any)[status] ?? status;
  }

  getStatusSeverity(status: string): 'success' | 'warn' | 'secondary' {
    return ({ PUBLISHED: 'success', DRAFT: 'warn', ARCHIVED: 'secondary' } as any)[status] ?? 'secondary';
  }

  getRateColor(rate: number): string {
    if (rate >= 75) return 'var(--p-green-600)';
    if (rate >= 50) return 'var(--p-orange-500)';
    return 'var(--p-red-500)';
  }
}
