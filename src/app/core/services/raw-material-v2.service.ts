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
  blueStarInstallationRate: number;
  blueStarTotalRate: number;
  micronTotalRate: number;
  rppTotalRate: number;
  listenlightsTotalRate: number;
  jbTotalRate: number;
  pmcTotalRate: number;
  gleedsTotalRate: number;
}

export interface RawMaterialResponse {
  success: boolean;
  message: string;
  data: {
    content: RawMaterialRowDto[];
    pageable: any;
    totalElements: number;
    totalPages: number;
    last: boolean;
    first: boolean;
    numberOfElements: number;
    empty: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class RawMaterialService {
  private baseUrl = '/api/cost-items';

  constructor(private http: HttpClient) {}

  getRawMaterials(params: any): Observable<RawMaterialResponse> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        httpParams = httpParams.append(key, params[key]);
      }
    });

    return this.http.get<RawMaterialResponse>(`${this.baseUrl}/export`, { params: httpParams });
  }
}
