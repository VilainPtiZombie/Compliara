import { Component, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { CardModule } from 'primeng/card';
import { DeclarationsService } from '../../../core/services/declarations.service';
import { ServicesService } from '../../../core/services/services.service';

@Component({
  selector: 'app-import-declaration',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    FileUploadModule,
    SelectModule,
    MessageModule,
    ProgressBarModule,
    CardModule,
  ],
  template: `
    <p-card>
      <div class="import-header">
        <h3>Importer une grille Excel RGAA</h3>
        <p>Formats supportés : <code>.xlsx</code>, <code>.xls</code>, <code>.ods</code> — Max 10 Mo</p>
      </div>

      @if (error()) {
        <p-message severity="error" [text]="error()!" styleClass="mb-3" />
      }

      @if (result()) {
        <p-message
          severity="success"
          [text]="'Import réussi — ' + result().criteriaImported + ' critères, ' + result().pagesImported + ' pages. Taux : ' + result().complianceRate + '%'"
          styleClass="mb-3"
        />
      }

      <div class="import-form">
        <!-- Sélection du service -->
        <div class="field">
          <label>Service concerné</label>
          <p-select
            [(ngModel)]="selectedServiceId"
            [options]="services()"
            optionLabel="name"
            optionValue="id"
            placeholder="Sélectionner un service"
            styleClass="w-full"
          />
        </div>

        <!-- Zone de dépôt -->
        <div
          class="drop-zone"
          [class.drag-over]="isDragOver()"
          (dragover)="onDragOver($event)"
          (dragleave)="isDragOver.set(false)"
          (drop)="onDrop($event)"
          (click)="fileInput.click()"
        >
          <input
            #fileInput
            type="file"
            accept=".xlsx,.xls,.ods"
            style="display:none"
            (change)="onFileSelected($event)"
          />

          @if (selectedFile()) {
            <div class="file-selected">
              <i class="pi pi-file-excel" style="font-size:2rem; color: var(--p-green-500)"></i>
              <span class="file-name">{{ selectedFile()!.name }}</span>
              <span class="file-size">{{ formatSize(selectedFile()!.size) }}</span>
            </div>
          } @else {
            <div class="drop-hint">
              <i class="pi pi-upload"></i>
              <span>Glisser-déposer ou <strong>cliquer pour sélectionner</strong></span>
            </div>
          }
        </div>

        <!-- Progression -->
        @if (loading()) {
          <p-progressBar mode="indeterminate" styleClass="mt-2" />
        }

        <div class="import-actions">
          <p-button
            label="Importer"
            icon="pi pi-upload"
            [loading]="loading()"
            [disabled]="!selectedFile() || !selectedServiceId"
            (onClick)="onImport()"
          />
          @if (selectedFile()) {
            <p-button
              label="Annuler"
              severity="secondary"
              [text]="true"
              (onClick)="reset()"
            />
          }
        </div>
      </div>
    </p-card>
  `,
  styles: [`
    .import-header {
      margin-bottom: 1.5rem;
      h3 { font-size: 1.1rem; font-weight: 600; }
      p { color: var(--p-surface-500); font-size: 0.875rem; margin-top: 0.25rem; }
      code { background: var(--p-surface-100); padding: 0.1rem 0.3rem; border-radius: 4px; font-size: 0.8rem; }
    }
    .import-form { display: flex; flex-direction: column; gap: 1.25rem; }
    .field { display: flex; flex-direction: column; gap: 0.375rem; label { font-weight: 500; font-size: 0.875rem; } }

    .drop-zone {
      border: 2px dashed var(--p-surface-300);
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      &:hover, &.drag-over {
        border-color: var(--p-primary-400);
        background: var(--p-primary-50);
      }
    }
    .drop-hint {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      color: var(--p-surface-400);
      i { font-size: 2rem; }
    }
    .file-selected {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
    }
    .file-name { font-weight: 500; font-size: 0.9rem; }
    .file-size { color: var(--p-surface-400); font-size: 0.8rem; }
    .import-actions { display: flex; gap: 0.5rem; }
  `],
})
export class ImportDeclarationComponent {
  private declarationsService = inject(DeclarationsService);
  private servicesService = inject(ServicesService);

  imported = output<any>();

  services = signal<any[]>([]);
  selectedServiceId = '';
  selectedFile = signal<File | null>(null);
  isDragOver = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);
  result = signal<any | null>(null);

  constructor() {
    this.servicesService.findAll().subscribe(s => this.services.set(s));
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) this.setFile(input.files[0]);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.setFile(file);
  }

  setFile(file: File) {
    this.selectedFile.set(file);
    this.error.set(null);
    this.result.set(null);
  }

  onImport() {
    if (!this.selectedFile() || !this.selectedServiceId) return;
    this.loading.set(true);
    this.error.set(null);

    this.declarationsService.importExcel(this.selectedFile()!, this.selectedServiceId).subscribe({
      next: (res) => {
        this.result.set(res);
        this.loading.set(false);
        this.imported.emit(res);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'Erreur lors de l\'import');
        this.loading.set(false);
      },
    });
  }

  reset() {
    this.selectedFile.set(null);
    this.result.set(null);
    this.error.set(null);
  }

  formatSize(bytes: number): string {
    return bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} Ko`
      : `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
  }
}
