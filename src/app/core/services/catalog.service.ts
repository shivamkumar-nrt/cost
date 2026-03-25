import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';

export interface HierarchyItem {
  id: number;
  name: string;
  moc?: string;
  uom?: string;
}

export interface HierarchyType {
  id: number;
  name: string;
  items?: HierarchyItem[];
}

export interface HierarchySubCategory {
  id: number;
  name: string;
  itemTypes?: HierarchyType[];
}

export interface HierarchyCategory {
  id: number;
  name: string;
  subCategories?: HierarchySubCategory[];
}

export interface HierarchyResponse {
  status: string;
  message: string;
  payload: HierarchyCategory[];
  statusCode: number;
}

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private baseUrl = '/api/catalog';

  private mockHierarchy: HierarchyResponse = {
    status: 'success',
    message: 'Data fetched successfully',
    statusCode: 200,
    payload: [
      {
        id: 1,
        name: 'Civil',
        subCategories: [
          {
            id: 11,
            name: 'Steel Work',
            itemTypes: [
              {
                id: 111,
                name: 'TMT Bar',
                items: [
                  { id: 1111, name: 'TMT Bar 10mm', moc: 'Steel', uom: 'KG' },
                  { id: 1112, name: 'TMT Bar 12mm', moc: 'Steel', uom: 'KG' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 2,
        name: 'ELE',
        subCategories: [
          {
            id: 21,
            name: 'Cable',
            itemTypes: [
              {
                id: 211,
                name: 'HT cable',
                items: [
                  { id: 2111, name: '3-core Al arm (E)', moc: 'HT cable', uom: 'RM' },
                  { id: 2112, name: '2-core Cu cable', moc: 'Cu cable', uom: 'RM' }
                ]
              }
            ]
          }
        ]
      }
    ]
  };

  constructor(private http: HttpClient) {}

  getHierarchy(): Observable<HierarchyResponse> {
    return of(this.mockHierarchy).pipe(delay(500));
  }

  getCategories(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/categories`);
  }

  getSubCategories(categoryId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/sub-categories?categoryId=${categoryId}`);
  }

  getTypes(subCategoryId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/types?subCategoryId=${subCategoryId}`);
  }

  getItems(itemTypeId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/items?itemTypeId=${itemTypeId}`);
  }

  createCategory(payload: any): Observable<any> {
    console.log('CatalogService: createCategory called with:', payload);
    return this.http.post<any>(`${this.baseUrl}/categories`, payload);
  }

  createSubCategory(payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/sub-categories`, payload);
  }

  createType(payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/types`, payload);
  }

  createItem(payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/items`, payload);
  }

  updateCategory(id: number, payload: { name: string }): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/categories/${id}`, payload);
  }

  updateSubCategory(id: number, payload: { categoryId: number; name: string }): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/sub-categories/${id}`, payload);
  }

  updateType(id: number, payload: { subCategoryId: number; name: string }): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/types/${id}`, payload);
  }

  updateItem(id: number, payload: { itemTypeId: number; name: string }): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/items/${id}`, payload);
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/categories/${id}`);
  }

  deleteSubCategory(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/sub-categories/${id}`);
  }

  deleteType(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/types/${id}`);
  }

  deleteItem(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/items/${id}`);
  }
}
