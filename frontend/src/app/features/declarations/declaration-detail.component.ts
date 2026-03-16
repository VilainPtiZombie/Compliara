import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { ChipModule } from 'primeng/chip';
import { ProgressBarModule } from 'primeng/progressbar';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { BadgeModule } from 'primeng/badge';
import { MessageService } from 'primeng/api';
import { DeclarationsService } from '../../core/services/declarations.service';

const STATUSES = [
  { label: 'Brouillon', value: 'DRAFT' },
  { label: 'Publié', value: 'PUBLISHED' },
  { label: 'Archivé', value: 'ARCHIVED' },
];

const RGAA_VERSIONS = ['4.1', '4.1.2', '3.0'];

@Component({
  selector: 'app-declaration-detail',
  standalone: true,
  providers: [MessageService],
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    TabsModule,
    ChipModule,
    ProgressBarModule,
    DialogModule,
    BadgeModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
    ToastModule,
  ],
  template: `
    <p-toast />

    @if (loading()) {
      <div style="padding: 3rem; text-align: center; color: var(--p-surface-400)">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
      </div>
    } @else if (declaration()) {

      <!-- Dialog édition -->
      <p-dialog header="Modifier la déclaration" [(visible)]="showEdit"
        [modal]="true" [style]="{width: '520px'}" [draggable]="false" (onHide)="resetEditForm()">
        <div class="edit-form">
          <div class="field">
            <label>Statut</label>
            <p-select [(ngModel)]="editForm.status" [options]="statuses"
              optionLabel="label" optionValue="value" styleClass="w-full" />
          </div>
          <div class="field">
            <label>Version RGAA</label>
            <p-select [(ngModel)]="editForm.rgaaVersion" [options]="rgaaVersions" styleClass="w-full" />
          </div>
          <div class="field">
            <label>Date d'audit</label>
            <p-datepicker [(ngModel)]="editForm.dateAudit" dateFormat="dd/mm/yy"
              [showIcon]="true" styleClass="w-full" />
          </div>
          <div class="field">
            <label>Société auditrice</label>
            <input pInputText [(ngModel)]="editForm.auditCompany" class="w-full" />
          </div>
          <div class="field">
            <label>Outils utilisés</label>
            <input pInputText [(ngModel)]="editForm.tools" class="w-full"
              placeholder="Wave, Colour Contrast Analyser..." />
          </div>
          <div class="field">
            <label>Nom du responsable</label>
            <input pInputText [(ngModel)]="editForm.contactName" class="w-full" />
          </div>
          <div class="field">
            <label>Email de contact</label>
            <input pInputText type="email" [(ngModel)]="editForm.contactEmail" class="w-full" />
          </div>
          <div class="field">
            <label>Téléphone</label>
            <input pInputText [(ngModel)]="editForm.contactPhone" class="w-full" />
          </div>
        </div>
        <ng-template pTemplate="footer">
          <p-button label="Annuler" severity="secondary" [text]="true" (onClick)="showEdit.set(false)" />
          <p-button label="Enregistrer" icon="pi pi-check" [loading]="saving()" (onClick)="saveEdit()" />
        </ng-template>
      </p-dialog>

      <div class="page-header">
        <div>
          <p-button icon="pi pi-arrow-left" [text]="true" severity="secondary"
            routerLink="/declarations" label="Retour" />
          <h2>{{ declaration()!.service?.name }}</h2>
          <p>RGAA {{ declaration()!.rgaaVersion }} — Audit du {{ declaration()!.dateAudit | date:'dd/MM/yyyy' }}</p>
        </div>
        <div class="header-actions">
          <p-tag [value]="getDeclarationStatusLabel(declaration()!.status)"
            [severity]="getStatusSeverity(declaration()!.status)" />
          <p-button label="Auditer" icon="pi pi-check-square" severity="secondary"
            [outlined]="true" (onClick)="goToAudit()" />
          <p-button label="Modifier" icon="pi pi-pencil" severity="secondary"
            [outlined]="true" (onClick)="openEdit()" />
        </div>
      </div>

      <!-- Résumé -->
      <div class="summary-grid">
        <p-card>
          <div class="metric">
            <span class="metric-label">Taux de conformité</span>
            <span class="metric-value" [style.color]="getRateColor(declaration()!.complianceRate)">
              {{ declaration()!.complianceRate ?? '—' }}%
            </span>
            @if (declaration()!.complianceRate !== null) {
              <p-progressBar [value]="declaration()!.complianceRate"
                [style]="{height: '6px'}" [showValue]="false" />
            }
          </div>
        </p-card>
        <p-card>
          <div class="metric">
            <span class="metric-label">Critères audités</span>
            <span class="metric-value">{{ totalCriteria() }}</span>
          </div>
        </p-card>
        <p-card>
          <div class="metric">
            <span class="metric-label">Pages auditées</span>
            <span class="metric-value">{{ declaration()!.auditedPages?.length ?? 0 }}</span>
          </div>
        </p-card>
        <p-card>
          <div class="metric">
            <span class="metric-label">Non-conformes</span>
            <span class="metric-value" style="color: var(--p-red-500)">{{ ncCount() }}</span>
          </div>
        </p-card>
      </div>

      <!-- Onglets -->
      <p-tabs [value]="0" style="margin-top: 1.5rem">
        <p-tablist>
          <p-tab [value]="0">Critères</p-tab>
          <p-tab [value]="1">Pages</p-tab>
          <p-tab [value]="2">Contact</p-tab>
        </p-tablist>

        <p-tabpanels>
          <!-- Tab Critères -->
          <p-tabpanel [value]="0">
            <!-- Barre de filtres -->
            <div class="criteria-toolbar">
              <input pInputText #globalFilter
                placeholder="Rechercher (ref, intitulé...)"
                (input)="criteriaTable.filterGlobal(globalFilter.value, 'contains')"
                class="filter-input" />
              <p-select
                [(ngModel)]="filterStatus"
                [options]="statusFilterOptions"
                optionLabel="label" optionValue="value"
                placeholder="Tous les statuts"
                [showClear]="true"
                (onChange)="criteriaTable.filter($event.value, 'status', 'equals')"
                styleClass="w-12rem" />
              <p-select
                [(ngModel)]="filterImpact"
                [options]="impactFilterOptions"
                optionLabel="label" optionValue="value"
                placeholder="Tous les impacts"
                [showClear]="true"
                (onChange)="criteriaTable.filter($event.value, 'impact', 'equals')"
                styleClass="w-12rem" />
            </div>

            <p-table #criteriaTable
              [value]="declaration()!.criterionResults ?? []"
              styleClass="p-datatable-sm"
              [rowHover]="true"
              [paginator]="true"
              [rows]="25"
              [globalFilterFields]="['criterionRef','title','thematic']">
              <ng-template pTemplate="header">
                <tr>
                  <th pSortableColumn="criterionRef" style="width: 90px">
                    Réf <p-sortIcon field="criterionRef" />
                  </th>
                  <th pSortableColumn="title">
                    Intitulé <p-sortIcon field="title" />
                  </th>
                  <th pSortableColumn="level" style="width: 80px">
                    Niveau <p-sortIcon field="level" />
                  </th>
                  <th pSortableColumn="status" style="width: 110px">
                    Statut <p-sortIcon field="status" />
                  </th>
                  <th pSortableColumn="impact" style="width: 110px">
                    Impact <p-sortIcon field="impact" />
                  </th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-cr>
                <tr>
                  <td><strong>{{ cr.criterionRef }}</strong></td>
                  <td>{{ cr.title }}</td>
                  <td><p-chip [label]="cr.level || '—'" /></td>
                  <td>
                    <p-tag [value]="getStatusLabel(cr.status)" [severity]="getCriterionSeverity(cr.status)" />
                  </td>
                  <td>
                    @if (cr.impact) {
                      <p-tag [value]="cr.impact" [severity]="getImpactSeverity(cr.impact)" />
                    } @else { — }
                  </td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr><td colspan="5" style="text-align:center; color: var(--p-surface-400); padding: 2rem">
                  Aucun critère correspondant aux filtres.
                </td></tr>
              </ng-template>
            </p-table>
          </p-tabpanel>

          <!-- Tab Pages -->
          <p-tabpanel [value]="1">
            <p-table [value]="pagesWithNc()" styleClass="p-datatable-sm">
              <ng-template pTemplate="header">
                <tr>
                  <th pSortableColumn="order" style="width: 50px">#</th>
                  <th pSortableColumn="name">Nom</th>
                  <th>URL</th>
                  <th pSortableColumn="pageType" style="width: 120px">Type</th>
                  <th style="width: 130px; text-align:center">Non-conformités</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-p>
                <tr>
                  <td>{{ p.order }}</td>
                  <td><strong>{{ p.name }}</strong></td>
                  <td><a [href]="p.url" target="_blank" rel="noopener" class="page-url">{{ p.url }}</a></td>
                  <td><p-chip [label]="p.pageType" /></td>
                  <td style="text-align:center">
                    @if (p.ncCount > 0) {
                      <p-badge [value]="p.ncCount" severity="danger" />
                    } @else {
                      <p-badge value="0" severity="success" />
                    }
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </p-tabpanel>

          <!-- Tab Contact -->
          <p-tabpanel [value]="2">
            <div class="contact-info">
              <dl>
                <dt>Auditeur(s)</dt>
                <dd>{{ declaration()!.contactName || '—' }}</dd>
                <dt>Email</dt>
                <dd>{{ declaration()!.contactEmail || '—' }}</dd>
                <dt>Téléphone</dt>
                <dd>{{ declaration()!.contactPhone || '—' }}</dd>
              </dl>
            </div>
          </p-tabpanel>
        </p-tabpanels>
      </p-tabs>
    } @else {
      <p-card>
        <p style="text-align:center; color: var(--p-surface-400); padding: 2rem;">Déclaration introuvable.</p>
      </p-card>
    }
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      h2 { font-size: 1.5rem; font-weight: 700; margin-top: 0.25rem; }
      p { color: var(--p-surface-500); margin-top: 0.25rem; }
    }
    .header-actions { display: flex; align-items: center; gap: 0.5rem; padding-top: 2rem; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
    .metric { display: flex; flex-direction: column; gap: 0.5rem; }
    .metric-label { font-size: 0.8rem; color: var(--p-surface-500); text-transform: uppercase; letter-spacing: 0.05em; }
    .metric-value { font-size: 2rem; font-weight: 700; }
    .page-url { color: var(--p-primary-500); text-decoration: none; font-size: 0.875rem; }
    .edit-form { display: flex; flex-direction: column; gap: 1rem; padding: 0.5rem 0; }
    .field { display: flex; flex-direction: column; gap: 0.375rem; label { font-weight: 500; font-size: 0.875rem; } }
    .criteria-toolbar {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    .filter-input { flex: 1; min-width: 200px; }
    .contact-info { padding: 1rem 0; }
    dl { display: grid; grid-template-columns: 150px 1fr; gap: 0.5rem 1rem; }
    dt { color: var(--p-surface-500); font-size: 0.875rem; }
    dd { font-weight: 500; margin: 0; }
  `],
})
export class DeclarationDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private declarationsService = inject(DeclarationsService);
  private messageService = inject(MessageService);

  declaration = signal<any>(null);
  loading = signal(true);
  saving = signal(false);
  showEdit = signal(false);

  statuses = STATUSES;
  rgaaVersions = RGAA_VERSIONS;

  editForm = { status: '', rgaaVersion: '', dateAudit: null as Date | null, auditCompany: '', tools: '', contactName: '', contactEmail: '', contactPhone: '' };

  filterStatus: string | null = null;
  filterImpact: string | null = null;

  statusFilterOptions = [
    { label: 'Conforme', value: 'CONFORME' },
    { label: 'Non conforme', value: 'NON_CONFORME' },
    { label: 'Non applicable', value: 'NON_APPLICABLE' },
  ];

  impactFilterOptions = [
    { label: 'Critique', value: 'CRITICAL' },
    { label: 'Élevé', value: 'HIGH' },
    { label: 'Moyen', value: 'MEDIUM' },
    { label: 'Faible', value: 'LOW' },
  ];

  totalCriteria = computed(() => this.declaration()?.criterionResults?.length ?? 0);
  ncCount = computed(() => this.declaration()?.criterionResults?.filter((c: any) => c.status === 'NON_CONFORME').length ?? 0);

  pagesWithNc = computed(() => {
    const d = this.declaration();
    if (!d) return [];
    const results: any[] = d.criterionResults ?? [];
    return (d.auditedPages ?? []).map((page: any) => ({
      ...page,
      ncCount: results.filter((cr: any) =>
        cr.status === 'NON_CONFORME' &&
        cr.affectedPages?.some((ap: any) => ap.id === page.id)
      ).length,
    }));
  });

  ngOnInit() {
    this.load();
  }

  load() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.declarationsService.findOne(id).subscribe({
      next: (d) => { this.declaration.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  goToAudit() {
    this.router.navigate(['/declarations', this.declaration()!.id, 'audit']);
  }

  openEdit() {
    const d = this.declaration()!;
    this.editForm = {
      status: d.status,
      rgaaVersion: d.rgaaVersion,
      dateAudit: d.dateAudit ? new Date(d.dateAudit) : null,
      auditCompany: d.auditCompany ?? '',
      tools: d.tools ?? '',
      contactName: d.contactName ?? '',
      contactEmail: d.contactEmail ?? '',
      contactPhone: d.contactPhone ?? '',
    };
    this.showEdit.set(true);
  }

  resetEditForm() {
    this.editForm = { status: '', rgaaVersion: '', dateAudit: null, auditCompany: '', tools: '', contactName: '', contactEmail: '', contactPhone: '' };
  }

  saveEdit() {
    this.saving.set(true);
    const id = this.declaration()!.id;
    this.declarationsService.update(id, {
      status: this.editForm.status,
      rgaaVersion: this.editForm.rgaaVersion,
      dateAudit: this.editForm.dateAudit?.toISOString() ?? null,
      auditCompany: this.editForm.auditCompany,
      tools: this.editForm.tools,
      contactName: this.editForm.contactName,
      contactEmail: this.editForm.contactEmail,
      contactPhone: this.editForm.contactPhone,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.showEdit.set(false);
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Déclaration mise à jour' });
        this.load();
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de mettre à jour' });
      },
    });
  }

  getRateColor(rate: number): string {
    if (rate >= 75) return 'var(--p-green-600)';
    if (rate >= 50) return 'var(--p-orange-500)';
    return 'var(--p-red-500)';
  }

  getDeclarationStatusLabel(status: string): string {
    return ({ PUBLISHED: 'Publié', DRAFT: 'Brouillon', ARCHIVED: 'Archivé' } as any)[status] ?? status;
  }

  getStatusSeverity(status: string): 'success' | 'warn' | 'secondary' {
    return ({ PUBLISHED: 'success', DRAFT: 'warn', ARCHIVED: 'secondary' } as any)[status] ?? 'secondary';
  }

  getStatusLabel(status: string): string {
    return ({ CONFORME: 'C', NON_CONFORME: 'NC', NON_APPLICABLE: 'NA' } as any)[status] ?? status;
  }

  getCriterionSeverity(status: string): 'success' | 'danger' | 'secondary' {
    return ({ CONFORME: 'success', NON_CONFORME: 'danger', NON_APPLICABLE: 'secondary' } as any)[status] ?? 'secondary';
  }

  getImpactSeverity(impact: string): 'danger' | 'warn' | 'info' | 'secondary' {
    return ({ CRITICAL: 'danger', HIGH: 'warn', MEDIUM: 'info', LOW: 'secondary' } as any)[impact] ?? 'secondary';
  }
}
