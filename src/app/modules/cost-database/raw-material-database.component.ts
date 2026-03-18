import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

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
}

@Component({
  selector: 'app-raw-material-database',
  standalone: false,
  templateUrl: './raw-material-database.component.html',
  styleUrl: './raw-material-database.component.css'
})
export class RawMaterialDatabaseComponent {
  @Input() filterYear = '';
  @Input() filterLocation = '';
  @Input() filterVendor = '';
  @Input() filterCategory = '';
  @Input() filterKeyword = '';
  @Input() filterToken = 0;
  @Input() sortDirection: SortDirection = 'asc';
  @Input() sortToken = 0;
  @Input() categories: string[] = [];
  sortKey: string = 'rate';


  inputRow: RawMaterialRow = this.createEmptyInputRow();

  private readonly allRows: RawMaterialRow[] = [
    {
      id: 1,
      selected: false,
      year: '2024 - 2025',
      location: 'BLR',
      sector: 'Real Estate',
      category: 'test CATE',
      item: '3 core 300 sq. mm Al arm (E)',
      vendor: 'Blue Star Limited (R 3)',
      moc: 'HT cable',
      uom: 'RM',
      rate: 2892
    },
    {
      id: 2,
      selected: false,
      year: '2024 - 2025',
      location: 'MUM',
      sector: 'Real Estate',
      category: 'test CATE',
      item: '2 core 2.5 sq.mm Cu cable',
      vendor: 'ABC Vendor Pvt Ltd',
      moc: 'Cu cable',
      uom: 'RM',
      rate: 167
    },
    {
      id: 3,
      selected: false,
      year: '2025 - 2026',
      location: 'DEL',
      sector: 'Real Estate',
      category: 'test CATE',
      item: 'Cu conductor unarmored cable',
      vendor: 'Project Sunrise',
      moc: 'Cu cable',
      uom: 'RM',
      rate: 2628
    }
  ];

  rows: RawMaterialRow[] = [...this.allRows];
  readonly pageSize = 10;
  currentPage = 1;

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
    this.refreshRows();
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
      (this as any).allRows = remaining;
      this.refreshRows();
    }
  }

  editSelectedRows(): void {
    // Toggling 'selected' already handles edit mode in the template
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
      rate: null
    };
  }
}
