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
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { BadgeModule } from 'primeng/badge';
import { MessageService } from 'primeng/api';
import { DeclarationsService } from '../../core/services/declarations.service';
import {
  CorrectiveActionsService,
  TeamUser,
} from '../../core/services/corrective-actions.service';

const STATUSES = [
  { label: 'Brouillon', value: 'DRAFT' },
  { label: 'Publié', value: 'PUBLISHED' },
  { label: 'Archivé', value: 'ARCHIVED' },
];

const RGAA_VERSIONS = ['4.1', '4.1.2', '3.0'];

const ACTION_STATUS_OPTIONS = [
  { label: 'À faire', value: 'TODO' },
  { label: 'En cours', value: 'IN_PROGRESS' },
  { label: 'Terminé', value: 'DONE' },
  { label: 'Ne sera pas corrigé', value: 'WONT_FIX' },
];

const PRIORITY_OPTIONS = [
  { label: 'Critique', value: 'CRITICAL' },
  { label: 'Élevé', value: 'HIGH' },
  { label: 'Moyen', value: 'MEDIUM' },
  { label: 'Faible', value: 'LOW' },
];

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
    TextareaModule,
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

      <!-- Dialog édition déclaration -->
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

      <!-- Dialog action corrective -->
      <p-dialog [header]="actionPanelHeader()"
        [(visible)]="showActionPanel" [modal]="true" [style]="{width: '580px'}"
        [draggable]="false" (onHide)="resetActionForm()">
        @if (selectedCriterion()) {
          <div class="action-form">
            <div class="criterion-info">
              <strong>{{ selectedCriterion()!.criterionRef }}</strong>
              — {{ selectedCriterion()!.title }}
            </div>

            <div class="field">
              <label>Titre de l'action</label>
              <input pInputText [(ngModel)]="actionForm.title" class="w-full"
                [placeholder]="'Corriger ' + selectedCriterion()!.criterionRef" />
            </div>
            <div class="field">
              <label>Description</label>
              <textarea pTextarea [(ngModel)]="actionForm.description" class="w-full" rows="3"
                placeholder="Décrivez les étapes de correction..."></textarea>
            </div>
            <div class="field">
              <label>Note / Contexte</label>
              <textarea pTextarea [(ngModel)]="actionForm.note" class="w-full" rows="2"
                placeholder="Informations complémentaires, liens utiles..."></textarea>
            </div>
            <div class="field-row">
              <div class="field">
                <label>Priorité</label>
                <p-select [(ngModel)]="actionForm.priority" [options]="priorityOptions"
                  optionLabel="label" optionValue="value" styleClass="w-full" />
              </div>
              <div class="field">
                <label>Statut</label>
                <p-select [(ngModel)]="actionForm.status" [options]="actionStatusOptions"
                  optionLabel="label" optionValue="value" styleClass="w-full" />
              </div>
            </div>
            @if (actionForm.status === 'WONT_FIX') {
              <div class="field">
                <label>Raison (obligatoire)</label>
                <input pInputText [(ngModel)]="actionForm.wontFixReason" class="w-full"
                  placeholder="Expliquez pourquoi cette NC ne sera pas corrigée" />
              </div>
            }
            <div class="field-row">
              <div class="field">
                <label>Responsable</label>
                <p-select [(ngModel)]="actionForm.assignedToId" [options]="teamUsers()"
                  optionLabel="fullName" optionValue="id" [showClear]="true"
                  placeholder="Non assigné" styleClass="w-full" />
              </div>
              <div class="field">
                <label>Échéance</label>
                <p-datepicker [(ngModel)]="actionForm.dueDate" dateFormat="dd/mm/yy"
                  [showIcon]="true" styleClass="w-full" />
              </div>
            </div>
            <div class="field">
              <label>Sprint / Livraison</label>
              <input pInputText [(ngModel)]="actionForm.sprint" class="w-full"
                placeholder="Sprint 12, Q2 2026, v1.3.0..." />
            </div>
          </div>
        }
        <ng-template pTemplate="footer">
          @if (selectedCriterion()?.correctiveAction) {
            <p-button label="Supprimer" icon="pi pi-trash" severity="danger" [text]="true"
              [loading]="deletingAction()" (onClick)="deleteAction()" />
          }
          <p-button label="Annuler" severity="secondary" [text]="true"
            (onClick)="showActionPanel.set(false)" />
          <p-button [label]="selectedCriterion()?.correctiveAction ? 'Mettre à jour' : 'Planifier'"
            icon="pi pi-check" [loading]="savingAction()" (onClick)="saveAction()" />
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
          <p-tab [value]="3">
            Planification
            @if (ncWithoutAction() > 0) {
              <p-badge [value]="ncWithoutAction()" severity="warn" style="margin-left: 0.5rem" />
            }
          </p-tab>
        </p-tablist>

        <p-tabpanels>
          <!-- Tab Critères -->
          <p-tabpanel [value]="0">
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
                  <th style="width: 130px">Action</th>
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
                  <td>
                    @if (cr.status === 'NON_CONFORME') {
                      <p-button
                        [label]="cr.correctiveAction ? 'Modifier plan' : 'Planifier'"
                        [icon]="cr.correctiveAction ? 'pi pi-pencil' : 'pi pi-calendar-plus'"
                        size="small"
                        [severity]="cr.correctiveAction ? 'secondary' : 'primary'"
                        [outlined]="true"
                        (onClick)="openActionPanel(cr)" />
                    }
                  </td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr><td colspan="6" style="text-align:center; color: var(--p-surface-400); padding: 2rem">
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

          <!-- Tab Planification -->
          <p-tabpanel [value]="3">
            <!-- Carte résumé -->
            <p-card styleClass="planning-summary-card">
              <div class="planning-metrics">
                <div class="planning-metric">
                  <span class="metric-label">NC planifiées</span>
                  <span class="metric-value">{{ ncWithAction() }} / {{ ncCount() }}</span>
                </div>
                <div class="planning-metric">
                  <span class="metric-label">Terminées</span>
                  <span class="metric-value" style="color: var(--p-green-600)">{{ ncDone() }}</span>
                </div>
                <div class="planning-metric">
                  <span class="metric-label">En cours</span>
                  <span class="metric-value" style="color: var(--p-blue-500)">{{ ncInProgress() }}</span>
                </div>
                <div class="planning-metric">
                  <span class="metric-label">À faire</span>
                  <span class="metric-value" style="color: var(--p-surface-500)">{{ ncTodo() }}</span>
                </div>
              </div>
              @if (ncCount() > 0) {
                <p-progressBar [value]="planningProgress()"
                  [style]="{height: '8px', marginTop: '1rem'}" [showValue]="false" />
                <div style="font-size: 0.75rem; color: var(--p-surface-500); margin-top: 0.375rem">
                  {{ planningProgress() }}% des NC planifiées
                </div>
              }
              <ng-template pTemplate="footer">
                <p-button label="Planifier toutes les NC" icon="pi pi-list-check"
                  severity="secondary" [outlined]="true"
                  [loading]="batchCreating()" (onClick)="batchPlanAll()"
                  [disabled]="ncWithoutAction() === 0" />
              </ng-template>
            </p-card>

            <!-- Tableau des actions planifiées -->
            @if (declarationActions().length > 0) {
              <p-table [value]="declarationActions()" styleClass="p-datatable-sm"
                style="margin-top: 1.5rem" [rowHover]="true">
                <ng-template pTemplate="header">
                  <tr>
                    <th style="width: 90px">Critère</th>
                    <th>Titre</th>
                    <th style="width: 100px">Priorité</th>
                    <th style="width: 120px">Statut</th>
                    <th style="width: 140px">Responsable</th>
                    <th style="width: 110px">Échéance</th>
                    <th style="width: 110px">Sprint</th>
                    <th style="width: 50px"></th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-action>
                  <tr>
                    <td><strong>{{ action.criterionResult?.criterionRef }}</strong></td>
                    <td>{{ action.title }}</td>
                    <td><p-tag [value]="getImpactLabel(action.priority)" [severity]="getImpactSeverity(action.priority)" /></td>
                    <td><p-tag [value]="getActionStatusLabel(action.status)" [severity]="getActionStatusSeverity(action.status)" /></td>
                    <td>
                      {{ action.assignedTo
                        ? (action.assignedTo.firstName + ' ' + action.assignedTo.lastName)
                        : '—' }}
                    </td>
                    <td>{{ action.dueDate ? (action.dueDate | date:'dd/MM/yyyy') : '—' }}</td>
                    <td>{{ action.sprint || '—' }}</td>
                    <td>
                      <p-button icon="pi pi-pencil" [text]="true" severity="secondary" size="small"
                        (onClick)="openActionPanel(action.criterionResult)" />
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            } @else {
              <div style="text-align: center; color: var(--p-surface-400); padding: 3rem; margin-top: 1rem;">
                <i class="pi pi-calendar" style="font-size: 2rem; display: block; margin-bottom: 0.75rem"></i>
                Aucune action planifiée. Cliquez sur "Planifier" sur une non-conformité, ou utilisez le bouton ci-dessus.
              </div>
            }
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
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
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
    .action-form { display: flex; flex-direction: column; gap: 1rem; padding: 0.5rem 0; }
    .criterion-info {
      background: var(--p-surface-100);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      color: var(--p-surface-700);
      line-height: 1.5;
    }
    .planning-metrics {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }
    .planning-metric {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .planning-metric .metric-label {
      font-size: 0.75rem;
      color: var(--p-surface-500);
      text-transform: uppercase;
    }
    .planning-metric .metric-value {
      font-size: 1.5rem;
      font-weight: 700;
    }
  `],
})
export class DeclarationDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private declarationsService = inject(DeclarationsService);
  private caService = inject(CorrectiveActionsService);
  private messageService = inject(MessageService);

  declaration = signal<any>(null);
  loading = signal(true);
  saving = signal(false);
  showEdit = signal(false);

  // Action panel
  showActionPanel = signal(false);
  selectedCriterion = signal<any>(null);
  teamUsers = signal<(TeamUser & { fullName: string })[]>([]);
  savingAction = signal(false);
  deletingAction = signal(false);
  batchCreating = signal(false);

  actionForm: {
    title: string;
    description: string;
    note: string;
    priority: string;
    status: string;
    assignedToId: string | null;
    dueDate: Date | null;
    sprint: string;
    wontFixReason: string;
  } = {
    title: '',
    description: '',
    note: '',
    priority: 'MEDIUM',
    status: 'TODO',
    assignedToId: null,
    dueDate: null,
    sprint: '',
    wontFixReason: '',
  };

  statuses = STATUSES;
  rgaaVersions = RGAA_VERSIONS;
  actionStatusOptions = ACTION_STATUS_OPTIONS;
  priorityOptions = PRIORITY_OPTIONS;

  editForm = {
    status: '',
    rgaaVersion: '',
    dateAudit: null as Date | null,
    auditCompany: '',
    tools: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
  };

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
  ncCount = computed(() =>
    this.declaration()?.criterionResults?.filter((c: any) => c.status === 'NON_CONFORME').length ?? 0
  );

  declarationActions = computed(() =>
    (this.declaration()?.criterionResults ?? [])
      .filter((cr: any) => cr.correctiveAction)
      .map((cr: any) => ({ ...cr.correctiveAction, criterionResult: cr }))
  );

  ncWithAction = computed(() => this.declarationActions().length);
  actionPanelHeader = computed(() =>
    this.selectedCriterion()?.correctiveAction
      ? "Modifier l'action corrective"
      : "Planifier l'action corrective"
  );
  ncWithoutAction = computed(() => this.ncCount() - this.ncWithAction());
  ncDone = computed(() => this.declarationActions().filter((a: any) => a.status === 'DONE').length);
  ncInProgress = computed(() => this.declarationActions().filter((a: any) => a.status === 'IN_PROGRESS').length);
  ncTodo = computed(() => this.declarationActions().filter((a: any) => a.status === 'TODO').length);
  planningProgress = computed(() =>
    this.ncCount() > 0 ? Math.round((this.ncWithAction() / this.ncCount()) * 100) : 0
  );

  pagesWithNc = computed(() => {
    const d = this.declaration();
    if (!d) return [];
    const results: any[] = d.criterionResults ?? [];
    return (d.auditedPages ?? []).map((page: any) => ({
      ...page,
      ncCount: results.filter(
        (cr: any) =>
          cr.status === 'NON_CONFORME' &&
          cr.affectedPages?.some((ap: any) => ap.id === page.id),
      ).length,
    }));
  });

  ngOnInit() {
    this.load();
    this.loadTeamUsers();
  }

  load() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.declarationsService.findOne(id).subscribe({
      next: (d) => {
        this.declaration.set(d);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadTeamUsers() {
    this.caService.getTeamUsers().subscribe({
      next: (users) => {
        this.teamUsers.set(
          users.map((u) => ({ ...u, fullName: `${u.firstName} ${u.lastName}` })),
        );
      },
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
    this.editForm = {
      status: '',
      rgaaVersion: '',
      dateAudit: null,
      auditCompany: '',
      tools: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
    };
  }

  saveEdit() {
    this.saving.set(true);
    const id = this.declaration()!.id;
    this.declarationsService
      .update(id, {
        status: this.editForm.status,
        rgaaVersion: this.editForm.rgaaVersion,
        dateAudit: this.editForm.dateAudit?.toISOString() ?? null,
        auditCompany: this.editForm.auditCompany,
        tools: this.editForm.tools,
        contactName: this.editForm.contactName,
        contactEmail: this.editForm.contactEmail,
        contactPhone: this.editForm.contactPhone,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.showEdit.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Déclaration mise à jour',
          });
          this.load();
        },
        error: () => {
          this.saving.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de mettre à jour',
          });
        },
      });
  }

  openActionPanel(cr: any) {
    this.selectedCriterion.set(cr);
    const existing = cr.correctiveAction;
    if (existing) {
      this.actionForm = {
        title: existing.title ?? '',
        description: existing.description ?? '',
        note: existing.note ?? '',
        priority: existing.priority ?? 'MEDIUM',
        status: existing.status ?? 'TODO',
        assignedToId: existing.assignedToId ?? null,
        dueDate: existing.dueDate ? new Date(existing.dueDate) : null,
        sprint: existing.sprint ?? '',
        wontFixReason: existing.wontFixReason ?? '',
      };
    } else {
      this.actionForm = {
        title: '',
        description: '',
        note: '',
        priority: cr.impact ?? 'MEDIUM',
        status: 'TODO',
        assignedToId: null,
        dueDate: null,
        sprint: '',
        wontFixReason: '',
      };
    }
    this.showActionPanel.set(true);
  }

  resetActionForm() {
    this.selectedCriterion.set(null);
    this.actionForm = {
      title: '',
      description: '',
      note: '',
      priority: 'MEDIUM',
      status: 'TODO',
      assignedToId: null,
      dueDate: null,
      sprint: '',
      wontFixReason: '',
    };
  }

  saveAction() {
    const cr = this.selectedCriterion();
    if (!cr) return;
    this.savingAction.set(true);

    const payload = {
      title: this.actionForm.title || undefined,
      description: this.actionForm.description || undefined,
      note: this.actionForm.note || undefined,
      priority: this.actionForm.priority as any,
      status: this.actionForm.status as any,
      assignedToId: this.actionForm.assignedToId,
      dueDate: this.actionForm.dueDate?.toISOString() ?? null,
      sprint: this.actionForm.sprint || undefined,
      wontFixReason: this.actionForm.wontFixReason || undefined,
    };

    const obs = cr.correctiveAction
      ? this.caService.update(cr.correctiveAction.id, payload)
      : this.caService.create({ criterionResultId: cr.id, ...payload });

    obs.subscribe({
      next: () => {
        this.savingAction.set(false);
        this.showActionPanel.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: cr.correctiveAction ? 'Action mise à jour' : 'Action planifiée',
        });
        this.load();
      },
      error: (err: any) => {
        this.savingAction.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: err?.error?.message ?? 'Impossible de sauvegarder',
        });
      },
    });
  }

  deleteAction() {
    const cr = this.selectedCriterion();
    if (!cr?.correctiveAction) return;
    this.deletingAction.set(true);
    this.caService.remove(cr.correctiveAction.id).subscribe({
      next: () => {
        this.deletingAction.set(false);
        this.showActionPanel.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Supprimé',
          detail: 'Action corrective supprimée',
        });
        this.load();
      },
      error: () => {
        this.deletingAction.set(false);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de supprimer' });
      },
    });
  }

  batchPlanAll() {
    const id = this.declaration()?.id;
    if (!id) return;
    this.batchCreating.set(true);
    this.caService.batchCreate(id).subscribe({
      next: (res) => {
        this.batchCreating.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Planification en lot',
          detail: res.created > 0
            ? `${res.created} action(s) créée(s)`
            : 'Toutes les NC ont déjà une action planifiée',
        });
        this.load();
      },
      error: () => {
        this.batchCreating.set(false);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Planification en lot échouée' });
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
    return ({ CONFORME: 'C', NON_CONFORME: 'NC', NON_APPLICABLE: 'NA', NON_AUDITE: 'NA' } as any)[status] ?? status;
  }

  getCriterionSeverity(status: string): 'success' | 'danger' | 'secondary' {
    return ({ CONFORME: 'success', NON_CONFORME: 'danger', NON_APPLICABLE: 'secondary', NON_AUDITE: 'secondary' } as any)[status] ?? 'secondary';
  }

  getImpactSeverity(impact: string): 'danger' | 'warn' | 'info' | 'secondary' {
    return ({ CRITICAL: 'danger', HIGH: 'warn', MEDIUM: 'info', LOW: 'secondary' } as any)[impact] ?? 'secondary';
  }

  getImpactLabel(priority: string): string {
    return ({ CRITICAL: 'Critique', HIGH: 'Élevé', MEDIUM: 'Moyen', LOW: 'Faible' } as any)[priority] ?? priority;
  }

  getActionStatusLabel(status: string): string {
    return ({
      TODO: 'À faire',
      IN_PROGRESS: 'En cours',
      DONE: 'Terminé',
      WONT_FIX: 'Exclu',
    } as any)[status] ?? status;
  }

  getActionStatusSeverity(status: string): 'secondary' | 'info' | 'success' | 'warn' {
    return ({
      TODO: 'secondary',
      IN_PROGRESS: 'info',
      DONE: 'success',
      WONT_FIX: 'warn',
    } as any)[status] ?? 'secondary';
  }
}
