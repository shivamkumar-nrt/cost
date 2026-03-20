import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogService, HierarchyCategory } from '../../core/services/catalog.service';
import { AutocompleteComponent } from '../../shared/components/autocomplete/autocomplete.component';

export interface TableRow {
  isCategory: boolean;
  categoryId?: number;
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

  // New mapping states
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
      // Pre-select options with the active item if needed, but per request using custom autocomplete
      this.resetMappingForm();
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
}
