import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogService, HierarchyCategory } from '../../core/services/catalog.service';
import { AutocompleteComponent } from '../../shared/components/autocomplete/autocomplete.component';
import { Observable } from 'rxjs';

export interface TableRow {
  isCategory: boolean;
  categoryId?: number;
  subCategoryId?: number;
  typeId?: number;
  itemId?: number;
  categoryName?: string;
  isExpanded?: boolean;
  
  // Item details
  srNo?: string;
  subCategoryName?: string;
  typeName?: string;
  itemName?: string;
  moc?: string;
  uom?: string;
}

@Component({
  selector: 'app-master-sheet',
  standalone: true,
  imports: [CommonModule, FormsModule, AutocompleteComponent],
  templateUrl: './master-sheet.component.html',
  styleUrl: './master-sheet.component.css'
})
export class MasterSheetComponent implements OnInit {
  tableRows: TableRow[] = [];
  categories: HierarchyCategory[] = [];
  isLoading = false;
  
  selectedItem: TableRow | null = null;

  // New mapping states (sidebar mapping)
  categoryOptions: any[] = [];
  subCategoryOptions: any[] = [];
  typeOptions: any[] = [];
  itemOptions: any[] = [];

  newMapping = {
    categoryId: null as number | null,
    subCategoryId: null as number | null,
    typeId: null as number | null,
    itemId: null as number | null
  };

  // Creation Modal states
  showCreateModalType: 'category' | 'subcategory' | 'type' | 'item' | null = null;
  createPayload: any = {
    category: { name: '' },
    subcategory: { categoryId: null as number | null, name: '' },
    type: { subCategoryId: null as number | null, name: '' },
    item: { itemTypeId: null as number | null, name: '' }
  };

