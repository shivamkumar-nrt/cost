import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AutocompleteComponent } from '../../shared/components/autocomplete/autocomplete.component';
import { MultiYearSelectorComponent } from '../../shared/components/multi-year-selector/multi-year-selector.component';
import {
  RawMaterialQueryParams,
  RawMaterialRowDto,
  RawMaterialService,
  RawMaterialUpsertPayload
} from '../../core/services/raw-material.service';
import {
  CatalogService,
  HierarchyCategory
} from '../../core/services/catalog.service';

type SortDirection = 'asc' | 'desc';

interface RawMaterialRow {
  id: number;
  selected: boolean;
  year: string;
  sector: string;
  projectLocation: string;
  type: string;
  category: string;
  subCategory: string;
  item: string;
  itemDescription: string;
  moc: string;
  unit: string;
  blueStarInstallationRate: number | null;
  blueStarTotalRate: number | null;
  micronTotalRate: number | null;
  rppTotalRate: number | null;
  listenlightsTotalRate: number | null;
  jbTotalRate: number | null;
  pmcTotalRate: number | null;
  gleedsTotalRate: number | null;
  isEditing: boolean;
}

@Component({
  selector: 'app-raw-material-database',
  standalone: true,
  imports: [CommonModule, FormsModule, AutocompleteComponent, MultiYearSelectorComponent],
  templateUrl: './raw-material-database.component.html',
  styleUrl: './raw-material-database.component.css'
})
export class RawMaterialDatabaseComponent implements OnInit, OnChanges {
  @Input() filterYear = '';
  @Input() filterLocation = '';
  @Input() filterVendor = '';
  @Input() filterCategory = '';
  @Input() filterKeyword = '';
  @Input() filterProject = '';
  @Input() filterSubCategory = '';
  @Input() filterItemName = '';
  @Input() filterType = '';
  @Input() filterItem = '';
  @Input() filterFromDate = '';
  @Input() filterToDate = '';
  @Input() filterToken = 0;
  @Input() sortDirection: SortDirection = 'asc';
  @Input() sortToken = 0;
  @Input() categories: string[] = [];
  sortKey = 'blueStarTotalRate';
  showInputRow = false;

  inputRow: RawMaterialRow = this.createEmptyInputRow();
  private originalsById = new Map<number, RawMaterialRow>();
  rows: RawMaterialRow[] = [];
  readonly pageSize = 10;
  currentPage = 1;
  totalItems = 0;
  totalPages = 1;
  hierarchy: HierarchyCategory[] = [];
  isCatalogReady = false;

  constructor(
    private rawMaterialService: RawMaterialService,
    private catalogService: CatalogService
  ) {}

  ngOnInit(): void {
    this.loadCatalog();
    this.loadRawMaterials(1);
  }

  get pagedRows(): RawMaterialRow[] {
    return this.rows;
  }

