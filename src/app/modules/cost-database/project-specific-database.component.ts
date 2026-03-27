import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import {
  ProjectDbPayload,
  ProjectDbRecord,
  ProjectDbService
} from '../../core/services/project-db.service';
import { AutocompleteComponent } from '../../shared/components/autocomplete/autocomplete.component';
import { MultiYearSelectorComponent } from '../../shared/components/multi-year-selector/multi-year-selector.component';
import { CatalogService, HierarchyCategory, HierarchySubCategory, HierarchyType } from '../../core/services/catalog.service';

type SortDirection = 'asc' | 'desc';

interface ProjectRow {
  id: number;
  selected: boolean;
  slNo: number | null;
  year: string;
  sector: string;
  projectLocation: string;
  project: string;
  category: string;
  subPackage: string;
  type: string;
  item: string;
  moc: string;
  uom: string;
  blueStarInstallationRate: number | null;
  blueStarTotalRate: number | null;
  micronTotalRate: number | null;
  rppTotalRate: number | null;
  listenlightsTotalRate: number | null;
  jbTotalRate: number | null;
  pmcTotalRate: number | null;
  gleedsTotalRate: number | null;
  rate: number | null;
  isEditing: boolean;
}

@Component({
  selector: 'app-project-specific-database',
  standalone: true,
  imports: [CommonModule, FormsModule, AutocompleteComponent, MultiYearSelectorComponent],
  templateUrl: './project-specific-database.component.html',
  styleUrl: './project-specific-database.component.css'
})
export class ProjectSpecificDatabaseComponent implements OnInit, OnChanges {
  @Input() filterYear = '';
  @Input() filterLocation = '';
  @Input() filterVendor = '';
  @Input() filterCategory = '';
  @Input() filterKeyword = '';
  @Input() filterSector = '';
  @Input() filterProject = '';
  @Input() filterMoc = '';
  @Input() filterUnit = '';
  @Input() filterItemDescriptionLike = '';
  @Input() filterToken = 0;
  @Input() sortDirection: SortDirection = 'asc';
  @Input() sortToken = 0;
  @Input() categories: string[] = [];
  @Input() subCategories: string[] = [];
  @Input() itemNames: string[] = [];
  @Input() typeOptions: string[] = [];
  @Input() itemOptions: string[] = [];

  catalog: HierarchyCategory[] = [];

  sortKey = 'blueStarTotalRate';
  showInputRow = false;
  inputRow: ProjectRow = this.createEmptyInputRow();

  private originalsById = new Map<number, ProjectRow>();
  rows: ProjectRow[] = [];
  readonly pageSize = 10;
  currentPage = 1;
  totalItems = 0;
  totalPages = 1;

  constructor(
    private projectDbService: ProjectDbService,
    private catalogService: CatalogService
  ) {}

