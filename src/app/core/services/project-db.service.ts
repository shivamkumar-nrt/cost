import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';

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

export interface ProjectDbResponse<T> {
  status: string;
  message: string;
  payload: T[];
  statusCode: number;
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

const PROJECT_DEMO_RESPONSE: ProjectDbResponse<ProjectDbRecord> = {
  status: 'SUCCESS',
  message: 'OK',
  payload: [
    {
      id: 2,
      year: '2024-2025',
      sector: 'Real Estate',
      projectLocation: 'BLR',
      category: 'ELE',
      subCategory: 'Cable',
      moc: 'HT cable',
      itemDescription: '3 core 300 sq. mm Al arm (E)',
      unit: 'RM',
      blueStarInstallationRate: 814,
      blueStarTotalRate: 2892,
      micronTotalRate: 3938,
      rppTotalRate: 3005.48,
      listenlightsTotalRate: 4574,
      jbTotalRate: 2464,
      pmcTotalRate: 3500,
      gleedsTotalRate: 3227
    },
    {
      id: 8,
      year: '2024-2025',
      sector: 'Real Estate',
      projectLocation: 'BLR',
      category: 'ELE',
      subCategory: 'Cable',
      moc: 'Cu cable',
      itemDescription: '2 core 2.5 sq.mm Cu cable',
      unit: 'RM',
      blueStarInstallationRate: 61,
      blueStarTotalRate: 167,
      micronTotalRate: 189,
      rppTotalRate: 112.83,
      listenlightsTotalRate: 445,
      jbTotalRate: 132,
      pmcTotalRate: 375,
      gleedsTotalRate: 265
    }
  ],
  statusCode: 200
};

@Injectable({
  providedIn: 'root'
})
export class ProjectDbService {
  private readonly baseUrl = '/api/project-db';

  constructor(private http: HttpClient) {}

  getProjectRecordsPage(page: number, size: number): Observable<ProjectDbPageResponse> {
    return of({
      content: PROJECT_DEMO_RESPONSE.payload,
      totalElements: PROJECT_DEMO_RESPONSE.payload.length,
      totalPages: 1,
      number: page,
      size: size
    }).pipe(delay(500));
  }

  getProjectDemoResponse(): ProjectDbResponse<ProjectDbRecord> {
    return PROJECT_DEMO_RESPONSE;
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
}
