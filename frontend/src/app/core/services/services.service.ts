import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface ServicePayload {
  name?: string;
  url?: string;
  description?: string;
  technologies?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

@Injectable({ providedIn: 'root' })
export class ServicesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/services`;

  findAll() {
    return this.http.get<any[]>(this.base);
  }

  findOne(id: string) {
    return this.http.get<any>(`${this.base}/${id}`);
  }

  create(data: ServicePayload) {
    return this.http.post<any>(this.base, data);
  }

  update(id: string, data: ServicePayload) {
    return this.http.put<any>(`${this.base}/${id}`, data);
  }

  remove(id: string) {
    return this.http.delete<any>(`${this.base}/${id}`);
  }
}
