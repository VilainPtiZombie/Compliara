import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface CorrectiveAction {
  id: string;
  criterionResultId: string;
  tenantId: string;
  title: string;
  description?: string;
  note?: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'WONT_FIX';
  assignedToId?: string | null;
  assignedTo?: TeamUser | null;
  dueDate?: string | null;
  sprint?: string | null;
  wontFixReason?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  criterionResult: {
    id: string;
    criterionRef: string;
    thematic: string;
    title: string;
    impact?: string | null;
    declarationId: string;
    declaration: {
      id: string;
      service: { id: string; name: string };
    };
  };
}

export interface TeamUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ActionStats {
  total: number;
  planned: number;
  todo: number;
  inProgress: number;
  done: number;
  wontFix: number;
}

export interface CreateActionPayload {
  criterionResultId: string;
  title?: string;
  description?: string;
  note?: string;
  priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'WONT_FIX';
  assignedToId?: string | null;
  dueDate?: string | null;
  sprint?: string;
}

export interface UpdateActionPayload {
  title?: string;
  description?: string;
  note?: string;
  priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'WONT_FIX';
  assignedToId?: string | null;
  dueDate?: string | null;
  sprint?: string;
  wontFixReason?: string;
}

@Injectable({ providedIn: 'root' })
export class CorrectiveActionsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/corrective-actions`;

  findAll(filters?: {
    declarationId?: string;
    status?: string;
    sprint?: string;
    serviceId?: string;
  }) {
    let params = new HttpParams();
    if (filters?.declarationId) params = params.set('declarationId', filters.declarationId);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.sprint) params = params.set('sprint', filters.sprint);
    if (filters?.serviceId) params = params.set('serviceId', filters.serviceId);
    return this.http.get<CorrectiveAction[]>(this.base, { params });
  }

  findOne(id: string) {
    return this.http.get<CorrectiveAction>(`${this.base}/${id}`);
  }

  getStats(declarationId: string) {
    return this.http.get<ActionStats>(`${this.base}/stats/${declarationId}`);
  }

  getTeamUsers() {
    return this.http.get<TeamUser[]>(`${this.base}/team-users`);
  }

  create(data: CreateActionPayload) {
    return this.http.post<CorrectiveAction>(this.base, data);
  }

  update(id: string, data: UpdateActionPayload) {
    return this.http.patch<CorrectiveAction>(`${this.base}/${id}`, data);
  }

  remove(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  batchCreate(declarationId: string) {
    return this.http.post<{ created: number; message?: string }>(
      `${this.base}/batch`,
      { declarationId },
    );
  }
}
