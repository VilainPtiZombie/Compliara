import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ServicesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/services`;

  findAll() {
    return this.http.get<any[]>(this.base);
  }

  create(data: { name: string; url: string; description?: string }) {
    return this.http.post<any>(this.base, data);
  }

  update(id: string, data: { name?: string; url?: string; description?: string }) {
    return this.http.put<any>(`${this.base}/${id}`, data);
  }

  remove(id: string) {
    return this.http.delete<any>(`${this.base}/${id}`);
  }
}
