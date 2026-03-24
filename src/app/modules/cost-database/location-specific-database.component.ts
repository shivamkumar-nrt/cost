import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import {
  CostDatabaseResponse,
  CostLocationRecord,
  CostLocationService,
  CostLocationUpsertPayload
} from '../../core/services/cost-location.service';
import { AutocompleteComponent } from '../../shared/components/autocomplete/autocomplete.component';

type SortDirection = 'asc' | 'desc';

interface TableRow {
  id: number;
  selected: boolean;
  year: string;
  sector: string;
  projectLocation: string;
  category: string;
  subCategory: string;
  shortItemSpecification: string;
  vendorName: string;
  moc: string;
  uom: string;
  blueStarTotalRate: number | null;
  micronTotalRate: number | null;
  rppTotalRate: number | null;
  listenlightsTotalRate: number | null;
  jbTotalRate: number | null;
  pmcTotalRate: number | null;
  gleedsTotalRate: number | null;
  totalRate: number | null;
  blueStarInstallationRate: number | null;
  isEditing: boolean;
}

@Component({
  selector: 'app-location-specific-database',
  standalone: true,
  imports: [CommonModule, FormsModule, AutocompleteComponent],
  templateUrl: './location-specific-database.component.html',
  styleUrl: './location-specific-database.component.css'
})
export class LocationSpecificDatabaseComponent implements OnInit, OnChanges {
  @Input() filterYear = '';
  @Input() filterLocation = '';
  @Input() filterVendor = '';
  @Input() filterCategory = '';
  @Input() filterKeyword = '';
  @Input() filterToken = 0;
  @Input() sortDirection: SortDirection = 'asc';
  @Input() sortToken = 0;
  @Input() categories: string[] = [];

  sortKey = 'blueStarTotalRate';
  showInputRow = false;
  inputRow: TableRow = this.createEmptyInputRow();

  private allRows: TableRow[] = [];
  private originalsById = new Map<number, TableRow>();
  rows: TableRow[] = [];
  readonly pageSize = 10;
  currentPage = 1;

  constructor(private costLocationService: CostLocationService) {}

