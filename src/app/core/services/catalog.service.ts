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

  constructor(private http: HttpClient) {}

  getHierarchy(): Observable<HierarchyResponse> {
    const mockResponse: HierarchyResponse = {
      status: 'SUCCESS',
      message: 'OK',
      payload: [
        {
          id: 1,
          name: 'Civil',
          subCategories: [
            {
              id: 11,
              name: 'Admixture',
              itemTypes: [
                {
                  id: 111,
                  name: 'Admixture',
                  items: [{ id: 1111, name: '-', moc: '-', uom: '-' }]
                },
                {
                  id: 112,
                  name: 'Admixture (Plasticizer)',
                  items: [{ id: 1112, name: 'Admixture (Plasticizer)', moc: 'Admixture', uom: 'Kg' }]
                }
              ]
            },
            {
              id: 12,
              name: 'Aggregrate Binding Wire',
              itemTypes: [
                {
                  id: 121,
                  name: 'Binding Wire',
                  items: [{ id: 1211, name: 'Binding Wire', moc: '-', uom: 'Kg' }]
                }
              ]
            },
            {
              id: 13,
              name: 'Bitumen',
              itemTypes: [
                {
                  id: 131,
                  name: 'Binder',
                  items: [{ id: 1311, name: 'VG-10', moc: '-', uom: 'MT' }]
                }
              ]
            }
          ]
        },
        {
          id: 2,
          name: 'Electrical',
          subCategories: [
            {
              id: 21,
              name: 'Battery',
              itemTypes: [
                {
                  id: 211,
                  name: 'Battery',
                  items: [{ id: 2111, name: '127V DC', moc: 'Ni Cd', uom: 'Nos' }]
                },
                {
                  id: 212,
                  name: 'Battery Charger',
                  items: [{ id: 2112, name: '127V DC', moc: '-', uom: 'Nos' }]
                }
              ]
            },
            {
              id: 22,
              name: 'Busduct',
              itemTypes: [
                {
                  id: 221,
                  name: 'HV Busduct',
                  items: [{ id: 2211, name: '6.6Kv Hv Busduct', moc: '-', uom: 'Set' }]
                },
                {
                  id: 222,
                  name: 'NSPBD Busduct',
                  items: [{ id: 2212, name: '415V Nspbd', moc: '-', uom: 'Set' }]
                }
              ]
            }
          ]
        },
        {
          id: 3,
          name: 'Instrumentation',
          subCategories: [
            {
              id: 31,
              name: 'Metering system',
              itemTypes: [
                {
                  id: 311,
                  name: 'Energy Meter',
                  items: [{ id: 3111, name: '33 Kv Metering', moc: '-', uom: 'Set' }]
                }
              ]
            }
          ]
        },
        {
          id: 4,
          name: 'Mechanical',
          subCategories: []
        }
      ],
      statusCode: 200
    };

    return of(mockResponse).pipe(delay(500));
  }

  getCategories(): Observable<any> {
    // return this.http.get<any>(`${this.baseUrl}/categories`);
    return of({
      status: "SUCCESS",
      message: "OK",
      payload: [
        { id: 2, name: "test 2 CATE" },
        { id: 1, name: "test CATE" }
      ],
      statusCode: 200
    }).pipe(delay(200));
  }

  getSubCategories(categoryId: number): Observable<any> {
    // return this.http.get<any>(`${this.baseUrl}/sub-categories?categoryId=${categoryId}`);
    return of({
      status: "SUCCESS",
      message: "OK",
      payload: [
        { id: 1, name: "test sub  CATE", categoryId: 2 }
      ],
      statusCode: 200
    }).pipe(delay(200));
  }

  getTypes(subCategoryId: number): Observable<any> {
    // return this.http.get<any>(`${this.baseUrl}/types?subCategoryId=${subCategoryId}`);
    return of({
      status: "SUCCESS",
      message: "OK",
      payload: [
        { id: 1, name: "new type", subCategoryId: 1 }
      ],
      statusCode: 200
    }).pipe(delay(200));
  }

  getItems(itemTypeId: number): Observable<any> {
    // return this.http.get<any>(`${this.baseUrl}/items?itemTypeId=${itemTypeId}`);
    return of({
      status: "SUCCESS",
      message: "OK",
      payload: [
        { id: 1, name: "new type", itemTypeId: 1 },
        { id: 2, name: "new type 2", itemTypeId: 1 }
      ],
      statusCode: 200
    }).pipe(delay(200));
  }
  createCategory(payload: any): Observable<any> {
    // return this.http.post<any>(`${this.baseUrl}/categories`, payload);
    return of({
      status: "SUCCESS",
      message: "Created",
      payload: { id: Date.now(), ...payload },
      statusCode: 200
    }).pipe(delay(500));
  }

  createSubCategory(payload: any): Observable<any> {
    // return this.http.post<any>(`${this.baseUrl}/sub-categories`, payload);
    return of({
      status: "SUCCESS",
      message: "Created",
      payload: { id: Date.now(), ...payload },
      statusCode: 200
    }).pipe(delay(500));
  }

  createType(payload: any): Observable<any> {
    // return this.http.post<any>(`${this.baseUrl}/types`, payload);
    return of({
      status: "SUCCESS",
      message: "Created",
      payload: { id: Date.now(), ...payload },
      statusCode: 200
    }).pipe(delay(500));
  }

  createItem(payload: any): Observable<any> {
    // return this.http.post<any>(`${this.baseUrl}/items`, payload);
    // Mocking the success since failure example was given for duplicate
    return of({
      status: "SUCCESS",
      message: "Created",
      payload: { id: Date.now(), ...payload },
      statusCode: 200
    }).pipe(delay(500));
  }

  updateSubCategory(id: number, payload: { categoryId: number; name: string }): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/sub-categories/${id}`, payload);
  }

  updateCategory(id: number, payload: { name: string }): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/categories/${id}`, payload);
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
