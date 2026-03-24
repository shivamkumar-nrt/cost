import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProjectDbPayload {
  slNo: number | null;
  category: string | null;
  subPackage: string | null;
  type: string | null;
  sector: string | null;
  project: string | null;
  year: string | null;
  moc: string | null;
  itemDescription: string | null;
  unit: string | null;
  rate: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectDbService {
  private readonly baseUrl = '/api/project-db';

  constructor(private http: HttpClient) {}

  createProjectRecord(payload: ProjectDbPayload): Observable<any> {
    return this.http.post<any>(this.baseUrl, payload);
  }

  updateProjectRecord(id: number, payload: ProjectDbPayload): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, payload);
  }

  deleteProjectRecord(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }
}
