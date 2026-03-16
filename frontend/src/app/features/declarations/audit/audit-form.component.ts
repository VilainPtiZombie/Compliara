import { Component, inject, signal, computed, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { StepperModule } from 'primeng/stepper';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { AccordionModule } from 'primeng/accordion';
import { ProgressBarModule } from 'primeng/progressbar';
import { MultiSelectModule } from 'primeng/multiselect';
import { BadgeModule } from 'primeng/badge';
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { DeclarationsService } from '../../../core/services/declarations.service';

interface CriterionForm {
  id: string;
  criterionRef: string;
  thematic: string;
  title: string;
  level: string;
  status: string;
  comment: string;
  impact: string;
  affectedPageIds: string[];
}

interface PageForm {
  id?: string;
  name: string;
  url: string;
  pageType: string;
}

const STATUS_OPTIONS = [
  { label: 'Non audité', value: 'NON_AUDITE' },
  { label: 'Conforme', value: 'CONFORME' },
  { label: 'Non conforme', value: 'NON_CONFORME' },
  { label: 'Non applicable', value: 'NON_APPLICABLE' },
];

const IMPACT_OPTIONS = [
  { label: 'Critique', value: 'CRITICAL' },
  { label: 'Élevé', value: 'HIGH' },
  { label: 'Moyen', value: 'MEDIUM' },
  { label: 'Faible', value: 'LOW' },
];

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
  selector: 'app-audit-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    StepperModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    TagModule,
    ToastModule,
    AccordionModule,
    ProgressBarModule,
    MultiSelectModule,
    BadgeModule,
    TableModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />

    @if (loading()) {
      <div class="loading-overlay">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
        <span>Chargement de l'audit…</span>
      </div>
    } @else {

      <!-- Header ────────────────────────────────────────────────────────────── -->
      <div class="audit-header">
        <div class="audit-title">
          <p-button icon="pi pi-arrow-left" [text]="true" severity="secondary"
            (onClick)="goBack()" />
          <div>
            <h2>Formulaire d'audit</h2>
            <p class="subtitle">{{ declaration()?.service?.name }}</p>
          </div>
        </div>
        <div class="audit-actions">
          @if (activeStep() === 1) {
            <span class="progress-label">{{ progress().audited }} / {{ progress().total }} évalués</span>
          }
          <p-button
            [label]="activeStep() === 0 ? 'Enregistrer les pages' : 'Enregistrer le brouillon'"
            icon="pi pi-save"
            [outlined]="true"
            [loading]="saving()"
            (onClick)="save()"
          />
        </div>
      </div>

      <!-- Barre de progression (étape 2) ────────────────────────────────────── -->
      @if (activeStep() === 1) {
        <div class="progress-bar-wrap">
          <div class="progress-stats">
            <p-tag severity="success" [value]="conformCount() + ' C'" />
            <p-tag severity="danger" [value]="ncCount() + ' NC'" />
            <p-tag severity="secondary" [value]="naCount() + ' NA'" />
          </div>
          <p-progressbar [value]="progress().percent" styleClass="audit-progress" />
        </div>
      }

      <!-- Stepper ────────────────────────────────────────────────────────────── -->
      <p-stepper [value]="activeStep()" (valueChange)="activeStep.set($event ?? 0)" [linear]="false">

        <p-step-list>
          <p-step [value]="0">Pages auditées</p-step>
          <p-step [value]="1">Critères RGAA</p-step>
        </p-step-list>

        <p-step-panels>

          <!-- ── Étape 1 : Pages ──────────────────────────────────────────── -->
          <p-step-panel [value]="0">
            <ng-template #content let-activateCallback="activateCallback">
              <div class="step-content">

                <div class="add-page-form">
                  <input pInputText [(ngModel)]="newPage.name"
                    placeholder="Nom de la page (ex: Accueil)" style="flex:1" />
                  <input pInputText [(ngModel)]="newPage.url"
                    placeholder="https://exemple.fr/" style="flex:2" />
                  <p-select
                    [(ngModel)]="newPage.pageType"
                    [options]="pageTypes"
                    optionLabel="label"
                    optionValue="value"
                    styleClass="w-10rem"
                  />
                  <p-button icon="pi pi-plus" (onClick)="addPage()"
                    [disabled]="!newPage.name || !newPage.url" />
                </div>

                @if (pages().length > 0) {
                  <p-table [value]="pages()" styleClass="p-datatable-sm" style="margin-top:1rem">
                    <ng-template pTemplate="header">
                      <tr>
                        <th style="width:3rem">#</th>
                        <th>Nom</th>
                        <th>URL</th>
                        <th>Type</th>
                        <th style="width:3rem"></th>
                      </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-p let-i="rowIndex">
                      <tr>
                        <td>{{ i + 1 }}</td>
                        <td>{{ p.name }}</td>
                        <td class="url-cell">{{ p.url }}</td>
                        <td><p-tag [value]="getPageTypeLabel(p.pageType)" severity="secondary" /></td>
                        <td>
                          <p-button icon="pi pi-trash" [text]="true" severity="danger"
                            (onClick)="removePage(i)" />
                        </td>
                      </tr>
                    </ng-template>
                  </p-table>
                } @else {
                  <div class="empty-state">
                    <i class="pi pi-file-edit"></i>
                    <span>Aucune page ajoutée</span>
                  </div>
                }

                <div class="step-footer">
                  <p-button label="Suivant : Critères" icon="pi pi-arrow-right" iconPos="right"
                    (onClick)="activateCallback(1)" />
                </div>
              </div>
            </ng-template>
          </p-step-panel>

          <!-- ── Étape 2 : Critères ────────────────────────────────────────── -->
          <p-step-panel [value]="1">
            <ng-template #content let-activateCallback="activateCallback">
              <div class="step-content">

                <!-- Filtres -->
                <div class="criteria-filters">
                  <input pInputText
                    [ngModel]="searchQuery()"
                    (ngModelChange)="searchQuery.set($event)"
                    placeholder="Rechercher un critère…"
                    style="flex:1"
                  />
                  <p-select
                    [ngModel]="filterStatus()"
                    (ngModelChange)="filterStatus.set($event)"
                    [options]="filterStatusOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Tous les statuts"
                    styleClass="w-12rem"
                  />
                </div>

                <!-- Accordéon par thématique -->
                <p-accordion [multiple]="true">
                  @for (group of filteredGroups(); track group.thematic) {
                    <p-accordion-panel [value]="group.thematic">
                      <p-accordion-header>
                        <span class="thematic-header">
                          {{ group.thematic }}
                          <span class="thematic-counts">
                            <span class="count-c">{{ getGroupCount(group, 'CONFORME') }}</span>
                            <span class="count-nc">{{ getGroupCount(group, 'NON_CONFORME') }}</span>
                            <span class="count-na">{{ getGroupCount(group, 'NON_APPLICABLE') }}</span>
                            <span class="count-todo">{{ getGroupCount(group, 'NON_AUDITE') }}</span>
                          </span>
                        </span>
                      </p-accordion-header>
                      <p-accordion-content>
                        <div class="criteria-list">
                          @for (criterion of group.items; track criterion.criterionRef) {
                            <div class="criterion-row" [class.nc]="criterion.status === 'NON_CONFORME'">

                              <div class="criterion-ref">
                                <strong>{{ criterion.criterionRef }}</strong>
                                <span class="level-badge" [class]="'level-' + criterion.level">{{ criterion.level }}</span>
                              </div>

                              <div class="criterion-title">{{ criterion.title }}</div>

                              <div class="criterion-controls">
                                <p-select
                                  [ngModel]="criterion.status"
                                  (ngModelChange)="onStatusChange(criterion, $event)"
                                  [options]="statusOptions"
                                  optionLabel="label"
                                  optionValue="value"
                                  styleClass="status-select"
                                  [class]="'status-' + criterion.status"
                                />

                                @if (criterion.status === 'NON_CONFORME') {
                                  <p-select
                                    [ngModel]="criterion.impact"
                                    (ngModelChange)="onImpactChange(criterion, $event)"
                                    [options]="impactOptions"
                                    optionLabel="label"
                                    optionValue="value"
                                    placeholder="Impact"
                                    styleClass="w-8rem"
                                  />
                                }
                              </div>

                              @if (criterion.status === 'NON_CONFORME') {
                                <div class="criterion-nc-details">
                                  <textarea pTextarea
                                    [ngModel]="criterion.comment"
                                    (ngModelChange)="criterion.comment = $event"
                                    (blur)="saveCriterion(criterion)"
                                    rows="2"
                                    placeholder="Décrire la non-conformité…"
                                    class="w-full"
                                  ></textarea>

                                  @if (pages().length > 0) {
                                    <p-multiselect
                                      [ngModel]="criterion.affectedPageIds"
                                      (ngModelChange)="onAffectedPagesChange(criterion, $event)"
                                      [options]="pages()"
                                      optionLabel="name"
                                      optionValue="id"
                                      placeholder="Pages concernées"
                                      styleClass="w-full"
                                    />
                                  }
                                </div>
                              }

                            </div>
                          }
                        </div>
                      </p-accordion-content>
                    </p-accordion-panel>
                  }
                </p-accordion>

                @if (filteredGroups().length === 0) {
                  <div class="empty-state">
                    <i class="pi pi-filter-slash"></i>
                    <span>Aucun critère ne correspond aux filtres</span>
                  </div>
                }

              </div>
            </ng-template>
          </p-step-panel>

        </p-step-panels>
      </p-stepper>

    }
  `,
  styles: [`
    .loading-overlay {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 1rem; padding: 4rem;
      color: var(--p-surface-400);
    }
    .audit-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 1rem; gap: 1rem;
    }
    .audit-title { display: flex; align-items: center; gap: 0.75rem; }
    .audit-title h2 { font-size: 1.25rem; font-weight: 700; margin: 0; }
    .subtitle { color: var(--p-surface-400); font-size: 0.875rem; margin: 0; }
    .audit-actions { display: flex; align-items: center; gap: 0.75rem; }
    .progress-label { font-size: 0.875rem; color: var(--p-surface-500); }

    .progress-bar-wrap {
      margin-bottom: 1rem;
      display: flex; flex-direction: column; gap: 0.5rem;
    }
    .progress-stats { display: flex; gap: 0.5rem; align-items: center; }
    :host ::ng-deep .audit-progress { height: 8px !important; }

    .step-content { padding: 1rem 0; }
    .step-footer { display: flex; justify-content: flex-end; margin-top: 1.5rem; }

    .add-page-form {
      display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;
    }

    .url-cell { font-size: 0.8rem; color: var(--p-surface-400); }

    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      gap: 0.5rem; padding: 2rem;
      border: 2px dashed var(--p-surface-200); border-radius: 8px;
      color: var(--p-surface-300); margin-top: 1rem;
      i { font-size: 2rem; }
    }

    .criteria-filters {
      display: flex; gap: 0.75rem; margin-bottom: 1rem;
    }

    .thematic-header {
      display: flex; align-items: center; justify-content: space-between;
      width: 100%; gap: 1rem;
    }
    .thematic-counts {
      display: flex; gap: 0.4rem; font-size: 0.75rem; font-weight: 600;
    }
    .count-c  { color: var(--p-green-600); }
    .count-nc { color: var(--p-red-600); }
    .count-na { color: var(--p-surface-400); }
    .count-todo { color: var(--p-orange-400); }

    .criteria-list { display: flex; flex-direction: column; gap: 0; }

    .criterion-row {
      display: grid;
      grid-template-columns: 4rem 1fr auto;
      grid-template-rows: auto;
      gap: 0.5rem 1rem;
      align-items: start;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--p-surface-100);
      transition: background 0.15s;
      &:last-child { border-bottom: none; }
      &:hover { background: var(--p-surface-50); }
      &.nc { background: color-mix(in srgb, var(--p-red-50) 60%, transparent); }
    }

    .criterion-ref {
      display: flex; flex-direction: column; align-items: center;
      gap: 0.25rem; padding-top: 0.2rem;
      strong { font-size: 0.875rem; }
    }
    .level-badge {
      font-size: 0.65rem; font-weight: 700; padding: 0.1rem 0.3rem;
      border-radius: 3px; text-transform: uppercase;
      &.level-A  { background: var(--p-blue-100); color: var(--p-blue-700); }
      &.level-AA { background: var(--p-orange-100); color: var(--p-orange-700); }
      &.level-AAA{ background: var(--p-purple-100); color: var(--p-purple-700); }
    }

    .criterion-title {
      font-size: 0.875rem; line-height: 1.4;
      padding-top: 0.2rem;
    }

    .criterion-controls {
      display: flex; gap: 0.5rem; align-items: center;
    }

    .criterion-nc-details {
      grid-column: 2 / -1;
      display: flex; flex-direction: column; gap: 0.5rem;
    }

    :host ::ng-deep .status-select { min-width: 8rem; }
    :host ::ng-deep .status-CONFORME .p-select-label { color: var(--p-green-700); font-weight: 600; }
    :host ::ng-deep .status-NON_CONFORME .p-select-label { color: var(--p-red-700); font-weight: 600; }
    :host ::ng-deep .status-NON_AUDITE .p-select-label { color: var(--p-surface-400); }
  `],
})
export class AuditFormComponent implements OnInit {
  private declarationsService = inject(DeclarationsService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  id = input.required<string>();

  // State
  declaration = signal<any>(null);
  loading = signal(true);
  saving = signal(false);
  activeStep = signal(0);

  pages = signal<PageForm[]>([]);
  newPage = { name: '', url: '', pageType: 'OTHER' };

  criteria = signal<CriterionForm[]>([]);
  filterStatus = signal('');
  searchQuery = signal('');

  // Static options
  statusOptions = STATUS_OPTIONS;
  impactOptions = IMPACT_OPTIONS;
  pageTypes = PAGE_TYPES;
  filterStatusOptions = [{ label: 'Tous les statuts', value: '' }, ...STATUS_OPTIONS];

  // Computed
  groupedCriteria = computed(() => {
    const groups = new Map<string, CriterionForm[]>();
    for (const c of this.criteria()) {
      if (!groups.has(c.thematic)) groups.set(c.thematic, []);
      groups.get(c.thematic)!.push(c);
    }
    return Array.from(groups.entries()).map(([thematic, items]) => ({ thematic, items }));
  });

  filteredGroups = computed(() => {
    const status = this.filterStatus();
    const q = this.searchQuery().toLowerCase();
    return this.groupedCriteria()
      .map(g => ({
        ...g,
        items: g.items.filter(c =>
          (!status || c.status === status) &&
          (!q || c.title.toLowerCase().includes(q) || c.criterionRef.includes(q)),
        ),
      }))
      .filter(g => g.items.length > 0);
  });

  progress = computed(() => {
    const all = this.criteria();
    const audited = all.filter(c => c.status !== 'NON_AUDITE').length;
    return {
      audited,
      total: all.length,
      percent: all.length > 0 ? Math.round((audited / all.length) * 100) : 0,
    };
  });

  conformCount = computed(() => this.criteria().filter(c => c.status === 'CONFORME').length);
  ncCount = computed(() => this.criteria().filter(c => c.status === 'NON_CONFORME').length);
  naCount = computed(() => this.criteria().filter(c => c.status === 'NON_APPLICABLE').length);

  async ngOnInit() {
    try {
      let decl = await lastValueFrom(this.declarationsService.findOne(this.id()));

      // Initialiser les critères si aucun n'existe
      if (decl.criterionResults.length === 0) {
        decl = await lastValueFrom(this.declarationsService.initAudit(this.id()));
      }

      this.declaration.set(decl);
      this.pages.set(decl.auditedPages.map((p: any) => ({
        id: p.id,
        name: p.name,
        url: p.url,
        pageType: p.pageType,
      })));

      this.criteria.set(
        [...decl.criterionResults].sort((a: any, b: any) =>
          this.compareCriterionRef(a.criterionRef, b.criterionRef)
        ).map((cr: any) => ({
          id: cr.id,
          criterionRef: cr.criterionRef,
          thematic: cr.thematic,
          title: cr.title,
          level: cr.level,
          status: cr.status,
          comment: cr.comment ?? '',
          impact: cr.impact ?? '',
          affectedPageIds: (cr.affectedPages ?? []).map((p: any) => p.id),
        }))
      );
    } catch {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger l\'audit' });
    } finally {
      this.loading.set(false);
    }
  }

  // ── Pages ──────────────────────────────────────────────────────────────────

  addPage() {
    if (!this.newPage.name || !this.newPage.url) return;
    this.pages.update(p => [...p, { ...this.newPage }]);
    this.newPage = { name: '', url: '', pageType: 'OTHER' };
  }

  removePage(index: number) {
    this.pages.update(p => p.filter((_, i) => i !== index));
  }

  getPageTypeLabel(value: string): string {
    return PAGE_TYPES.find(t => t.value === value)?.label ?? value;
  }

  // ── Critères ───────────────────────────────────────────────────────────────

  onStatusChange(criterion: CriterionForm, status: string) {
    criterion.status = status;
    if (status !== 'NON_CONFORME') {
      criterion.comment = '';
      criterion.affectedPageIds = [];
    }
    this.criteria.update(list => [...list]); // trigger computed re-evaluation
    this.saveCriterion(criterion);
  }

  onImpactChange(criterion: CriterionForm, impact: string) {
    criterion.impact = impact;
    this.saveCriterion(criterion);
  }

  onAffectedPagesChange(criterion: CriterionForm, pageIds: string[]) {
    criterion.affectedPageIds = pageIds;
    this.saveCriterion(criterion);
  }

  saveCriterion(criterion: CriterionForm) {
    this.declarationsService.updateCriterion(this.id(), criterion.criterionRef, {
      status: criterion.status,
      comment: criterion.comment || undefined,
      impact: criterion.impact || undefined,
      affectedPageIds: criterion.affectedPageIds,
    }).subscribe({
      error: () => this.messageService.add({
        severity: 'warn', summary: 'Attention', detail: `Erreur lors de la sauvegarde du critère ${criterion.criterionRef}`,
      }),
    });
  }

  // ── Sauvegarde globale ─────────────────────────────────────────────────────

  async save() {
    this.saving.set(true);
    try {
      if (this.activeStep() === 0) {
        await lastValueFrom(this.declarationsService.updatePages(this.id(), this.pages()));
        this.messageService.add({ severity: 'success', summary: 'Enregistré', detail: 'Pages auditées sauvegardées' });
      } else {
        const criteriaPayload = this.criteria().map(c => ({
          criterionRef: c.criterionRef,
          status: c.status,
          comment: c.comment || undefined,
          impact: c.impact || undefined,
          affectedPageIds: c.affectedPageIds,
        }));
        await lastValueFrom(this.declarationsService.bulkUpdateCriteria(this.id(), criteriaPayload));
        this.messageService.add({ severity: 'success', summary: 'Brouillon enregistré', detail: `${this.criteria().length} critères sauvegardés` });
      }
    } catch {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'La sauvegarde a échoué' });
    } finally {
      this.saving.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/declarations', this.id()]);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  getGroupCount(group: { items: CriterionForm[] }, status: string): number {
    return group.items.filter(c => c.status === status).length;
  }

  private compareCriterionRef(a: string, b: string): number {
    const [aMain, aSub] = a.split('.').map(Number);
    const [bMain, bSub] = b.split('.').map(Number);
    return aMain !== bMain ? aMain - bMain : (aSub ?? 0) - (bSub ?? 0);
  }
}
