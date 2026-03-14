import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { StepperModule } from 'primeng/stepper';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DeclarationsService } from '../../../core/services/declarations.service';
import { ServicesService } from '../../../core/services/services.service';

const RGAA_VERSIONS = ['4.1', '4.1.2', '3.0'];

const PAGE_TYPES = [
  { label: 'Accueil', value: 'HOME' },
  { label: 'Contact', value: 'CONTACT' },
  { label: 'Formulaire', value: 'FORM' },
  { label: 'Contenu', value: 'CONTENT' },
  { label: 'Mentions légales', value: 'LEGAL' },
  { label: 'Recherche', value: 'SEARCH' },
  { label: 'Authentification', value: 'AUTHENTICATION' },
  { label: 'Autre', value: 'OTHER' },
];

@Component({
  selector: 'app-create-declaration',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    CardModule,
    ButtonModule,
    StepperModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    DatePickerModule,
    TableModule,
    TagModule,
    ToastModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />

    <div class="page-header">
      <div>
        <p-button icon="pi pi-arrow-left" [text]="true" severity="secondary"
          routerLink="/declarations" label="Retour" />
        <h2>Nouvelle déclaration</h2>
        <p>Créez une déclaration d'accessibilité RGAA manuellement</p>
      </div>
    </div>

    <p-stepper [value]="activeStep()" (valueChange)="activeStep.set($event ?? 1)" [linear]="true">

      <!-- ── Étape 1 : Informations générales ───────────────────────────────── -->
      <p-step-list>
        <p-step [value]="1">Informations générales</p-step>
        <p-step [value]="2">Pages auditées</p-step>
        <p-step [value]="3">Récapitulatif</p-step>
      </p-step-list>

      <p-step-panels>

        <!-- Étape 1 -->
        <p-step-panel [value]="1">
          <ng-template #content let-activateCallback="activateCallback">
            <div class="step-content">
              <div class="form-grid">
                <div class="field">
                  <label>Service <span class="required">*</span></label>
                  <p-select
                    [(ngModel)]="form.serviceId"
                    [options]="services()"
                    optionLabel="name"
                    optionValue="id"
                    placeholder="Sélectionner un service"
                    styleClass="w-full"
                  />
                </div>

                <div class="field">
                  <label>Version RGAA <span class="required">*</span></label>
                  <p-select
                    [(ngModel)]="form.rgaaVersion"
                    [options]="rgaaVersions"
                    placeholder="4.1"
                    styleClass="w-full"
                  />
                </div>

                <div class="field">
                  <label>Date d'audit</label>
                  <p-datepicker
                    [(ngModel)]="form.dateAudit"
                    dateFormat="dd/mm/yy"
                    [showIcon]="true"
                    styleClass="w-full"
                  />
                </div>

                <div class="field">
                  <label>Société auditrice</label>
                  <input pInputText [(ngModel)]="form.auditCompany"
                    placeholder="Nom de la société" class="w-full" />
                </div>

                <div class="field col-span-2">
                  <label>Outils utilisés pour l'audit</label>
                  <textarea pTextarea [(ngModel)]="form.tools" rows="2"
                    placeholder="Wave, Colour Contrast Analyser, Inspecteur de code..." class="w-full"></textarea>
                  <small>Séparés par des virgules</small>
                </div>
              </div>

              <div class="form-section-title">Contact accessibilité</div>
              <p class="hint">
                Ces informations seront affichées dans la section « Retour d'information » de la déclaration.
                @if (form.serviceId) {
                  <p-button label="Charger depuis le service" icon="pi pi-download" [text]="true" size="small"
                    (onClick)="loadContactFromService()" [loading]="loadingContact()" />
                }
              </p>
              <div class="form-grid">
                <div class="field">
                  <label>Nom du responsable</label>
                  <input pInputText [(ngModel)]="form.contactName"
                    placeholder="Prénom Nom" class="w-full" />
                </div>

                <div class="field">
                  <label>Email de contact</label>
                  <input pInputText type="email" [(ngModel)]="form.contactEmail"
                    placeholder="contact@exemple.fr" class="w-full" />
                </div>

                <div class="field">
                  <label>Téléphone de contact</label>
                  <input pInputText [(ngModel)]="form.contactPhone"
                    placeholder="+33 1 23 45 67 89" class="w-full" />
                </div>
              </div>

              <div class="step-footer">
                <p-button
                  label="Suivant"
                  icon="pi pi-arrow-right"
                  iconPos="right"
                  [disabled]="!form.serviceId || !form.rgaaVersion"
                  (onClick)="activateCallback(2)"
                />
              </div>
            </div>
          </ng-template>
        </p-step-panel>

        <!-- Étape 2 : Pages auditées -->
        <p-step-panel [value]="2">
          <ng-template #content let-activateCallback="activateCallback">
            <div class="step-content">
              <h3>Échantillon de pages auditées</h3>
              <p class="hint">Ajoutez les pages qui ont été incluses dans l'audit (minimum recommandé : 5 pages).</p>

              <!-- Formulaire ajout page -->
              <div class="add-page-form">
                <input pInputText [(ngModel)]="newPage.name"
                  placeholder="Nom de la page (ex: Accueil)" class="flex-1" />
                <input pInputText [(ngModel)]="newPage.url"
                  placeholder="https://exemple.fr/" class="flex-2" />
                <p-select
                  [(ngModel)]="newPage.pageType"
                  [options]="pageTypes"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Type"
                  styleClass="w-10rem"
                />
                <p-button icon="pi pi-plus" (onClick)="addPage()"
                  [disabled]="!newPage.name || !newPage.url" />
              </div>

              <!-- Liste des pages -->
              @if (form.pages.length > 0) {
                <p-table [value]="form.pages" styleClass="p-datatable-sm" style="margin-top: 1rem">
                  <ng-template pTemplate="header">
                    <tr>
                      <th>#</th>
                      <th>Nom</th>
                      <th>URL</th>
                      <th>Type</th>
                      <th></th>
                    </tr>
                  </ng-template>
                  <ng-template pTemplate="body" let-p let-i="rowIndex">
                    <tr>
                      <td>{{ i + 1 }}</td>
                      <td>{{ p.name }}</td>
                      <td style="font-size: 0.85rem; color: var(--p-surface-500)">{{ p.url }}</td>
                      <td><p-tag [value]="getPageTypeLabel(p.pageType)" severity="secondary" /></td>
                      <td>
                        <p-button icon="pi pi-trash" [text]="true" severity="danger"
                          (onClick)="removePage(i)" />
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              } @else {
                <div class="empty-pages">
                  <i class="pi pi-file" style="font-size: 2rem; color: var(--p-surface-300)"></i>
                  <span>Aucune page ajoutée</span>
                </div>
              }

              <div class="step-footer">
                <p-button label="Précédent" icon="pi pi-arrow-left" severity="secondary"
                  (onClick)="activateCallback(1)" />
                <p-button label="Suivant" icon="pi pi-arrow-right" iconPos="right"
                  (onClick)="activateCallback(3)" />
              </div>
            </div>
          </ng-template>
        </p-step-panel>

        <!-- Étape 3 : Récapitulatif -->
        <p-step-panel [value]="3">
          <ng-template #content let-activateCallback="activateCallback">
            <div class="step-content">
              <h3>Récapitulatif</h3>

              <div class="recap-grid">
                <div class="recap-section">
                  <h4>Informations générales</h4>
                  <dl>
                    <dt>Service</dt>
                    <dd>{{ getServiceName() }}</dd>
                    <dt>Version RGAA</dt>
                    <dd>{{ form.rgaaVersion }}</dd>
                    <dt>Date d'audit</dt>
                    <dd>{{ form.dateAudit ? (form.dateAudit | date:'dd/MM/yyyy') : '—' }}</dd>
                    <dt>Société auditrice</dt>
                    <dd>{{ form.auditCompany || '—' }}</dd>
                    <dt>Contact responsable</dt>
                    <dd>{{ form.contactName || '—' }}</dd>
                    <dt>Email</dt>
                    <dd>{{ form.contactEmail || '—' }}</dd>
                  </dl>
                </div>

                <div class="recap-section">
                  <h4>Pages auditées ({{ form.pages.length }})</h4>
                  @if (form.pages.length > 0) {
                    <ul class="page-list">
                      @for (p of form.pages; track p.url) {
                        <li>
                          <strong>{{ p.name }}</strong>
                          <span>{{ p.url }}</span>
                        </li>
                      }
                    </ul>
                  } @else {
                    <p style="color: var(--p-surface-400)">Aucune page</p>
                  }
                </div>
              </div>

              <div class="step-footer">
                <p-button label="Précédent" icon="pi pi-arrow-left" severity="secondary"
                  (onClick)="activateCallback(2)" />
                <p-button
                  label="Créer la déclaration"
                  icon="pi pi-check"
                  [loading]="saving()"
                  (onClick)="submit()"
                />
              </div>
            </div>
          </ng-template>
        </p-step-panel>

      </p-step-panels>
    </p-stepper>
  `,
  styles: [`
    .page-header {
      margin-bottom: 1.5rem;
      h2 { font-size: 1.5rem; font-weight: 700; margin-top: 0.25rem; }
      p { color: var(--p-surface-500); margin-top: 0.25rem; }
    }
    .step-content { padding: 1.5rem 0; }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
      max-width: 700px;
    }
    .field { display: flex; flex-direction: column; gap: 0.375rem; label { font-weight: 500; font-size: 0.875rem; } small { color: var(--p-surface-400); font-size: 0.75rem; } }
    .col-span-2 { grid-column: span 2; }
    .form-section-title { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--p-surface-400); padding-top: 1rem; border-top: 1px solid var(--p-surface-200); margin-top: 0.75rem; margin-bottom: 0.25rem; }
    .required { color: var(--p-red-500); }
    .step-footer { display: flex; gap: 0.75rem; margin-top: 2rem; justify-content: flex-end; }
    .hint { color: var(--p-surface-500); font-size: 0.875rem; margin-bottom: 1rem; }
    h3 { font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; }
    h4 { font-size: 0.9rem; font-weight: 600; margin-bottom: 0.75rem; }
    .add-page-form {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      .flex-1 { flex: 1; }
      .flex-2 { flex: 2; }
    }
    .empty-pages {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 2rem;
      color: var(--p-surface-400);
      border: 2px dashed var(--p-surface-200);
      border-radius: 8px;
      margin-top: 1rem;
    }
    .recap-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    .recap-section dl { display: grid; grid-template-columns: auto 1fr; gap: 0.25rem 1rem; font-size: 0.875rem; }
    dt { color: var(--p-surface-500); }
    dd { font-weight: 500; margin: 0; }
    .page-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.875rem;
      li { display: flex; flex-direction: column; }
      span { color: var(--p-surface-400); font-size: 0.8rem; }
    }
  `],
})
export class CreateDeclarationComponent implements OnInit {
  private declarationsService = inject(DeclarationsService);
  private servicesService = inject(ServicesService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  services = signal<any[]>([]);
  saving = signal(false);
  activeStep = signal(1);

  rgaaVersions = RGAA_VERSIONS;
  pageTypes = PAGE_TYPES;

  loadingContact = signal(false);

  form = {
    serviceId: '',
    rgaaVersion: '4.1',
    dateAudit: null as Date | null,
    auditCompany: '',
    tools: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    pages: [] as { name: string; url: string; pageType: string }[],
  };

  newPage = { name: '', url: '', pageType: 'OTHER' };

  ngOnInit() {
    this.servicesService.findAll().subscribe(s => this.services.set(s));
  }

  loadContactFromService() {
    if (!this.form.serviceId) return;
    this.loadingContact.set(true);
    this.servicesService.findOne(this.form.serviceId).subscribe({
      next: (svc) => {
        this.form.contactName = svc.contactName ?? '';
        this.form.contactEmail = svc.contactEmail ?? '';
        this.form.contactPhone = svc.contactPhone ?? '';
        this.loadingContact.set(false);
      },
      error: () => this.loadingContact.set(false),
    });
  }

  addPage() {
    if (!this.newPage.name || !this.newPage.url) return;
    this.form.pages.push({ ...this.newPage });
    this.newPage = { name: '', url: '', pageType: 'OTHER' };
  }

  removePage(index: number) {
    this.form.pages.splice(index, 1);
  }

  getServiceName(): string {
    return this.services().find(s => s.id === this.form.serviceId)?.name ?? '—';
  }

  getPageTypeLabel(value: string): string {
    return PAGE_TYPES.find(t => t.value === value)?.label ?? value;
  }

  submit() {
    this.saving.set(true);
    this.declarationsService.create(this.form).subscribe({
      next: (decl) => {
        this.saving.set(false);
        this.router.navigate(['/declarations', decl.id]);
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de créer la déclaration' });
      },
    });
  }
}
