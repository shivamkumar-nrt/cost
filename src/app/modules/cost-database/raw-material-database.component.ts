import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { AutocompleteComponent } from '../../shared/components/autocomplete/autocomplete.component';
import { MultiYearSelectorComponent } from '../../shared/components/multi-year-selector/multi-year-selector.component';
import {
  RawMaterialQueryParams,
  RawMaterialResponse,
  RawMaterialRowDto,
  RawMaterialService,
  RawMaterialUpsertPayload
} from '../../core/services/raw-material.service';
import {
  CatalogService,
  HierarchyCategory,
  HierarchyItem,
  HierarchySubCategory,
  HierarchyType
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
  private allRows: RawMaterialRow[] = [];
  private originalsById = new Map<number, RawMaterialRow>();
  rows: RawMaterialRow[] = [];
  readonly pageSize = 10;
  currentPage = 1;
  hierarchy: HierarchyCategory[] = [];
  isCatalogReady = false;

  constructor(
    private rawMaterialService: RawMaterialService,
    private catalogService: CatalogService
  ) {}

  ngOnInit(): void {
    this.loadCatalog();
    this.loadRawMaterials();
  }

  get pagedRows(): RawMaterialRow[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.rows.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.rows.length / this.pageSize));
  }

  get startItem(): number {
    if (!this.rows.length) {
      return 0;
    }
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.rows.length);
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
      this.loadRawMaterials();
      return;
    }
    if (changes['sortToken']) {
      this.refreshRows();
    }
  }

  addFromInput(): void {
    if (!this.inputRow.item.trim()) {
      return;
    }

    this.allRows.unshift({
      ...this.inputRow,
      id: Date.now(),
      selected: true
    });
    this.inputRow = this.createEmptyInputRow();
    this.showInputRow = false;
    this.refreshRows();
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
    this.refreshRows();
  }

  toggleEdit(row: RawMaterialRow): void {
    row.selected = !row.selected;
  }

  onRowSelect(row: RawMaterialRow): void {
    if (row.selected) {
      this.allRows.forEach(r => {
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
    this.refreshRows();
  }

  deleteSelectedRows(): void {
    const selectedIds = this.allRows.filter(row => row.selected).map(row => row.id);
    if (!selectedIds.length) {
      return;
    }

    const deletes = selectedIds.map(id => this.rawMaterialService.deleteCostItem(id));
    forkJoin(deletes).subscribe({
      next: () => {
        alert('Deleted successfully.');
        this.loadRawMaterials();
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
          this.loadRawMaterials();
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
    this.refreshRows();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage -= 1;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage += 1;
    }
  }

  hasSelectedRows(): boolean {
    return this.allRows.some(row => row.selected);
  }

  private loadRawMaterials(): void {
    this.fetchAllRawMaterialRows().subscribe({
      next: (rows) => {
        this.allRows = rows.map((row) => this.mapApiRow(row));
        this.originalsById.clear();
        this.refreshRows();
      },
      error: (err) => {
        console.error('Failed to load raw material data', err);
        const fallback = this.getFallbackRows();
        this.allRows = fallback.map((row) => this.mapApiRow(row));
        this.originalsById.clear();
        this.refreshRows();
      }
    });
  }

  private refreshRows(): void {
    const filterYearNormalized = this.normalizeYearForApi(this.filterYear || '');
    const yearRange = this.parseYearRange(this.filterYear || '');
    const filtered = this.allRows.filter((row) => {
      const rowYearNormalized = this.normalizeYearForApi(row.year || '');
      const yearOk = this.isYearMatch(rowYearNormalized, filterYearNormalized, yearRange);
      const locationOk =
        !this.filterLocation || row.projectLocation === this.filterLocation;
      const vendorOk = true;
      const categoryOk = !this.filterCategory || row.category === this.filterCategory;
      const search = this.filterKeyword.toLowerCase();
      const keywordOk =
        !search ||
        row.item.toLowerCase().includes(search) ||
        row.itemDescription.toLowerCase().includes(search) ||
        row.moc.toLowerCase().includes(search);
      return yearOk && locationOk && vendorOk && categoryOk && keywordOk;
    });

    this.rows = filtered.sort((a, b) => {
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

    this.currentPage = 1;
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
    const cleaned = (value || '').replace(/\s+/g, '');
    const match = cleaned.match(/\d{4}/);
    return match ? match[0] : cleaned;
  }

  private buildQueryParams(): RawMaterialQueryParams {
    return {
      vendorName: this.filterVendor || undefined,
      project: this.filterProject || undefined,
      categoryName: this.filterCategory || undefined,
      subCategoryName: this.filterSubCategory || undefined,
      itemName: this.filterItemName || undefined,
      type: this.filterType || undefined,
      item: this.filterItem || undefined,
      fromDate: this.filterFromDate || undefined,
      toDate: this.filterToDate || undefined,
      page: 0,
      size: 500
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

  private fetchAllRawMaterialRows(): Observable<RawMaterialRowDto[]> {
    const pageSize = 200;
    const baseParams = this.buildQueryParams();
    return this.rawMaterialService.getRawMaterials({ ...baseParams, page: 0, size: pageSize }).pipe(
      switchMap((firstPage: RawMaterialResponse) => {
        const firstContent = firstPage?.data?.content || [];
        const totalPages = Math.max(firstPage?.data?.totalPages || 1, 1);
        if (totalPages <= 1) {
          return of(firstContent);
        }

        const remainingRequests: Observable<RawMaterialRowDto[]>[] = [];
        for (let page = 1; page < totalPages; page += 1) {
          remainingRequests.push(
            this.rawMaterialService
              .getRawMaterials({ ...baseParams, page, size: pageSize })
              .pipe(map((response) => response?.data?.content || []))
          );
        }

        return forkJoin(remainingRequests).pipe(
          map((remainingPages) => [firstContent, ...remainingPages].flat())
        );
      })
    );
  }

  private getFallbackRows(): RawMaterialRowDto[] {
    return [
      {
        id: 5,
        year: '2024-2025',
        sector: 'Real Estate',
        projectLocation: 'BLR',
        type: 'ELE',
        category: 'ELE',
        subCategory: 'Cable',
        moc: 'HT cable',
        item: '3 core 300 sq. mm Al arm (E)',
        itemDescription: '3 core 300 sq. mm Al arm (E)',
        unit: 'RM',
        blueStarInstallationRate: 814,
        blueStarTotalRate: 2892,
        micronTotalRate: 3938,
        rppTotalRate: 3005.48,
        listenlightsTotalRate: 4574,
        jbTotalRate: 2464,
        pmcTotalRate: 3500,
        gleedsTotalRate: 3227
      },
      {
        id: 8,
        year: '2024-2025',
        sector: 'Real Estate',
        projectLocation: 'BLR',
        type: 'ELE',
        category: 'ELE',
        subCategory: 'Cable',
        moc: 'Cu cable',
        item: '2 core 2.5 sq.mm Cu cable',
        itemDescription: '2 core 2.5 sq.mm Cu cable',
        unit: 'RM',
        blueStarInstallationRate: 61,
        blueStarTotalRate: 167,
        micronTotalRate: 189,
        rppTotalRate: 112.83,
        listenlightsTotalRate: 445,
        jbTotalRate: 132,
        pmcTotalRate: 375,
        gleedsTotalRate: 265
      }
    ];
  }

  private parseYearRange(value: string): { start: number; end: number } | null {
    if (!value || !value.includes('-')) {
      return null;
    }
    const parts = value.split('-').map(p => parseInt(p.trim(), 10));
    if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) {
      return null;
    }
    return { start: Math.min(parts[0], parts[1]), end: Math.max(parts[0], parts[1]) };
  }

  private isYearMatch(rowYear: string, filterYear: string, range: { start: number; end: number } | null): boolean {
    if (!filterYear) {
      return true;
    }
    if (range) {
      const rowYearNum = parseInt(rowYear, 10);
      if (Number.isNaN(rowYearNum)) {
        return false;
      }
      return rowYearNum >= range.start && rowYearNum <= range.end;
    }
    return rowYear === filterYear;
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
