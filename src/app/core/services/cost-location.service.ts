import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CostLocationRecord {
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

export interface CostLocationPageResponse {
  content: CostLocationRecord[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface CostDatabaseResponse<T> {
  status: string;
  message: string;
  payload: T[];
  statusCode: number;
}

export type CostLocationUpsertPayload = Omit<CostLocationRecord, 'id'>;

const LOCATION_DEMO_RESPONSE: CostDatabaseResponse<CostLocationRecord> = {
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
      id: 3,
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
export class CostLocationService {
  private readonly baseUrl = '/api/cost-location';

  constructor(private http: HttpClient) {}

  getLocations(): Observable<CostLocationPageResponse> {
    return this.http.get<CostLocationPageResponse>(this.baseUrl);
  }

  getLocationsPage(page: number, size: number): Observable<CostLocationPageResponse> {
    return this.http.get<CostLocationPageResponse>(`${this.baseUrl}?page=${page}&size=${size}`);
  }

  getLocationDemoResponse(): CostDatabaseResponse<CostLocationRecord> {
    return LOCATION_DEMO_RESPONSE;
  }

  createLocation(payload: CostLocationUpsertPayload): Observable<any> {
    return this.http.post<any>(this.baseUrl, payload);
  }

  updateLocation(id: number, payload: CostLocationUpsertPayload): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, payload);
  }

  deleteLocation(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }

  exportLocations(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export`, { responseType: 'blob' });
  }

  importLocations(file: File, insertType: 'append' | 'replace'): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('insertType', insertType);
    return this.http.post<any>(`${this.baseUrl}/import`, formData);
  }
}
