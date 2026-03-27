import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RawMaterialRowDto {
  id: number;
  moc: string;
  uom: string;
  vendorName: string | null;
  unitRate: number | null;
  quarterLabel: string | null;
  yearLabel: string | null;
  priceDate: [number, number, number] | null;
  project: string | null;
  categoryName: string;
  subCategoryName: string;
  itemTypeName: string;
  itemName: string;
}

export interface RawMaterialResponse {
  status: string;
  message: string;
  payload: RawMaterialRowDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface RawMaterialQueryParams {
  year?: string;
  projectLocation?: string;
  keyword?: string;
  vendorName?: string;
  project?: string;
  categoryName?: string;
  subCategoryName?: string;
  itemName?: string;
  type?: string;
  item?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}

export interface RawMaterialUpsertPayload {
  moc: string;
  uom: string;
  vendorName: string;
  monthLabel: string;
  quarterLabel: string;
  yearLabel: string;
  priceDate: string;
  project: string;
  categoryName: string;
  subCategoryName: string;
  itemTypeName: string;
  itemName: string;
}

@Injectable({
  providedIn: 'root'
})
export class RawMaterialService {
  private baseUrl = '/api/cost-items';
  private exportUrl = '/api/cost-items/export';
  private importUrl = '/api/cost-import/import';

  constructor(private http: HttpClient) {}

  getRawMaterials(params: RawMaterialQueryParams = {}): Observable<RawMaterialResponse> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.append(key, String(value));
      }
    });

    return this.http.get<RawMaterialResponse>(this.exportUrl, { params: httpParams });
  }

  createCostItem(payload: RawMaterialUpsertPayload): Observable<any> {
    return this.http.post(this.baseUrl, payload);
  }

  updateCostItem(id: number, payload: RawMaterialUpsertPayload): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, payload);
  }

  deleteCostItem(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  importRawMaterials(file: File, insertType: 'append' | 'replace'): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('insertType', insertType);
    return this.http.post<any>(this.importUrl, formData);
  }
}
