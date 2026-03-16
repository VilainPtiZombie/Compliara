import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { ProgressBarModule } from 'primeng/progressbar';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import {
  CorrectiveActionsService,
  CorrectiveAction,
  TeamUser,
  UpdateActionPayload,
} from '../../core/services/corrective-actions.service';
import { DeclarationsService } from '../../core/services/declarations.service';
import { ServicesService } from '../../core/services/services.service';

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

interface KanbanColumn {
  status: string;
  label: string;
  severity: 'secondary' | 'info' | 'success' | 'warn';
}

interface StatusButton {
  targetStatus: string;
  label: string;
  icon: string;
  severity: 'secondary' | 'info' | 'success' | 'warn' | 'danger';
}

@Component({
  selector: 'app-planning',
  standalone: true,
  providers: [MessageService],
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TagModule,
    BadgeModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    DatePickerModule,
    ProgressBarModule,
    DialogModule,
    ToastModule,
  ],
  template: `
    <p-toast />

    <div class="page-header">
      <h2>Planning des correctifs</h2>
      <p>Planifiez et suivez les actions correctives d'accessibilité</p>
    </div>

    <!-- Filtres -->
    <div class="filter-bar">
      <p-select [options]="declarationOptions()" optionLabel="label" optionValue="value"
        [ngModel]="filterDeclaration()" (ngModelChange)="filterDeclaration.set($event)"
        placeholder="Toutes les déclarations" [showClear]="true" styleClass="w-18rem" />
      <p-select [options]="serviceOptions()" optionLabel="label" optionValue="value"
        [ngModel]="filterService()" (ngModelChange)="filterService.set($event)"
        placeholder="Tous les services" [showClear]="true" styleClass="w-14rem" />
      <input pInputText
        [ngModel]="filterSprint()" (ngModelChange)="filterSprint.set($event)"
        placeholder="Sprint..." class="sprint-filter" />
      <p-button label="Réinitialiser" [text]="true" severity="secondary" (onClick)="resetFilters()" />
    </div>

    <!-- Barre de progression globale -->
    @if (totalCount() > 0) {
      <p-card styleClass="progress-card">
        <div class="global-progress-row">
          <span class="progress-label">
            <strong>{{ doneCount() }}</strong> / {{ totalCount() }} actions terminées
          </span>
          <span class="progress-counts">
            <p-tag value="À faire" severity="secondary" />
            <strong>{{ getColumnCount('TODO') }}</strong>
            <p-tag value="En cours" severity="info" />
            <strong>{{ getColumnCount('IN_PROGRESS') }}</strong>
            <p-tag value="Terminé" severity="success" />
            <strong>{{ getColumnCount('DONE') }}</strong>
            <p-tag value="Exclu" severity="warn" />
            <strong>{{ getColumnCount('WONT_FIX') }}</strong>
          </span>
        </div>
        <p-progressBar [value]="globalProgress()"
          [style]="{height: '8px', marginTop: '0.75rem'}" [showValue]="false" />
      </p-card>
    }

    @if (loading()) {
      <div style="text-align:center; padding: 4rem; color: var(--p-surface-400)">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
      </div>
    } @else if (totalCount() === 0) {
      <div style="margin-top: 1.5rem"><p-card>
        <div style="text-align:center; padding: 3rem; color: var(--p-surface-400)">
          <i class="pi pi-calendar" style="font-size: 2.5rem; display:block; margin-bottom: 1rem"></i>
          Aucune action corrective planifiée.<br>
          Ouvrez une déclaration et cliquez sur "Planifier" sur une non-conformité.
        </div>
      </p-card></div>
    } @else {
      <!-- Kanban -->
      <div class="kanban-board">
        @for (col of columns; track col.status) {
          <div class="kanban-column">
            <div class="column-header">
              <p-tag [value]="col.label" [severity]="col.severity" />
              <p-badge [value]="getColumnCount(col.status).toString()" severity="secondary" />
            </div>
            <div class="cards-list">
              @for (action of getColumnCards(col.status); track action.id) {
                <div class="action-card" (click)="openEdit(action)">
                <p-card>
                  <div class="card-ref">
                    <strong>{{ action.criterionResult.criterionRef }}</strong>
                    <p-tag [value]="getImpactLabel(action.priority)"
                      [severity]="getImpactSeverity(action.priority)" />
                  </div>
                  <p class="card-title">{{ action.title }}</p>
                  <div class="card-meta">
                    <span><i class="pi pi-globe"></i> {{ action.criterionResult.declaration.service.name }}</span>
                    @if (action.dueDate) {
                      <span [class.overdue]="isOverdue(action)">
                        <i class="pi pi-calendar"></i> {{ action.dueDate | date:'dd/MM/yy' }}
                        @if (isOverdue(action)) { <i class="pi pi-exclamation-triangle"></i> }
                      </span>
                    }
                    @if (action.sprint) {
                      <span><i class="pi pi-flag"></i> {{ action.sprint }}</span>
                    }
                    @if (action.assignedTo) {
                      <span>
                        <i class="pi pi-user"></i>
                        {{ action.assignedTo.firstName }} {{ action.assignedTo.lastName }}
                      </span>
                    }
                  </div>
                  <!-- Boutons transition rapide -->
                  <div class="card-actions" (click)="$event.stopPropagation()">
                    @for (btn of getStatusButtons(col.status); track btn.targetStatus) {
                      <p-button [label]="btn.label" [icon]="btn.icon" size="small"
                        [severity]="btn.severity" [outlined]="true"
                        (onClick)="quickMove(action, btn.targetStatus)" />
                    }
                  </div>
                </p-card>
                </div>
              }
              @if (getColumnCards(col.status).length === 0) {
                <div class="empty-col">Aucune action</div>
              }
            </div>
          </div>
        }
      </div>
    }

    <!-- Dialog édition -->
    <p-dialog header="Modifier l'action corrective" [(visible)]="showEdit"
      [modal]="true" [style]="{width: '580px'}" [draggable]="false" (onHide)="resetEdit()">
      @if (editingAction()) {
        <div class="edit-form">
          <div class="criterion-info">
            <strong>{{ editingAction()!.criterionResult.criterionRef }}</strong>
            — {{ editingAction()!.criterionResult.title }}
          </div>
          <div class="field">
            <label>Titre de l'action</label>
            <input pInputText [(ngModel)]="editForm.title" class="w-full" />
          </div>
          <div class="field">
            <label>Description</label>
            <textarea pTextarea [(ngModel)]="editForm.description" class="w-full" rows="3"></textarea>
          </div>
          <div class="field">
            <label>Note / Contexte</label>
            <textarea pTextarea [(ngModel)]="editForm.note" class="w-full" rows="2"></textarea>
          </div>
          <div class="field-row">
            <div class="field">
              <label>Priorité</label>
              <p-select [(ngModel)]="editForm.priority" [options]="priorityOptions"
                optionLabel="label" optionValue="value" styleClass="w-full" />
            </div>
            <div class="field">
              <label>Statut</label>
              <p-select [(ngModel)]="editForm.status" [options]="actionStatusOptions"
                optionLabel="label" optionValue="value" styleClass="w-full" />
            </div>
          </div>
          @if (editForm.status === 'WONT_FIX') {
            <div class="field">
              <label>Raison (obligatoire)</label>
              <input pInputText [(ngModel)]="editForm.wontFixReason" class="w-full"
                placeholder="Expliquez pourquoi cette NC ne sera pas corrigée" />
            </div>
          }
          <div class="field-row">
            <div class="field">
              <label>Responsable</label>
              <p-select [(ngModel)]="editForm.assignedToId" [options]="teamUsers()"
                optionLabel="fullName" optionValue="id" [showClear]="true"
                placeholder="Non assigné" styleClass="w-full" />
            </div>
            <div class="field">
              <label>Échéance</label>
              <p-datepicker [(ngModel)]="editForm.dueDate" dateFormat="dd/mm/yy"
                [showIcon]="true" styleClass="w-full" />
            </div>
          </div>
          <div class="field">
            <label>Sprint / Livraison</label>
            <input pInputText [(ngModel)]="editForm.sprint" class="w-full"
              placeholder="Sprint 12, Q2 2026, v1.3.0..." />
          </div>
        </div>
      }
      <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" [text]="true" (onClick)="showEdit.set(false)" />
        <p-button label="Enregistrer" icon="pi pi-check" [loading]="saving()" (onClick)="saveEdit()" />
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .page-header {
      margin-bottom: 1.5rem;
      h2 { font-size: 1.5rem; font-weight: 700; }
      p { color: var(--p-surface-500); margin-top: 0.25rem; }
    }
    .filter-bar {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: 1.5rem;
    }
    .sprint-filter { width: 10rem; }
    .progress-card { margin-bottom: 1.5rem; }
    .global-progress-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .progress-label { font-size: 0.9rem; }
    .progress-counts { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; }
    .kanban-board {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      align-items: start;
      margin-top: 1.5rem;
    }
    .kanban-column {
      background: var(--p-surface-100);
      border-radius: 12px;
      padding: 1rem;
      min-height: 200px;
    }
    .column-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .cards-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .action-card { cursor: pointer; transition: box-shadow 0.15s; }
    .action-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
    .card-ref {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.375rem;
    }
    .card-title {
      font-size: 0.8rem;
      color: var(--p-surface-600);
      margin-bottom: 0.5rem;
      margin-top: 0;
      line-height: 1.4;
    }
    .card-meta {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      font-size: 0.75rem;
      color: var(--p-surface-500);
    }
    .card-meta span { display: flex; align-items: center; gap: 0.3rem; }
    .card-actions {
      display: flex;
      gap: 0.375rem;
      flex-wrap: wrap;
      margin-top: 0.75rem;
      padding-top: 0.625rem;
      border-top: 1px solid var(--p-surface-200);
    }
    .overdue { color: var(--p-red-500) !important; }
    .empty-col {
      text-align: center;
      color: var(--p-surface-300);
      padding: 2rem 0;
      font-size: 0.875rem;
    }
    .edit-form { display: flex; flex-direction: column; gap: 1rem; padding: 0.5rem 0; }
    .field { display: flex; flex-direction: column; gap: 0.375rem; label { font-weight: 500; font-size: 0.875rem; } }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .criterion-info {
      background: var(--p-surface-100);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      color: var(--p-surface-700);
      line-height: 1.5;
    }
  `],
})
export class PlanningComponent implements OnInit {
  private caService = inject(CorrectiveActionsService);
  private declarationsService = inject(DeclarationsService);
  private servicesService = inject(ServicesService);
  private messageService = inject(MessageService);