  get startItem(): number {
    if (!this.totalItems) {
      return 0;
    }
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  get allSelected(): boolean {
    return this.pagedRows.length > 0 && this.pagedRows.every(r => r.selected);
  }

  get someSelected(): boolean {
    return this.pagedRows.some(r => r.selected) && !this.allSelected;
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (!checked) {
      this.pagedRows.forEach(r => (r.selected = false));
      return;
    }
    let first = true;
    this.pagedRows.forEach(r => {
      r.selected = first;
      first = false;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filterToken']) {
      this.loadRawMaterials(1);
      return;
    }
    if (changes['sortToken']) {
      this.sortRows();
    }
  }

  addFromInput(): void {
    if (!this.inputRow.item.trim()) {
      return;
    }

    this.rawMaterialService.createCostItem(this.toPayload(this.inputRow)).subscribe({
      next: () => {
        this.inputRow = this.createEmptyInputRow();
        this.showInputRow = false;
        this.loadRawMaterials(1);
      },
      error: (err) => {
        console.error(err);
        alert(err?.error?.message || 'Failed to create record.');
      }
    });
  }

  toggleAddRow(): void {
    this.showInputRow = !this.showInputRow;
    if (!this.showInputRow) {
      this.inputRow = this.createEmptyInputRow();
    }
  }

  cancelAdd(): void {
    this.showInputRow = false;
    this.inputRow = this.createEmptyInputRow();
  }

  applyFilterSort(): void {
    this.loadRawMaterials(1);
  }

  toggleEdit(row: RawMaterialRow): void {
    row.selected = !row.selected;
  }

  onRowSelect(row: RawMaterialRow): void {
    if (row.selected) {
      this.rows.forEach(r => {
        if (r !== row) r.selected = false;
      });
    }
  }

  onSort(key: string): void {
    if (this.sortKey === key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDirection = 'asc';
    }
    this.sortRows();
  }

  deleteSelectedRows(): void {
    const selectedIds = this.rows.filter(row => row.selected).map(row => row.id);
    if (!selectedIds.length) {
      return;
    }

    const deletes = selectedIds.map(id => this.rawMaterialService.deleteCostItem(id));
    forkJoin(deletes).subscribe({
      next: () => {
        alert('Deleted successfully.');
        this.loadRawMaterials(this.currentPage);
      },
      error: (err) => {
        console.error(err);
        alert(err?.error?.message || 'Failed to delete selected rows.');
      }
    });
  }

  editSelectedRows(): void {
    this.rows.forEach(row => {
      if (row.selected) {
        if (!this.originalsById.has(row.id)) {
          this.originalsById.set(row.id, { ...row });
        }
        row.isEditing = true;
      }
    });
  }

  saveActive(): void {
    if (this.showInputRow) {
      this.addFromInput();
    } else {
      const editing = this.rows.filter(r => r.isEditing);
      if (!editing.length) {
        return;
      }

      const updates = editing.map(r =>
        this.rawMaterialService.updateCostItem(r.id, this.toPayload(r))
      );
      forkJoin(updates).subscribe({
        next: () => {
          alert('Updated successfully.');
          this.loadRawMaterials(this.currentPage);
        },
        error: (err) => {
          console.error(err);
          alert(err?.error?.message || 'Failed to update records.');
        }
      });
    }
  }

  saveRow(row: RawMaterialRow): void {
    this.rawMaterialService.updateCostItem(row.id, this.toPayload(row)).subscribe({
      next: () => {
        row.isEditing = false;
        row.selected = false;
        this.originalsById.delete(row.id);
      },
      error: (err) => {
        console.error(err);
        alert(err?.error?.message || 'Failed to update record.');
      }
    });
  }

  cancelRowEdit(row: RawMaterialRow): void {
    const original = this.originalsById.get(row.id);
    if (original) {
      Object.assign(row, { ...original, isEditing: false, selected: false });
      this.originalsById.delete(row.id);
      return;
    }
    row.isEditing = false;
    row.selected = false;
    this.sortRows();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage -= 1;
      this.loadRawMaterials(this.currentPage);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage += 1;
      this.loadRawMaterials(this.currentPage);
    }
  }

  hasSelectedRows(): boolean {
    return this.rows.some(row => row.selected);
  }

  hasPendingAdd(): boolean {
    return this.showInputRow;
  }

  reloadData(): void {
    this.loadRawMaterials(this.currentPage);
  }

  private loadRawMaterials(page: number): void {
    const params = this.buildQueryParams(page);
    this.rawMaterialService.getRawMaterials(params).subscribe({
      next: (response) => {
        const payload = response?.data;
        const content = payload?.content ?? [];
        this.rows = content.map((row) => this.mapApiRow(row));
        this.totalItems = payload?.totalElements ?? this.rows.length;
        this.totalPages = Math.max(payload?.totalPages ?? 1, 1);
        this.currentPage = Math.max(1, page);
        this.originalsById.clear();
        this.sortRows();
      },
      error: (err) => {
        console.error('Failed to load raw material data', err);
        this.rows = [];
        this.totalItems = 0;
        this.totalPages = 1;
        this.originalsById.clear();
        this.sortRows();
      }
    });
  }

  private sortRows(): void {
    this.rows = [...this.rows].sort((a, b) => {
      const aValue = (a as any)[this.sortKey];
      const bValue = (b as any)[this.sortKey];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const factor = this.sortDirection === 'asc' ? 1 : -1;
      if (typeof aValue === 'string') {
        return factor * aValue.localeCompare(bValue);
      }
      return factor * (aValue - bValue);
    });
  }

  private createEmptyInputRow(): RawMaterialRow {
    return {
      id: 0,
      selected: false,
      year: '',
      sector: '',
      projectLocation: '',
      type: '',
      category: '',
      subCategory: '',
      item: '',
      itemDescription: '',
      moc: '',
      unit: '',
      blueStarInstallationRate: null,
      blueStarTotalRate: null,
      micronTotalRate: null,
      rppTotalRate: null,
      listenlightsTotalRate: null,
      jbTotalRate: null,
      pmcTotalRate: null,
      gleedsTotalRate: null,
      isEditing: false
    };
  }

  private mapApiRow(row: RawMaterialRowDto): RawMaterialRow {
    return {
      id: row.id,
      selected: false,
      year: this.normalizeYearForDisplay(row.year),
      sector: row.sector || '',
      projectLocation: row.projectLocation || '',
      type: row.type || '',
      category: row.category || '',
      subCategory: row.subCategory || '',
      item: row.item || '',
      itemDescription: row.itemDescription || '',
      moc: row.moc || '',
      unit: row.unit || '',
      blueStarInstallationRate: row.blueStarInstallationRate ?? null,
      blueStarTotalRate: row.blueStarTotalRate ?? null,
      micronTotalRate: row.micronTotalRate ?? null,
      rppTotalRate: row.rppTotalRate ?? null,
      listenlightsTotalRate: row.listenlightsTotalRate ?? null,
      jbTotalRate: row.jbTotalRate ?? null,
      pmcTotalRate: row.pmcTotalRate ?? null,
      gleedsTotalRate: row.gleedsTotalRate ?? null,
      isEditing: false
    };
  }

  private normalizeYearForDisplay(value: string): string {
    const clean = (value || '').trim();
    if (/^\d{4}-\d{4}$/.test(clean)) {
      return `${clean.slice(0, 4)} - ${clean.slice(5)}`;
    }
    return clean;
  }

  private normalizeYearForApi(value: string): string {
    return (value || '').replace(/\s+/g, '');
  }

  private buildQueryParams(page: number): RawMaterialQueryParams {
    return {
      year: this.normalizeYearForApi(this.filterYear || '') || undefined,
      projectLocation: this.filterLocation || undefined,
      keyword: this.filterKeyword || undefined,
      vendorName: this.filterVendor || undefined,
      project: this.filterProject || undefined,
      categoryName: this.filterCategory || undefined,
      subCategoryName: this.filterSubCategory || undefined,
      itemName: this.filterItemName || undefined,
      type: this.filterType || undefined,
      item: this.filterItem || undefined,
      fromDate: this.filterFromDate || undefined,
      toDate: this.filterToDate || undefined,
      page: Math.max(page - 1, 0),
      size: this.pageSize
    };
  }

  private toPayload(row: RawMaterialRow): RawMaterialUpsertPayload {
    return {
      moc: (row.moc || '').trim(),
      uom: (row.unit || '').trim(),
      vendorName: (this.filterVendor || '').trim(),
      monthLabel: '',
      quarterLabel: '',
      yearLabel: this.normalizeYearForApi(row.year),
      priceDate: '',
      project: (row.projectLocation || '').trim(),
      categoryName: (row.category || '').trim(),
      subCategoryName: (row.subCategory || '').trim(),
      itemTypeName: (row.type || '').trim(),
      itemName: (row.item || '').trim()
    };
  }

  private loadCatalog(): void {
    this.catalogService.getHierarchy().subscribe({
      next: (res) => {
        this.hierarchy = res?.payload || [];
        this.isCatalogReady = true;
      },
      error: () => {
        this.hierarchy = [];
        this.isCatalogReady = false;
      }
    });
  }

  getCategoryOptions(): string[] {
    return (this.hierarchy || []).map(cat => cat.name);
  }

  getSubCategoryOptions(categoryName: string): string[] {
    const category = this.hierarchy.find(c => c.name === categoryName);
    return (category?.subCategories || []).map(sc => sc.name);
  }

  getTypeOptions(categoryName: string, subCategoryName: string): string[] {
    const category = this.hierarchy.find(c => c.name === categoryName);
    const subCategory = category?.subCategories?.find(sc => sc.name === subCategoryName);
    return (subCategory?.itemTypes || []).map(t => t.name);
  }

  getItemOptions(categoryName: string, subCategoryName: string, typeName: string): string[] {
    const category = this.hierarchy.find(c => c.name === categoryName);
    const subCategory = category?.subCategories?.find(sc => sc.name === subCategoryName);
    const type = subCategory?.itemTypes?.find(t => t.name === typeName);
    return (type?.items || []).map(i => i.name);
  }

  onCategoryChange(row: RawMaterialRow): void {
    row.subCategory = '';
    row.type = '';
    row.item = '';
    row.itemDescription = '';
    row.moc = '';
    row.unit = '';
  }

  onSubCategoryChange(row: RawMaterialRow): void {
    row.type = '';
    row.item = '';
    row.itemDescription = '';
    row.moc = '';
    row.unit = '';
  }

  onTypeChange(row: RawMaterialRow): void {
    row.item = '';
    row.itemDescription = '';
    row.moc = '';
    row.unit = '';
  }

  onItemChange(row: RawMaterialRow): void {
    const category = this.hierarchy.find(c => c.name === row.category);
    const subCategory = category?.subCategories?.find(sc => sc.name === row.subCategory);
    const type = subCategory?.itemTypes?.find(t => t.name === row.type);
    const match = type?.items?.find(i => i.name === row.item);
    if (match) {
      row.itemDescription = match.name;
      if (match.moc) row.moc = match.moc;
      if (match.uom) row.unit = match.uom;
    }
  }
}
