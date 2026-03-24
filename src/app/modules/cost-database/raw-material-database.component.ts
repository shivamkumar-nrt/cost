import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutocompleteComponent } from '../../shared/components/autocomplete/autocomplete.component';
import {
  RawMaterialResponse,
  RawMaterialRowDto,
  RawMaterialService
} from '../../core/services/raw-material.service';

type SortDirection = 'asc' | 'desc';

interface RawMaterialRow {
  id: number;
  selected: boolean;
  year: string;
  location: string;
  sector: string;
  category: string;
  item: string;
  vendor: string;
  moc: string;
  uom: string;
  rate: number | null;
  isEditing: boolean;
}

@Component({
  selector: 'app-raw-material-database',
  standalone: true,
  imports: [CommonModule, FormsModule, AutocompleteComponent],
  templateUrl: './raw-material-database.component.html',
  styleUrl: './raw-material-database.component.css'
})
export class RawMaterialDatabaseComponent implements OnInit, OnChanges {
  @Input() filterYear = '';
  @Input() filterLocation = '';
  @Input() filterVendor = '';
  @Input() filterCategory = '';
  @Input() filterKeyword = '';
  @Input() filterToken = 0;
  @Input() sortDirection: SortDirection = 'asc';
  @Input() sortToken = 0;
  @Input() categories: string[] = [];
  sortKey = 'rate';
  showInputRow = false;

  inputRow: RawMaterialRow = this.createEmptyInputRow();
  private allRows: RawMaterialRow[] = [];
  rows: RawMaterialRow[] = [];
  readonly pageSize = 10;
  currentPage = 1;

  constructor(private rawMaterialService: RawMaterialService) {}

  ngOnInit(): void {
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
    this.pagedRows.forEach(r => (r.selected = checked));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filterToken'] || changes['sortToken']) {
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
    const remaining = this.allRows.filter(row => !row.selected);
    if (remaining.length !== this.allRows.length) {
      this.allRows = remaining;
      this.refreshRows();
    }
  }

  editSelectedRows(): void {
    this.rows.forEach(row => {
      if (row.selected) {
        row.isEditing = true;
      }
    });
  }

  saveActive(): void {
    if (this.showInputRow) {
      this.addFromInput();
    } else {
      const editing = this.rows.filter(r => r.isEditing);
      editing.forEach(r => this.saveRow(r));
    }
  }

  saveRow(row: RawMaterialRow): void {
    row.isEditing = false;
    row.selected = false;
  }

  cancelRowEdit(row: RawMaterialRow): void {
    row.isEditing = false;
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

  private loadRawMaterials(): void {
    this.rawMaterialService.getRawMaterials().subscribe({
      next: (res: RawMaterialResponse) => {
        this.allRows = (res?.payload || []).map((row: RawMaterialRowDto) => ({
          ...row,
          selected: false,
          isEditing: false
        }));
        this.refreshRows();
      },
      error: (err) => {
        console.error('Failed to load raw material data', err);
        this.allRows = [];
        this.rows = [];
      }
    });
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
        row.vendor.toLowerCase().includes(search) ||
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
      location: '',
      sector: '',
      category: '',
      item: '',
      vendor: '',
      moc: '',
      uom: '',
      rate: null,
      isEditing: false
    };
  }
}
