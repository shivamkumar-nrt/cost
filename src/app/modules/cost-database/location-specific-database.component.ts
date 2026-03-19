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
  isEditing: boolean;
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
  @Input() categories: string[] = [];
  sortKey: string = 'totalRate';
  showInputRow = false;
 drum: string = ''; // Placeholder if needed, but sortKey is the main one




  readonly response: ApiResponse = {
    status: 'SUCCESS',
    message: 'OK',
    payload: [
      {
        id: 3,
        categoryName: 'test',
        subCategoryName: 'Real Estate',
        itemTypeName: 'test CATE',
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
        itemTypeName: 'test CATE',
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

  saveRow(row: TableRow): void {
    row.isEditing = false;
    row.selected = false;
  }

  cancelRowEdit(row: TableRow): void {
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
      totalRate: index === 0 ? 2892 : 2628,
      isEditing: false
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
      shortItemSpecification: '',
      vendorName: '',
      moc: '',
      uom: '',
      totalRate: null,
      isEditing: false
    };
  }
}
