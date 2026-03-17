import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

type SortDirection = 'asc' | 'desc';

interface ApiResponse {
  status: string;
  message: string;
  payload: ApiPayloadRow[];
  statusCode: number;
}

interface ApiPayloadRow {
  id: number;
  categoryName: string;
  subCategoryName: string;
  itemTypeName: string;
  itemName: string;
  moc: string;
  uom: string;
  vendorName: string;
  monthLabel: string;
  quarterLabel: string;
  yearLabel: string;
  priceDate: number[];
  project: string;
}

interface TableRow {
  id: number;
  selected: boolean;
  year: string;
  sector: string;
  projectLocation: string;
  category: string;
  shortItemSpecification: string;
  vendorName: string;
  moc: string;
  uom: string;
  totalRate: number | null;
}

@Component({
  selector: 'app-location-specific-database',
  standalone: false,
  templateUrl: './location-specific-database.component.html',
  styleUrl: './location-specific-database.component.css'
})
export class LocationSpecificDatabaseComponent {
  @Input() filterYear = '';
  @Input() filterLocation = '';
  @Input() filterVendor = '';
  @Input() filterCategory = '';
  @Input() filterKeyword = '';
  @Input() filterToken = 0;
  @Input() sortDirection: SortDirection = 'asc';
  @Input() sortToken = 0;

  readonly response: ApiResponse = {
    status: 'SUCCESS',
    message: 'OK',
    payload: [
      {
        id: 3,
        categoryName: 'test',
        subCategoryName: 'Real Estate',
        itemTypeName: 'ELE',
        itemName: '3 core 300 sq. mm Al arm (E)',
        moc: 'HT cable',
        uom: 'RM',
        vendorName: 'ABC Vendor Pvt Ltd',
        monthLabel: 'January',
        quarterLabel: 'Q1',
        yearLabel: '2026',
        priceDate: [2026, 2, 25],
        project: 'New Sunrise'
      },
      {
        id: 2,
        categoryName: 'test',
        subCategoryName: 'Real Estate',
        itemTypeName: 'ELE',
        itemName: '2 core 2.5 sq.mm Cu cable',
        moc: 'Cu cable',
        uom: 'RM',
        vendorName: 'ABC Vendor Pvt Ltd',
        monthLabel: 'January',
        quarterLabel: 'Q1',
        yearLabel: '2026',
        priceDate: [2026, 2, 25],
        project: 'Project Sunrise'
      }
    ],
    statusCode: 200
  };

  inputRow: TableRow = this.createEmptyInputRow();

  private readonly allRows: TableRow[] = this.buildRowsFromApi();
  rows: TableRow[] = [...this.allRows];
  readonly pageSize = 10;
  currentPage = 1;

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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filterToken'] || changes['sortToken']) {
      this.refreshRows();
    }
  }

  addFromInput(): void {
    const trimmedItem = this.inputRow.shortItemSpecification.trim();
    if (!trimmedItem) {
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

  toggleEdit(row: TableRow): void {
    row.selected = !row.selected;
  }

  deleteSelectedRows(): void {
    const remaining = this.allRows.filter(row => !row.selected);
    if (remaining.length !== this.allRows.length) {
      // Something was deleted
      // We need to mutate the source array if it's a field
      (this as any).allRows = remaining;
      this.refreshRows();
    }
  }

  editSelectedRows(): void {
    // This is handled by toggling 'selected' on each row
    // If the user wants to toggle ALL selected rows into edit mode:
    this.rows.forEach(row => {
      if (row.selected) {
        // row.selected = true; // They are already selected if we are here
        // We might need a separate 'isEditing' flag if 'selected' is just for checkbox
      }
    });
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

  private buildRowsFromApi(): TableRow[] {
    const mapped = this.response.payload.map((entry, index) => ({
      id: entry.id,
      selected: false,
      year: '2024 - 2025',
      sector: entry.subCategoryName,
      projectLocation: 'BLR',
      category: entry.itemTypeName,
      shortItemSpecification: entry.itemName,
      vendorName: 'Blue Star Limited (R 3)',
      moc: entry.moc,
      uom: entry.uom,
      totalRate: index === 0 ? 2892 : 2628
    }));

    const clones: TableRow[] = [];
    for (let i = 0; i < 18; i += 1) {
      const source = mapped[i % mapped.length];
      clones.push({
        ...source,
        id: source.id * 100 + i,
        selected: false
      });
    }
    return [...mapped, ...clones];
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

    this.rows = filtered.sort((a, b) => {
      const aRate = a.totalRate ?? 0;
      const bRate = b.totalRate ?? 0;
      return this.sortDirection === 'asc' ? aRate - bRate : bRate - aRate;
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
      shortItemSpecification: '',
      vendorName: '',
      moc: '',
      uom: '',
      totalRate: null
    };
  }
}