  allActions = signal<CorrectiveAction[]>([]);
  loading = signal(true);

  filterDeclaration = signal<string | null>(null);
  filterService = signal<string | null>(null);
  filterSprint = signal('');

  declarationOptions = signal<{ label: string; value: string }[]>([]);
  serviceOptions = signal<{ label: string; value: string }[]>([]);
  teamUsers = signal<(TeamUser & { fullName: string })[]>([]);

  showEdit = signal(false);
  editingAction = signal<CorrectiveAction | null>(null);
  saving = signal(false);
  editForm: {
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

  actionStatusOptions = ACTION_STATUS_OPTIONS;
  priorityOptions = PRIORITY_OPTIONS;

  columns: KanbanColumn[] = [
    { status: 'TODO',        label: 'À faire',   severity: 'secondary' },
    { status: 'IN_PROGRESS', label: 'En cours',  severity: 'info' },
    { status: 'DONE',        label: 'Terminé',   severity: 'success' },
    { status: 'WONT_FIX',   label: 'Exclu',     severity: 'warn' },
  ];

  filteredActions = computed(() => {
    let actions = this.allActions();
    const decl = this.filterDeclaration();
    const svc = this.filterService();
    const sprint = this.filterSprint().toLowerCase();
    if (decl) actions = actions.filter((a) => a.criterionResult.declarationId === decl);
    if (svc) actions = actions.filter((a) => a.criterionResult.declaration.service.id === svc);
    if (sprint) actions = actions.filter((a) => a.sprint?.toLowerCase().includes(sprint));
    return actions;
  });

  totalCount = computed(() => this.filteredActions().length);
  doneCount = computed(() => this.filteredActions().filter((a) => a.status === 'DONE').length);
  globalProgress = computed(() =>
    this.totalCount() > 0 ? Math.round((this.doneCount() / this.totalCount()) * 100) : 0
  );

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.loading.set(true);
    forkJoin({
      actions: this.caService.findAll(),
      declarations: this.declarationsService.findAll(),
      services: this.servicesService.findAll(),
      users: this.caService.getTeamUsers(),
    }).subscribe({
      next: ({ actions, declarations, services, users }) => {
        this.allActions.set(actions);
        this.declarationOptions.set(
          declarations.map((d: any) => ({
            label: `${d.service?.name ?? '?'} — ${d.rgaaVersion}`,
            value: d.id,
          })),
        );
        this.serviceOptions.set(services.map((s: any) => ({ label: s.name, value: s.id })));
        this.teamUsers.set(users.map((u) => ({ ...u, fullName: `${u.firstName} ${u.lastName}` })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getColumnCards(status: string): CorrectiveAction[] {
    return this.filteredActions().filter((a) => a.status === status);
  }

  getColumnCount(status: string): number {
    return this.filteredActions().filter((a) => a.status === status).length;
  }

  getStatusButtons(fromStatus: string): StatusButton[] {
    const map: Record<string, StatusButton[]> = {
      TODO: [
        { targetStatus: 'IN_PROGRESS', label: 'Démarrer', icon: 'pi pi-play', severity: 'info' },
      ],
      IN_PROGRESS: [
        { targetStatus: 'TODO',        label: 'Remettre', icon: 'pi pi-undo',  severity: 'secondary' },
        { targetStatus: 'DONE',        label: 'Terminer', icon: 'pi pi-check', severity: 'success' },
        { targetStatus: 'WONT_FIX',   label: 'Exclure',  icon: 'pi pi-times', severity: 'warn' },
      ],
      DONE: [
        { targetStatus: 'TODO', label: 'Rouvrir', icon: 'pi pi-replay', severity: 'secondary' },
      ],
      WONT_FIX: [
        { targetStatus: 'TODO', label: 'Rouvrir', icon: 'pi pi-replay', severity: 'secondary' },
      ],
    };
    return map[fromStatus] ?? [];
  }

  quickMove(action: CorrectiveAction, targetStatus: string) {
    if (targetStatus === 'WONT_FIX') {
      // Doit ouvrir le dialog pour saisir le motif
      this.openEdit(action);
      return;
    }
    this.caService.update(action.id, { status: targetStatus as UpdateActionPayload['status'] }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Statut mis à jour' });
        this.loadAll();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Mise à jour impossible' });
      },
    });
  }

  openEdit(action: CorrectiveAction) {
    this.editingAction.set(action);
    this.editForm = {
      title: action.title ?? '',
      description: action.description ?? '',
      note: action.note ?? '',
      priority: action.priority ?? 'MEDIUM',
      status: action.status ?? 'TODO',
      assignedToId: action.assignedToId ?? null,
      dueDate: action.dueDate ? new Date(action.dueDate) : null,
      sprint: action.sprint ?? '',
      wontFixReason: action.wontFixReason ?? '',
    };
    this.showEdit.set(true);
  }

  resetEdit() {
    this.editingAction.set(null);
  }

  saveEdit() {
    const action = this.editingAction();
    if (!action) return;
    this.saving.set(true);
    const payload: UpdateActionPayload = {
      title: this.editForm.title || undefined,
      description: this.editForm.description || undefined,
      note: this.editForm.note || undefined,
      priority: this.editForm.priority as UpdateActionPayload['priority'],
      status: this.editForm.status as UpdateActionPayload['status'],
      assignedToId: this.editForm.assignedToId,
      dueDate: this.editForm.dueDate?.toISOString() ?? null,
      sprint: this.editForm.sprint || undefined,
      wontFixReason: this.editForm.wontFixReason || undefined,
    };
    this.caService.update(action.id, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.showEdit.set(false);
        this.messageService.add({ severity: 'success', summary: 'Action mise à jour' });
        this.loadAll();
      },
      error: (err: any) => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: err?.error?.message ?? 'Mise à jour impossible',
        });
      },
    });
  }

  resetFilters() {
    this.filterDeclaration.set(null);
    this.filterService.set(null);
    this.filterSprint.set('');
  }

  isOverdue(action: CorrectiveAction): boolean {
    if (!action.dueDate || action.status === 'DONE') return false;
    return new Date(action.dueDate) < new Date();
  }

  getImpactSeverity(priority: string): 'danger' | 'warn' | 'info' | 'secondary' {
    return ({ CRITICAL: 'danger', HIGH: 'warn', MEDIUM: 'info', LOW: 'secondary' } as any)[priority] ?? 'secondary';
  }

  getImpactLabel(priority: string): string {
    return ({ CRITICAL: 'Critique', HIGH: 'Élevé', MEDIUM: 'Moyen', LOW: 'Faible' } as any)[priority] ?? priority;
  }
}
