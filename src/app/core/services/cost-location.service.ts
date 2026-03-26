import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

export interface CostLocationQueryParams {
  year?: string;
  sector?: string;
  projectLocation?: string;
  category?: string;
  subCategory?: string;
  moc?: string;
  unit?: string;
  itemDescriptionLike?: string;
}

export type CostLocationUpsertPayload = Omit<CostLocationRecord, 'id'>;

@Injectable({
  providedIn: 'root'
})
export class CostLocationService {
  private readonly baseUrl = '/api/cost-location';

  constructor(private http: HttpClient) {}

  getLocations(): Observable<CostLocationPageResponse> {
    return this.getLocationsPage(0, 200);
  }

  getLocationsPage(
    page: number,
    size: number,
    filters: CostLocationQueryParams = {}
  ): Observable<CostLocationPageResponse> {
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.append(key, String(value));
      }
    });
    return this.http.get<CostLocationPageResponse>(this.baseUrl, { params });
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
