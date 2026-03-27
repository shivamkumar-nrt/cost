import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProjectDbRecord {
  id: number;
  year: string;
  sector: string;
  projectLocation: string;
  category: string;
  subCategory: string;
  moc: string;
  itemDescription: string;
  unit: string;
  blueStarInstallationRate: number | null;
  blueStarTotalRate: number | null;
  micronTotalRate: number | null;
  rppTotalRate: number | null;
  listenlightsTotalRate: number | null;
  jbTotalRate: number | null;
  pmcTotalRate: number | null;
  gleedsTotalRate: number | null;
}

export interface ProjectDbPageResponse {
  content: ProjectDbRecord[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ProjectDbQueryParams {
  year?: string;
  sector?: string;
  project?: string;
  projectLocation?: string;
  category?: string;
  moc?: string;
  unit?: string;
  itemDescriptionLike?: string;
}

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

  getProjectRecordsPage(
    page: number,
    size: number,
    filters: ProjectDbQueryParams = {}
  ): Observable<ProjectDbPageResponse> {
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.append(key, String(value));
      }
    });
    return this.http.get<ProjectDbPageResponse>(this.baseUrl, { params });
  }

  createProjectRecord(payload: ProjectDbPayload): Observable<any> {
    return this.http.post<any>(this.baseUrl, payload);
  }

  updateProjectRecord(id: number, payload: ProjectDbPayload): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, payload);
  }

  deleteProjectRecord(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }

  exportProjectRecords(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export`, { responseType: 'blob' });
  }

  importProjectRecords(file: File, insertType: 'append' | 'replace'): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('insertType', insertType);
    return this.http.post<any>(`${this.baseUrl}/import`, formData);
  }
}
