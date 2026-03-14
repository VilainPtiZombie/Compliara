import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ServicesService } from '../../core/services/services.service';

@Component({
  selector: 'app-services-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <p-toast />
    <p-confirmDialog />

    <div class="page-header">
      <div>
        <h2>Services</h2>
        <p>Gérez vos sites web et applications</p>
      </div>
      <p-button label="Ajouter un service" icon="pi pi-plus" (onClick)="openCreate()" />
    </div>

    <!-- Dialog création / édition -->
    <p-dialog
      [header]="editingService ? 'Modifier le service' : 'Nouveau service'"
      [(visible)]="showDialog"
      [modal]="true"
      [style]="{width: '480px'}"
      [draggable]="false"
      (onHide)="resetForm()"
    >
      <div class="dialog-form">
        <div class="form-section-title">Informations générales</div>
        <div class="field">
          <label for="svc-name">Nom du service <span class="required">*</span></label>
          <input pInputText id="svc-name" [(ngModel)]="form.name" placeholder="Mon service" class="w-full" />
        </div>
        <div class="field">
          <label for="svc-url">URL <span class="required">*</span></label>
          <input pInputText id="svc-url" [(ngModel)]="form.url" placeholder="https://exemple.fr" class="w-full" />
        </div>
        <div class="field">
          <label for="svc-desc">Description</label>
          <textarea pTextarea id="svc-desc" [(ngModel)]="form.description" rows="2"
            placeholder="Description optionnelle" class="w-full"></textarea>
        </div>
        <div class="field">
          <label for="svc-tech">Technologies utilisées</label>
          <input pInputText id="svc-tech" [(ngModel)]="form.technologies"
            placeholder="HTML5, CSS, JavaScript, React..." class="w-full" />
          <small>Séparées par des virgules</small>
        </div>

        <div class="form-section-title">Contact accessibilité</div>
        <div class="field">
          <label for="svc-cname">Nom du responsable</label>
          <input pInputText id="svc-cname" [(ngModel)]="form.contactName"
            placeholder="Prénom Nom" class="w-full" />
        </div>
        <div class="field">
          <label for="svc-cemail">Email</label>
          <input pInputText type="email" id="svc-cemail" [(ngModel)]="form.contactEmail"
            placeholder="accessibilite@exemple.fr" class="w-full" />
        </div>
        <div class="field">
          <label for="svc-cphone">Téléphone</label>
          <input pInputText id="svc-cphone" [(ngModel)]="form.contactPhone"
            placeholder="+33 1 23 45 67 89" class="w-full" />
        </div>
      </div>
      <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" [text]="true" (onClick)="showDialog.set(false)" />
        <p-button
          [label]="editingService ? 'Enregistrer' : 'Créer'"
          icon="pi pi-check"
          [loading]="saving()"
          [disabled]="!form.name || !form.url"
          (onClick)="save()"
        />
      </ng-template>
    </p-dialog>

    <!-- Tableau -->
    @if (services().length > 0) {
      <p-table [value]="services()" [loading]="loading()" styleClass="p-datatable-sm">
        <ng-template pTemplate="header">
          <tr>
            <th>Nom</th>
            <th>URL</th>
            <th>Déclarations</th>
            <th></th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-s>
          <tr>
            <td><strong>{{ s.name }}</strong><br><small style="color:var(--p-surface-400)">{{ s.description }}</small></td>
            <td><a [href]="s.url" target="_blank" rel="noopener" class="service-url">{{ s.url }}</a></td>
            <td>
              <p-tag [value]="s._count.declarations + ' déclaration(s)'" severity="secondary" />
            </td>
            <td class="actions-cell">
              <p-button icon="pi pi-pencil" [text]="true" severity="secondary" (onClick)="openEdit(s)" />
              <p-button icon="pi pi-trash" [text]="true" severity="danger" (onClick)="confirmDelete(s)" />
            </td>
          </tr>
        </ng-template>
      </p-table>
    } @else if (!loading()) {
      <p-card>
        <p style="color: var(--p-surface-400); text-align: center; padding: 2rem;">
          Aucun service configuré — cliquez sur "Ajouter un service" pour commencer.
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
    .dialog-form { display: flex; flex-direction: column; gap: 1rem; padding: 0.5rem 0; }
    .field { display: flex; flex-direction: column; gap: 0.375rem; label { font-weight: 500; font-size: 0.875rem; } small { color: var(--p-surface-400); font-size: 0.75rem; } }
    .form-section-title { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--p-surface-400); padding-top: 0.5rem; border-top: 1px solid var(--p-surface-200); margin-top: 0.25rem; }
    .required { color: var(--p-red-500); }
    .service-url { color: var(--p-primary-500); text-decoration: none; font-size: 0.875rem; }
    .actions-cell { display: flex; gap: 0.25rem; justify-content: flex-end; }
  `],
})
export class ServicesListComponent implements OnInit {
  private servicesService = inject(ServicesService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  services = signal<any[]>([]);
  loading = signal(false);
  saving = signal(false);
  showDialog = signal(false);
  editingService: any = null;

  form = { name: '', url: '', description: '', technologies: '', contactName: '', contactEmail: '', contactPhone: '' };

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.servicesService.findAll().subscribe({
      next: (data) => { this.services.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate() {
    this.editingService = null;
    this.resetForm();
    this.showDialog.set(true);
  }

  openEdit(service: any) {
    this.editingService = service;
    this.form = {
      name: service.name,
      url: service.url,
      description: service.description ?? '',
      technologies: service.technologies ?? '',
      contactName: service.contactName ?? '',
      contactEmail: service.contactEmail ?? '',
      contactPhone: service.contactPhone ?? '',
    };
    this.showDialog.set(true);
  }

  resetForm() {
    this.form = { name: '', url: '', description: '', technologies: '', contactName: '', contactEmail: '', contactPhone: '' };
    this.editingService = null;
  }

  save() {
    this.saving.set(true);
    const obs = this.editingService
      ? this.servicesService.update(this.editingService.id, this.form)
      : this.servicesService.create(this.form);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.showDialog.set(false);
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: this.editingService ? 'Service mis à jour' : 'Service créé' });
        this.load();
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Une erreur est survenue' });
      },
    });
  }

  confirmDelete(service: any) {
    this.confirmationService.confirm({
      message: `Supprimer le service "${service.name}" ? Cette action est irréversible.`,
      header: 'Confirmer la suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.delete(service.id),
    });
  }

  delete(id: string) {
    this.servicesService.remove(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Service supprimé' });
        this.load();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de supprimer ce service' });
      },
    });
  }
}
