import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import {
  CostDatabaseResponse,
  CostLocationRecord,
  CostLocationService
} from '../../core/services/cost-location.service';
import { ProjectDbPayload, ProjectDbService } from '../../core/services/project-db.service';
import { AutocompleteComponent } from '../../shared/components/autocomplete/autocomplete.component';

type SortDirection = 'asc' | 'desc';

interface ProjectRow {
  id: number;
  selected: boolean;
  year: string;
  location: string;
  project: string;
  category: string;
  subPackage: string;
  type: string;
  sector: string;
  item: string;
  vendor: string;
  moc: string;
  uom: string;
  totalRate: number | null;
  slNo: number | null;
  isEditing: boolean;
}

@Component({
  selector: 'app-project-specific-database',
  standalone: true,
  imports: [CommonModule, FormsModule, AutocompleteComponent],
  templateUrl: './project-specific-database.component.html',
  styleUrl: './project-specific-database.component.css'
})
export class ProjectSpecificDatabaseComponent implements OnInit, OnChanges {
  @Input() filterYear = '';
  @Input() filterLocation = '';
  @Input() filterVendor = '';
  @Input() filterCategory = '';
  @Input() filterKeyword = '';
  @Input() filterToken = 0;
  @Input() sortDirection: SortDirection = 'asc';
  @Input() sortToken = 0;
  @Input() categories: string[] = [];

  sortKey = 'totalRate';
  showInputRow = false;
  inputRow: ProjectRow = this.createEmptyInputRow();

  private allRows: ProjectRow[] = [];
  private originalsById = new Map<number, ProjectRow>();
  rows: ProjectRow[] = [];
  readonly pageSize = 10;
  currentPage = 1;

  constructor(
    private costLocationService: CostLocationService,
    private projectDbService: ProjectDbService
  ) {}

  ngOnInit(): void {
    this.loadRows();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filterToken'] || changes['sortToken']) {
      this.refreshRows();
    }
  }

  get pagedRows(): ProjectRow[] {
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
    this.pagedRows.forEach(r => (r.selected = checked));
  }

  applyFilterSort(): void {
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

  addFromInput(): void {
    if (!this.inputRow.item.trim()) {
      return;
    }

    this.projectDbService.createProjectRecord(this.toProjectPayload(this.inputRow)).subscribe({
      next: (res) => {
        alert(res?.message || 'Created');
        this.showInputRow = false;
        this.inputRow = this.createEmptyInputRow();
        this.loadRows();
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
    this.refreshRows();
  }

  deleteSelectedRows(): void {
    const selectedIds = this.allRows.filter(r => r.selected).map(r => r.id);
    if (!selectedIds.length) {
      return;
    }

    const deletes = selectedIds.map(id => this.projectDbService.deleteProjectRecord(id));
    forkJoin(deletes).subscribe({
      next: () => {
        alert('Deleted successfully.');
        this.loadRows();
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
        this.loadRows();
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
    this.costLocationService.exportLocations().subscribe({
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
    this.loadRows();
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

  private loadRows(): void {
    this.costLocationService.getLocations().subscribe({
      next: (res) => {
        this.allRows = (res?.content || []).map((record) => this.mapToProjectRow(record));
        this.originalsById.clear();
        this.refreshRows();
      },
      error: (err) => {
        console.warn('Project DB list API failed. Loading demo data.', err);
        const fallback: CostDatabaseResponse<CostLocationRecord> =
          this.costLocationService.getLocationDemoResponse();
        this.allRows = fallback.payload.map((record) => this.mapToProjectRow(record));
        this.originalsById.clear();
        this.refreshRows();
      }
    });
  }

  private mapToProjectRow(record: CostLocationRecord): ProjectRow {
    return {
      id: record.id,
      selected: false,
      year: this.normalizeYearForDisplay(record.year),
      location: record.projectLocation || '',
      project: record.projectLocation || '',
      category: record.category || '',
      subPackage: record.subCategory || '',
      type: 'Material',
      sector: record.sector || '',
      item: record.itemDescription || '',
      vendor: 'Blue Star Limited (R 3)',
      moc: record.moc || '',
      uom: record.unit || '',
      totalRate:
        record.rppTotalRate ??
        record.blueStarTotalRate ??
        record.micronTotalRate ??
        record.listenlightsTotalRate ??
        record.jbTotalRate ??
        record.pmcTotalRate ??
        record.gleedsTotalRate ??
        null,
      slNo: record.id ?? null,
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
      project: (row.project || '').trim() || null,
      year: this.normalizeYearForApi(row.year) || null,
      moc: (row.moc || '').trim() || null,
      itemDescription: (row.item || '').trim() || null,
      unit: (row.uom || '').trim() || null,
      rate: row.totalRate
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

  private refreshRows(): void {
    const filtered = this.allRows.filter((row) => {
      const yearOk = !this.filterYear || row.year === this.filterYear;
      const locationOk = !this.filterLocation || row.location === this.filterLocation;
      const vendorOk = !this.filterVendor || row.vendor === this.filterVendor;
      const categoryOk = !this.filterCategory || row.category === this.filterCategory;
      const search = this.filterKeyword.toLowerCase();
      const keywordOk =
        !search ||
        row.item.toLowerCase().includes(search) ||
        row.project.toLowerCase().includes(search) ||
        row.vendor.toLowerCase().includes(search);
      return yearOk && locationOk && vendorOk && categoryOk && keywordOk;
    });

    this.rows = [...filtered].sort((a, b) => {
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

  private createEmptyInputRow(): ProjectRow {
    return {
      id: 0,
      selected: false,
      year: '',
      location: '',
      project: '',
      category: '',
      subPackage: '',
      type: 'Material',
      sector: '',
      item: '',
      vendor: 'Blue Star Limited (R 3)',
      moc: '',
      uom: '',
      totalRate: null,
      slNo: 1,
      isEditing: false
    };
  }
}