  constructor(private catalogService: CatalogService) {}

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    this.isLoading = true;
    this.catalogService.getHierarchy().subscribe({
      next: (response) => {
        this.categories = response.payload;
        this.flattenHierarchy();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching hierarchy', err);
        this.isLoading = false;
      }
    });
  }

  flattenHierarchy(): void {
    this.tableRows = [];

    this.categories.forEach((category, cIndex) => {
      // Add category row
      const categoryNameFormatted = `Category 0${cIndex + 1} : ${category.name}`;
      const categoryRow: TableRow = {
        isCategory: true,
        categoryId: category.id,
        categoryName: categoryNameFormatted,
        isExpanded: category.id !== 4 // default expanded except last one to match UI
      };
      this.tableRows.push(categoryRow);

      // Add item rows under this category
      let srNoCounter = 1;
      if (category.subCategories && category.subCategories.length > 0) {
        category.subCategories.forEach(sub => {
          if (sub.itemTypes && sub.itemTypes.length > 0) {
            sub.itemTypes.forEach(type => {
              if (type.items && type.items.length > 0) {
                type.items.forEach(item => {
                  this.tableRows.push({
                    isCategory: false,
                    categoryId: category.id,
                    subCategoryId: sub.id,
                    typeId: type.id,
                    itemId: item.id,
                    categoryName: category.name, // base name for mapping
                    srNo: String(srNoCounter++).padStart(2, '0'),
                    subCategoryName: sub.name,
                    typeName: type.name,
                    itemName: item.name,
                    moc: item.moc || '-',
                    uom: item.uom || '-'
                  });
                });
              } else {
                this.tableRows.push({
                  isCategory: false,
                  categoryId: category.id,
                  subCategoryId: sub.id,
                  typeId: type.id,
                  itemId: undefined,
                  categoryName: category.name,
                  srNo: String(srNoCounter++).padStart(2, '0'),
                  subCategoryName: sub.name,
                  typeName: type.name,
                  itemName: '-',
                  moc: '-',
                  uom: '-'
                });
              }
            });
          } else {
            this.tableRows.push({
              isCategory: false,
              categoryId: category.id,
              subCategoryId: sub.id,
              typeId: undefined,
              itemId: undefined,
              categoryName: category.name,
              srNo: String(srNoCounter++).padStart(2, '0'),
              subCategoryName: sub.name,
              typeName: '-',
              itemName: '-',
              moc: '-',
              uom: '-'
            });
          }
        });
      }
    });
  }

  toggleCategory(categoryId: number | undefined): void {
    if (categoryId === undefined) return;
    const catRow = this.tableRows.find(r => r.isCategory && r.categoryId === categoryId);
    if (catRow) {
      catRow.isExpanded = !catRow.isExpanded;
    }
  }

  get visibleRows(): TableRow[] {
    const visible: TableRow[] = [];
    let currentCategoryExpanded = true;

    for (const row of this.tableRows) {
      if (row.isCategory) {
        currentCategoryExpanded = !!row.isExpanded;
        visible.push(row);
      } else {
        if (currentCategoryExpanded) {
          visible.push(row);
        }
      }
    }
    return visible;
  }

  openSidebar(row: TableRow): void {
    if (!row.isCategory) {
      this.selectedItem = row;
      this.prepopulateMapping(row);
    }
  }

  closeSidebar(): void {
    this.selectedItem = null;
  }

  // --- Mapping Sidebar Cascade Logistics ---

  loadMappingCategories(): void {
    this.catalogService.getCategories().subscribe(res => {
      if (res && res.payload) {
        this.categoryOptions = res.payload;
      }
    });
  }

  prepopulateMapping(row: TableRow): void {
    this.newMapping = { categoryId: null, subCategoryId: null, typeId: null, itemId: null };
    this.subCategoryOptions = [];
    this.typeOptions = [];
    this.itemOptions = [];

    this.newMapping.categoryId = row.categoryId || null;
    if (this.categoryOptions.length === 0) {
      this.loadMappingCategories();
    }

    if (row.categoryId) {
      this.catalogService.getSubCategories(row.categoryId).subscribe(res => {
        if (res && res.payload) {
          this.subCategoryOptions = res.payload;
          this.newMapping.subCategoryId = row.subCategoryId || null;
          if (row.subCategoryId) {
            this.catalogService.getTypes(row.subCategoryId).subscribe(resType => {
              if (resType && resType.payload) {
                this.typeOptions = resType.payload;
                this.newMapping.typeId = row.typeId || null;
                if (row.typeId) {
                  this.catalogService.getItems(row.typeId).subscribe(resItem => {
                    if (resItem && resItem.payload) {
                      this.itemOptions = resItem.payload;
                      this.newMapping.itemId = row.itemId || null;
                    }
                  });
                }
              }
            });
          }
        }
      });
    }
  }

  resetMappingForm(): void {
    this.newMapping = { categoryId: null, subCategoryId: null, typeId: null, itemId: null };
    this.subCategoryOptions = [];
    this.typeOptions = [];
    this.itemOptions = [];
    if (this.categoryOptions.length === 0) {
      this.loadMappingCategories();
    }
  }

  onCategoryChange(val: any): void {
    this.subCategoryOptions = [];
    this.typeOptions = [];
    this.itemOptions = [];
    this.newMapping.subCategoryId = null;
    this.newMapping.typeId = null;
    this.newMapping.itemId = null;

    if (this.newMapping.categoryId) {
      this.catalogService.getSubCategories(this.newMapping.categoryId).subscribe(res => {
        if (res && res.payload) this.subCategoryOptions = res.payload;
      });
    }
  }

  onSubCategoryChange(val: any): void {
    this.typeOptions = [];
    this.itemOptions = [];
    this.newMapping.typeId = null;
    this.newMapping.itemId = null;

    if (this.newMapping.subCategoryId) {
      this.catalogService.getTypes(this.newMapping.subCategoryId).subscribe(res => {
        if (res && res.payload) this.typeOptions = res.payload;
      });
    }
  }

  onTypeChange(val: any): void {
    this.itemOptions = [];
    this.newMapping.itemId = null;

    if (this.newMapping.typeId) {
      this.catalogService.getItems(this.newMapping.typeId).subscribe(res => {
        if (res && res.payload) this.itemOptions = res.payload;
      });
    }
  }

  // --- Creation Modal Logistics ---

  openCreateModal(type: 'category' | 'subcategory' | 'type' | 'item'): void {
    this.showCreateModalType = type;
    if (this.categoryOptions.length === 0) {
      this.loadMappingCategories();
    }
    // Clear sub-options when starting a fresh creation modal that might need them
    this.subCategoryOptions = [];
    this.typeOptions = [];
  }

  closeCreateModal(): void {
    this.showCreateModalType = null;
    this.createPayload = {
      category: { name: '' },
      subcategory: { categoryId: null, name: '' },
      type: { subCategoryId: null, name: '' },
      item: { itemTypeId: null, name: '' }
    };
  }

  onCreateSubmit(): void {
    if (!this.showCreateModalType) return;
    const type = this.showCreateModalType;
    const payload = this.createPayload[type];

    let obs: Observable<any>;
    switch (type) {
      case 'category': obs = this.catalogService.createCategory(payload); break;
      case 'subcategory': obs = this.catalogService.createSubCategory(payload); break;
      case 'type': obs = this.catalogService.createType(payload); break;
      case 'item': obs = this.catalogService.createItem(payload); break;
      default: return;
    }

    obs.subscribe({
      next: (res) => {
        if (res.status === 'SUCCESS') {
          alert('Successfully created!');
          this.closeCreateModal();
          this.fetchData();
        } else {
          alert(res.responseMessage || 'Creation failed');
        }
      },
      error: (err) => {
        alert('An error occurred during creation.');
        console.error(err);
      }
    });
  }

  // Cascading for Modals
  onModalCategoryChange(): void {
    this.subCategoryOptions = [];
    this.typeOptions = [];
    this.createPayload.type.subCategoryId = null; // reset child if any
    
    const catId = this.showCreateModalType === 'subcategory' 
      ? this.createPayload.subcategory.categoryId 
      : (this.showCreateModalType === 'type' ? this.createPayload.subcategory.categoryId : null); // using subcategory.categoryId as a temp selected cat in Type modal too
    
    if (catId) {
      this.catalogService.getSubCategories(catId).subscribe(res => {
        if (res && res.payload) this.subCategoryOptions = res.payload;
      });
    }
  }

  onModalSubCategoryChange(): void {
    this.typeOptions = [];
    const subCatId = this.showCreateModalType === 'type' 
      ? this.createPayload.type.subCategoryId 
      : (this.showCreateModalType === 'item' ? this.createPayload.type.subCategoryId : null);

    if (subCatId) {
      this.catalogService.getTypes(subCatId).subscribe(res => {
        if (res && res.payload) this.typeOptions = res.payload;
      });
    }
  }
}
