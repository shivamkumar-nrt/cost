import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

export interface RawMaterialRowDto {
  id: number;
  year: string;
  location: string;
  sector: string;
  category: string;
  item: string;
  vendor: string;
  moc: string;
  uom: string;
  rate: number | null;
}

export interface RawMaterialResponse {
  status: string;
  message: string;
  payload: RawMaterialRowDto[];
  statusCode: number;
}

@Injectable({
  providedIn: 'root'
})
export class RawMaterialService {
  getRawMaterials(): Observable<RawMaterialResponse> {
    return of({
      status: 'SUCCESS',
      message: 'OK',
      payload: [
        {
          id: 1,
          year: '2024 - 2025',
          location: 'BLR',
          sector: 'Real Estate',
          category: 'test CATE',
          item: '3 core 300 sq. mm Al arm (E)',
          vendor: 'Blue Star Limited (R 3)',
          moc: 'HT cable',
          uom: 'RM',
          rate: 2892
        },
        {
          id: 2,
          year: '2024 - 2025',
          location: 'MUM',
          sector: 'Real Estate',
          category: 'test CATE',
          item: '2 core 2.5 sq.mm Cu cable',
          vendor: 'ABC Vendor Pvt Ltd',
          moc: 'Cu cable',
          uom: 'RM',
          rate: 167
        },
        {
          id: 3,
          year: '2025 - 2026',
          location: 'DEL',
          sector: 'Real Estate',
          category: 'test CATE',
          item: 'Cu conductor unarmored cable',
          vendor: 'Project Sunrise',
          moc: 'Cu cable',
          uom: 'RM',
          rate: 2628
        }
      ],
      statusCode: 200
    }).pipe(delay(200));
  }
}
