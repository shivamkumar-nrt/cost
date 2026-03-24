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

type EditMode = 'category' | 'subcategory' | 'type' | 'item' | null;

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
  editMode: EditMode = null;
  showDeleteConfirm = false;

  // Shared options
  categoryOptions: any[] = [];
  editSubCategoryOptions: any[] = [];
  editTypeOptions: any[] = [];

  editPayload = {
    name: '',
    categoryId: null as number | null,
    subCategoryId: null as number | null,
    itemTypeId: null as number | null
  };

  subCategoryOptions: any[] = [];
  typeOptions: any[] = [];

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

  // --- Row Edit Sidebar ---
  loadMappingCategories(): void {
    this.catalogService.getCategories().subscribe(res => {
      if (res && res.payload) {
        this.categoryOptions = res.payload;
      }
    });
  }

  openEditSidebar(mode: Exclude<EditMode, null>, row: TableRow, event?: MouseEvent): void {
    event?.stopPropagation();

    this.selectedItem = row;
    this.editMode = mode;
    this.showDeleteConfirm = false;
    const selectedCategoryName = this.categories.find(c => c.id === row.categoryId)?.name || '';
    this.editPayload = {
      name:
        mode === 'category'
          ? selectedCategoryName
          : mode === 'subcategory'
          ? (row.subCategoryName || '')
          : mode === 'type'
          ? (row.typeName || '')
          : (row.itemName || ''),
      categoryId: row.categoryId || null,
      subCategoryId: row.subCategoryId || null,
      itemTypeId: row.typeId || null
    };

    this.editSubCategoryOptions = [];
    this.editTypeOptions = [];
    if (this.categoryOptions.length === 0) {
      this.loadMappingCategories();
    }

    if (this.editPayload.categoryId && (mode === 'type' || mode === 'item')) {
      this.catalogService.getSubCategories(this.editPayload.categoryId).subscribe(res => {
        if (res?.payload) {
          this.editSubCategoryOptions = res.payload;
        }
      });
    }
    if (this.editPayload.subCategoryId && mode === 'item') {
      this.catalogService.getTypes(this.editPayload.subCategoryId).subscribe(res => {
        if (res?.payload) {
          this.editTypeOptions = res.payload;
        }
      });
    }
  }

  closeSidebar(): void {
    this.showDeleteConfirm = false;
    this.selectedItem = null;
    this.editMode = null;
    this.editPayload = { name: '', categoryId: null, subCategoryId: null, itemTypeId: null };
    this.editSubCategoryOptions = [];
    this.editTypeOptions = [];
  }

  onEditCategoryChange(): void {
    this.editSubCategoryOptions = [];
    this.editTypeOptions = [];
    this.editPayload.subCategoryId = null;
    this.editPayload.itemTypeId = null;

    if (!this.editPayload.categoryId) {
      return;
    }
    this.catalogService.getSubCategories(this.editPayload.categoryId).subscribe(res => {
      if (res?.payload) {
        this.editSubCategoryOptions = res.payload;
      }
    });
  }

  onEditSubCategoryChange(): void {
    this.editTypeOptions = [];
    this.editPayload.itemTypeId = null;

    if (!this.editPayload.subCategoryId) {
      return;
    }
    this.catalogService.getTypes(this.editPayload.subCategoryId).subscribe(res => {
      if (res?.payload) {
        this.editTypeOptions = res.payload;
      }
    });
  }

  saveEdit(): void {
    if (!this.selectedItem || !this.editMode) {
      return;
    }

    const name = (this.editPayload.name || '').trim();
    if (!name) {
      alert('Name is required.');
      return;
    }

    let obs: Observable<any> | null = null;

    if (this.editMode === 'category') {
      if (!this.selectedItem.categoryId) {
        alert('Category information is incomplete.');
        return;
      }
      obs = this.catalogService.updateCategory(this.selectedItem.categoryId, { name });
    } else if (this.editMode === 'subcategory') {
      if (!this.selectedItem.subCategoryId || !this.editPayload.categoryId) {
        alert('Subcategory information is incomplete.');
        return;
      }
      obs = this.catalogService.updateSubCategory(this.selectedItem.subCategoryId, {
        categoryId: this.editPayload.categoryId,
        name
      });
    } else if (this.editMode === 'type') {
      if (!this.selectedItem.typeId || !this.editPayload.subCategoryId) {
        alert('Type information is incomplete.');
        return;
      }
      obs = this.catalogService.updateType(this.selectedItem.typeId, {
        subCategoryId: this.editPayload.subCategoryId,
        name
      });
    } else if (this.editMode === 'item') {
      if (!this.selectedItem.itemId || !this.editPayload.itemTypeId) {
        alert('Item information is incomplete.');
        return;
      }
      obs = this.catalogService.updateItem(this.selectedItem.itemId, {
        itemTypeId: this.editPayload.itemTypeId,
        name
      });
    }

    if (!obs) {
      return;
    }

    obs.subscribe({
      next: (res) => {
        if (res?.status === 'SUCCESS') {
          alert(res.message || 'Updated');
          this.closeSidebar();
          this.fetchData();
        } else {
          alert(res?.message || 'Update failed');
        }
      },
      error: (err) => {
        console.error(err);
        alert('An error occurred while updating.');
      }
    });
  }

  openDeleteConfirm(event?: MouseEvent): void {
    event?.stopPropagation();
    if (!this.selectedItem || !this.editMode) {
      return;
    }
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm = false;
  }

  confirmDelete(): void {
    if (!this.selectedItem || !this.editMode) {
      return;
    }

    let obs: Observable<any> | null = null;

    if (this.editMode === 'category') {
      if (!this.selectedItem.categoryId) {
        alert('Category information is incomplete.');
        return;
      }
      obs = this.catalogService.deleteCategory(this.selectedItem.categoryId);
    } else if (this.editMode === 'subcategory') {
      if (!this.selectedItem.subCategoryId) {
        alert('Subcategory information is incomplete.');
        return;
      }
      obs = this.catalogService.deleteSubCategory(this.selectedItem.subCategoryId);
    } else if (this.editMode === 'type') {
      if (!this.selectedItem.typeId) {
        alert('Type information is incomplete.');
        return;
      }
      obs = this.catalogService.deleteType(this.selectedItem.typeId);
    } else if (this.editMode === 'item') {
      if (!this.selectedItem.itemId) {
        alert('Item information is incomplete.');
        return;
      }
      obs = this.catalogService.deleteItem(this.selectedItem.itemId);
    }

    if (!obs) {
      return;
    }

    obs.subscribe({
      next: (res) => {
        if (res?.status === 'SUCCESS') {
          alert(res?.message || 'Deleted');
          this.closeDeleteConfirm();
          this.closeSidebar();
          this.fetchData();
        } else {
          alert(res?.message || 'Delete failed');
        }
      },
      error: (err) => {
        console.error(err);
        const backendMessage =
          err?.error?.message ||
          err?.error?.responseMessage ||
          err?.message ||
          'An error occurred while deleting.';
        alert(backendMessage);
      }
    });
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