  ngOnInit(): void {
    this.loadCatalog();
    this.loadRows(1);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filterToken']) {
      this.loadRows(1);
      return;
    }
    if (changes['sortToken']) {
      this.sortRows();
    }
  }

  get pagedRows(): ProjectRow[] {
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

  get hasAnySelection(): boolean {
    return this.rows.some(row => row.selected);
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

  applyFilterSort(): void {
    this.loadRows(1);
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

  addFromInput(): void {
    if (!this.inputRow.item.trim()) {
      return;
    }

    this.projectDbService.createProjectRecord(this.toProjectPayload(this.inputRow)).subscribe({
      next: (res) => {
        alert(res?.message || 'Created');
        this.showInputRow = false;
        this.inputRow = this.createEmptyInputRow();
        this.loadRows(1);
      },
      error: (err) => {
        console.error(err);
        alert(err?.error?.message || 'Failed to create project record.');
      }
    });
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
    const selectedIds = this.rows.filter(r => r.selected).map(r => r.id);
    if (!selectedIds.length) {
      return;
    }

    const deletes = selectedIds.map(id => this.projectDbService.deleteProjectRecord(id));
    forkJoin(deletes).subscribe({
      next: () => {
        alert('Deleted successfully.');
        this.loadRows(this.currentPage);
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

  onRowSelect(row: ProjectRow): void {
    if (row.selected) {
      this.rows.forEach(r => {
        if (r !== row) r.selected = false;
      });
      return;
    }
    this.rows.forEach(r => {
      if (r !== row) r.selected = false;
    });
  }

  isRowSelectable(row: ProjectRow): boolean {
    return !this.hasAnySelection || row.selected;
  }

  saveActive(): void {
    if (this.showInputRow) {
      this.addFromInput();
      return;
    }

    const editingRows = this.rows.filter(r => r.isEditing);
    if (!editingRows.length) {
      return;
    }

    const updates: Observable<any>[] = editingRows.map(row =>
      this.projectDbService.updateProjectRecord(row.id, this.toProjectPayload(row))
    );

    forkJoin(updates).subscribe({
      next: () => {
        alert('Updated successfully.');
        this.loadRows(this.currentPage);
      },
      error: (err) => {
        console.error(err);
        alert(err?.error?.message || 'Failed to update project records.');
      }
    });
  }

  saveRow(row: ProjectRow): void {
    this.projectDbService.updateProjectRecord(row.id, this.toProjectPayload(row)).subscribe({
      next: () => {
        row.isEditing = false;
        row.selected = false;
        this.originalsById.delete(row.id);
      },
      error: (err) => {
        console.error(err);
        alert(err?.error?.message || 'Failed to update project record.');
      }
    });
  }

  cancelRowEdit(row: ProjectRow): void {
    const original = this.originalsById.get(row.id);
    if (original) {
      Object.assign(row, { ...original, isEditing: false, selected: false });
      this.originalsById.delete(row.id);
      return;
    }
    row.isEditing = false;
    row.selected = false;
  }

  exportData(): void {
    this.projectDbService.exportProjectRecords().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `project-db-${new Date().toISOString().slice(0, 10)}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error(err);
        alert(err?.error?.message || 'Export failed.');
      }
    });
  }

  reloadData(): void {
    this.loadRows(this.currentPage);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage -= 1;
      this.loadRows(this.currentPage);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage += 1;
      this.loadRows(this.currentPage);
    }
  }

  hasSelectedRows(): boolean {
    return this.rows.some(row => row.selected);
  }

  hasPendingAdd(): boolean {
    return this.showInputRow;
  }

  onCategoryChange(row: ProjectRow): void {
    row.subPackage = '';
    row.type = '';
    row.item = '';
  }

  onSubCategoryChange(row: ProjectRow): void {
    row.type = '';
    row.item = '';
  }

  onTypeChange(row: ProjectRow): void {
    row.item = '';
  }

  getSubCategoryOptionsFor(categoryName: string): string[] {
    const category = this.getCategoryByName(categoryName);
    const names = category?.subCategories?.map(sub => sub.name) ?? this.getAllSubCategoryNames();
    return this.withAll(names, this.subCategories.includes('All'));
  }

  getTypeOptionsFor(subCategoryName: string): string[] {
    const subCategory = this.getSubCategoryByName(subCategoryName);
    const names = subCategory?.itemTypes?.map(type => type.name) ?? this.getAllTypeNames();
    return this.withAll(names, this.typeOptions.includes('All'));
  }

  getItemOptionsFor(typeName: string): string[] {
    const type = this.getTypeByName(typeName);
    const names = type?.items?.map(item => item.name) ?? this.getAllItemNames();
    return this.withAll(names, this.itemOptions.includes('All'));
  }

  private loadRows(page: number): void {
    const params = this.buildQueryParams();
    this.projectDbService.getProjectRecordsPage(page - 1, this.pageSize, params).subscribe({
      next: (res) => {
        const records = res?.content || [];
        this.rows = records.map((record) => this.mapToProjectRow(record));
        this.totalItems = res?.totalElements ?? this.rows.length;
        this.totalPages = Math.max(res?.totalPages ?? 1, 1);
        this.currentPage = Math.max(1, page);
        this.originalsById.clear();
        this.sortRows();
      },
      error: (err) => {
        console.warn('Project DB list API failed.', err);
        this.rows = [];
        this.totalItems = 0;
        this.totalPages = 1;
        this.originalsById.clear();
        this.sortRows();
      }
    });
  }

  private mapToProjectRow(record: ProjectDbRecord): ProjectRow {
    return {
      id: record.id,
      selected: false,
      slNo: record.id ?? null,
      year: this.normalizeYearForDisplay(record.year),
      sector: record.sector || '',
      projectLocation: record.projectLocation || '',
      project: record.projectLocation || '',
      category: record.category || '',
      subPackage: record.subCategory || '',
      type: 'Material',
      item: record.itemDescription || '',
      moc: record.moc || '',
      uom: record.unit || '',
      blueStarInstallationRate: record.blueStarInstallationRate,
      blueStarTotalRate: record.blueStarTotalRate,
      micronTotalRate: record.micronTotalRate,
      rppTotalRate: record.rppTotalRate,
      listenlightsTotalRate: record.listenlightsTotalRate,
      jbTotalRate: record.jbTotalRate,
      pmcTotalRate: record.pmcTotalRate,
      gleedsTotalRate: record.gleedsTotalRate,
      rate:
        record.blueStarTotalRate ??
        record.micronTotalRate ??
        record.rppTotalRate ??
        record.listenlightsTotalRate ??
        record.jbTotalRate ??
        record.pmcTotalRate ??
        record.gleedsTotalRate ??
        null,
      isEditing: false
    };
  }

  private toProjectPayload(row: ProjectRow): ProjectDbPayload {
    return {
      slNo: row.slNo,
      category: (row.category || '').trim() || null,
      subPackage: (row.subPackage || '').trim() || null,
      type: (row.type || 'Material').trim() || null,
      sector: (row.sector || '').trim() || null,
      project: (row.project || row.projectLocation || '').trim() || null,
      year: this.normalizeYearForApi(row.year) || null,
      moc: (row.moc || '').trim() || null,
      itemDescription: (row.item || '').trim() || null,
      unit: (row.uom || '').trim() || null,
      rate: this.pickRateFromRow(row)
    };
  }

  private pickRateFromRow(row: ProjectRow): number | null {
    return (
      row.rate ??
      row.blueStarTotalRate ??
      row.micronTotalRate ??
      row.rppTotalRate ??
      row.listenlightsTotalRate ??
      row.jbTotalRate ??
      row.pmcTotalRate ??
      row.gleedsTotalRate ??
      null
    );
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

  private buildQueryParams(): {
    year?: string;
    sector?: string;
    project?: string;
    projectLocation?: string;
    category?: string;
    moc?: string;
    unit?: string;
    itemDescriptionLike?: string;
  } {
    return {
      year: this.normalizeYearForApi(this.filterYear || '') || undefined,
      sector: this.filterSector || undefined,
      project: this.filterProject || undefined,
      projectLocation: this.filterLocation || undefined,
      category: this.filterCategory || undefined,
      moc: this.filterMoc || undefined,
      unit: this.filterUnit || undefined,
      itemDescriptionLike: this.filterItemDescriptionLike || undefined
    };
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

  private createEmptyInputRow(): ProjectRow {
    return {
      id: 0,
      selected: false,
      slNo: 1,
      year: '',
      sector: '',
      projectLocation: '',
      project: '',
      category: '',
      subPackage: '',
      type: 'Material',
      item: '',
      moc: '',
      uom: '',
      blueStarInstallationRate: null,
      blueStarTotalRate: null,
      micronTotalRate: null,
      rppTotalRate: null,
      listenlightsTotalRate: null,
      jbTotalRate: null,
      pmcTotalRate: null,
      gleedsTotalRate: null,
      rate: null,
      isEditing: false
    };
  }

  private loadCatalog(): void {
    this.catalogService.getHierarchy().subscribe({
      next: (res) => {
        this.catalog = res?.payload || [];
      },
      error: () => {
        this.catalog = [];
      }
    });
  }

  private normalize(value: string): string {
    return (value || '').trim();
  }

  private getCategoryByName(name: string): HierarchyCategory | undefined {
    const clean = this.normalize(name);
    if (!clean || clean === 'All') {
      return undefined;
    }
    return this.catalog.find(cat => cat.name === clean);
  }

  private getSubCategoryByName(name: string): HierarchySubCategory | undefined {
    const clean = this.normalize(name);
    if (!clean || clean === 'All') {
      return undefined;
    }
    for (const category of this.catalog) {
      const sub = (category.subCategories || []).find(entry => entry.name === clean);
      if (sub) {
        return sub;
      }
    }
    return undefined;
  }

  private getTypeByName(name: string): HierarchyType | undefined {
    const clean = this.normalize(name);
    if (!clean || clean === 'All') {
      return undefined;
    }
    for (const category of this.catalog) {
      for (const sub of category.subCategories || []) {
        const type = (sub.itemTypes || []).find(entry => entry.name === clean);
        if (type) {
          return type;
        }
      }
    }
    return undefined;
  }

  private getAllSubCategoryNames(): string[] {
    const names = new Set<string>();
    this.catalog.forEach(category => {
      (category.subCategories || []).forEach(sub => names.add(sub.name));
    });
    if (names.size === 0) {
      return this.subCategories.filter(name => name !== 'All');
    }
    return Array.from(names);
  }

  private getAllTypeNames(): string[] {
    const names = new Set<string>();
    this.catalog.forEach(category => {
      (category.subCategories || []).forEach(sub => {
        (sub.itemTypes || []).forEach(type => names.add(type.name));
      });
    });
    if (names.size === 0) {
      return this.typeOptions.filter(name => name !== 'All');
    }
    return Array.from(names);
  }

  private getAllItemNames(): string[] {
    const names = new Set<string>();
    this.catalog.forEach(category => {
      (category.subCategories || []).forEach(sub => {
        (sub.itemTypes || []).forEach(type => {
          (type.items || []).forEach(item => names.add(item.name));
        });
      });
    });
    if (names.size === 0) {
      return this.itemOptions.filter(name => name !== 'All');
    }
    return Array.from(names);
  }

  private withAll(options: string[], includeAll: boolean): string[] {
    const unique = Array.from(new Set(options.filter(name => !!name && name !== 'All')));
    return includeAll ? ['All', ...unique] : unique;
  }
}