  ngOnInit(): void {
    this.loadLocations();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filterToken'] || changes['sortToken']) {
      this.refreshRows();
    }
  }

  get pagedRows(): TableRow[] {
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
    const trimmedItem = this.inputRow.shortItemSpecification.trim();
    if (!trimmedItem) {
      return;
    }

    const payload = this.toPayload(this.inputRow);
    this.costLocationService.createLocation(payload).subscribe({
      next: (res) => {
        alert(res?.message || 'Created');
        this.showInputRow = false;
        this.inputRow = this.createEmptyInputRow();
        this.loadLocations();
      },
      error: (err) => {
        console.error(err);
        alert(err?.error?.message || 'Failed to create location record.');
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

    const deletes = selectedIds.map(id => this.costLocationService.deleteLocation(id));
    forkJoin(deletes).subscribe({
      next: () => {
        alert('Deleted successfully.');
        this.loadLocations();
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

    const updates: Observable<any>[] = editingRows.map((row) =>
      this.costLocationService.updateLocation(row.id, this.toPayload(row))
    );

    forkJoin(updates).subscribe({
      next: () => {
        alert('Updated successfully.');
        this.loadLocations();
      },
      error: (err) => {
        console.error(err);
        alert(err?.error?.message || 'Failed to update records.');
      }
    });
  }

  saveRow(row: TableRow): void {
    this.costLocationService.updateLocation(row.id, this.toPayload(row)).subscribe({
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

  cancelRowEdit(row: TableRow): void {
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
        a.download = `cost-location-${new Date().toISOString().slice(0, 10)}.xlsx`;
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
    this.loadLocations();
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

  private loadLocations(): void {
    this.fetchAllLocationRows().subscribe({
      next: (res) => {
        this.allRows = res.map((record) => this.mapApiToRow(record));
        this.originalsById.clear();
        this.refreshRows();
      },
      error: (err) => {
        console.warn('Cost location API failed. Loading demo data.', err);
        const fallback: CostDatabaseResponse<CostLocationRecord> =
          this.costLocationService.getLocationDemoResponse();
        this.allRows = fallback.payload.map((record) => this.mapApiToRow(record));
        this.originalsById.clear();
        this.refreshRows();
      }
    });
  }

  private fetchAllLocationRows(): Observable<CostLocationRecord[]> {
    const pageSize = 200;
    return this.costLocationService.getLocationsPage(0, pageSize).pipe(
      switchMap((firstPage) => {
        const firstContent = firstPage?.content || [];
        const totalPages = Math.max(firstPage?.totalPages || 1, 1);
        if (totalPages <= 1) {
          return of(firstContent);
        }

        const remainingRequests: Observable<CostLocationRecord[]>[] = [];
        for (let page = 1; page < totalPages; page += 1) {
          remainingRequests.push(
            this.costLocationService.getLocationsPage(page, pageSize).pipe(
              map((response) => response?.content || [])
            )
          );
        }

        return forkJoin(remainingRequests).pipe(
          map((remainingPages) => [firstContent, ...remainingPages].flat())
        );
      })
    );
  }

  private mapApiToRow(record: CostLocationRecord): TableRow {
    return {
      id: record.id,
      selected: false,
      year: this.normalizeYearForDisplay(record.year),
      sector: record.sector || '',
      projectLocation: record.projectLocation || '',
      category: record.category || '',
      subCategory: record.subCategory || '',
      shortItemSpecification: record.itemDescription || '',
      vendorName: 'Blue Star Limited (R 3)',
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
      totalRate: this.pickTotalRate(record),
      isEditing: false
    };
  }

  private toPayload(row: TableRow): CostLocationUpsertPayload {
    return {
      year: this.normalizeYearForApi(row.year),
      sector: (row.sector || '').trim(),
      projectLocation: (row.projectLocation || '').trim(),
      category: (row.category || '').trim(),
      subCategory: (row.subCategory || '').trim(),
      moc: (row.moc || '').trim(),
      itemDescription: (row.shortItemSpecification || '').trim(),
      unit: (row.uom || '').trim(),
      blueStarInstallationRate: row.blueStarInstallationRate,
      blueStarTotalRate: row.blueStarTotalRate,
      micronTotalRate: row.micronTotalRate,
      rppTotalRate: row.rppTotalRate,
      listenlightsTotalRate: row.listenlightsTotalRate,
      jbTotalRate: row.jbTotalRate,
      pmcTotalRate: row.pmcTotalRate,
      gleedsTotalRate: row.gleedsTotalRate
    };
  }

  private pickTotalRate(record: CostLocationRecord): number | null {
    return (
      record.blueStarTotalRate ??
      record.micronTotalRate ??
      record.rppTotalRate ??
      record.listenlightsTotalRate ??
      record.jbTotalRate ??
      record.pmcTotalRate ??
      record.gleedsTotalRate ??
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

  private refreshRows(): void {
    const filtered = this.allRows.filter((row) => {
      const yearOk = !this.filterYear || row.year === this.filterYear;
      const locationOk = !this.filterLocation || row.projectLocation === this.filterLocation;
      const vendorOk = !this.filterVendor || row.vendorName === this.filterVendor;
      const categoryOk = !this.filterCategory || row.category === this.filterCategory;
      const search = this.filterKeyword.toLowerCase();
      const keywordOk =
        !search ||
        row.shortItemSpecification.toLowerCase().includes(search) ||
        row.vendorName.toLowerCase().includes(search) ||
        row.moc.toLowerCase().includes(search);

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

  private createEmptyInputRow(): TableRow {
    return {
      id: 0,
      selected: false,
      year: '',
      sector: '',
      projectLocation: '',
      category: '',
      subCategory: '',
      shortItemSpecification: '',
      vendorName: 'Blue Star Limited (R 3)',
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
      totalRate: null,
      isEditing: false
    };
  }
}

