import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RawMaterialRowDto {
  id: number;
  year: string;
  sector: string;
  projectLocation: string;
  type: string;
  category: string;
  subCategory: string;
  moc: string;
  item: string;
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

export interface RawMaterialResponse {
  success: boolean;
  message: string;
  data: {
    content: RawMaterialRowDto[];
    pageable: {
      pageNumber: number;
      pageSize: number;
      offset: number;
      paged: boolean;
    };
    totalElements: number;
    totalPages: number;
    last: boolean;
    first: boolean;
    numberOfElements: number;
    empty: boolean;
  };
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
}
