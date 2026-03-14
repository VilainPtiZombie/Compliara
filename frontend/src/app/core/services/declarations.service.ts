import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DeclarationsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/declarations`;

  stats() {
    return this.http.get<any>(`${this.base}/stats`);
  }

  findAll(serviceId?: string) {
    return serviceId
      ? this.http.get<any[]>(this.base, { params: { serviceId } })
      : this.http.get<any[]>(this.base);
  }

  findOne(id: string) {
    return this.http.get<any>(`${this.base}/${id}`);
  }

  update(id: string, data: {
    rgaaVersion?: string;
    dateAudit?: string | null;
    status?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
  }) {
    return this.http.put<any>(`${this.base}/${id}`, data);
  }

  create(data: {
    serviceId: string;
    rgaaVersion: string;
    dateAudit?: Date | null;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    pages?: { name: string; url: string; pageType: string }[];
  }) {
    return this.http.post<any>(this.base, data);
  }

  importExcel(file: File, serviceId: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('serviceId', serviceId);
    return this.http.post<any>(`${this.base}/import`, formData);
  }
}
