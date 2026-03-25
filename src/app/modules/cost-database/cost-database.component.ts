import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocationSpecificDatabaseComponent } from './location-specific-database.component';
import { ProjectSpecificDatabaseComponent } from './project-specific-database.component';
import { RawMaterialDatabaseComponent } from './raw-material-database.component';
import { CostLocationService } from '../../core/services/cost-location.service';
import { AutocompleteComponent } from '../../shared/components/autocomplete/autocomplete.component';
import { ImportModalComponent } from './import-modal.component';

type TabKey = 'raw-material' | 'location-specific' | 'project-specific';
type SortDirection = 'asc' | 'desc';

interface Category {
  id: number;
  name: string;
}

interface TabFilterState {
  selectedYear: string;
  selectedLocation: string;
  selectedVendor: string;
  selectedCategory: string;
  selectedSubCategory: string;
  selectedItemName: string;
  selectedKeyword: string;
  uomMode: 'set' | 'no';
  selectedUoms: string[];
  projectType: 'within' | 'outside';
  minRate: number;
  maxRate: number;
  appliedYear: string;
  appliedLocation: string;
  appliedVendor: string;
  appliedCategory: string;
  appliedKeyword: string;
}

@Component({
  selector: 'app-cost-database',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AutocompleteComponent,
    ImportModalComponent,
    RawMaterialDatabaseComponent,
    LocationSpecificDatabaseComponent,
    ProjectSpecificDatabaseComponent
  ],
  templateUrl: './cost-database.component.html',
  styleUrl: './cost-database.component.css'
})
export class CostDatabaseComponent {
  @ViewChild('rawTab') rawTab?: RawMaterialDatabaseComponent;
  @ViewChild('locationTab') locationTab?: LocationSpecificDatabaseComponent;
  @ViewChild('projectTab') projectTab?: ProjectSpecificDatabaseComponent;
  readonly financialYears = ['All', '2024 - 2025', '2025 - 2026'];
  readonly locations = ['All', 'BLR', 'MUM', 'DEL'];
  readonly vendors = ['All', 'Blue Star Limited (R 3)', 'ABC Vendor Pvt Ltd', 'Project Sunrise'];

  activeTab: TabKey = 'location-specific';
  sortDirection: SortDirection = 'asc';
  filterToken = 0;
  sortToken = 0;
  isFilterSidebarOpen = false;
  showImportModal = false;

  filterStates: Record<TabKey, TabFilterState> = {
    'raw-material': this.createDefaultFilterState(),
    'location-specific': this.createDefaultFilterState(),
    'project-specific': this.createDefaultFilterState()
  };

  readonly subCategories = ['All', 'Sub Cat 1', 'Sub Cat 2', 'Sub Cat 3'];
  readonly itemNames = ['All', 'Item A', 'Item B', 'Item C'];
  readonly uomOptions = ['Kg', 'Meter', 'sq. ft', 'liter', 'mm'];

  // Demo response structure - ready for API integration
  readonly categoryApiResponse = {
    "status": "SUCCESS",
    "message": "OK",
    "payload": [
      { "id": 2, "name": "test 2 CATE" },
      { "id": 1, "name": "test CATE" }
    ],
    "statusCode": 200
  };

  readonly categoryOptions = ['All', ...this.categoryApiResponse.payload.map(c => c.name)];

  constructor(private costLocationService: CostLocationService) {}

  get selectedYear(): string {
    return this.filterStates[this.activeTab].selectedYear;
  }
  set selectedYear(value: string) {
    this.filterStates[this.activeTab].selectedYear = value;
  }

  get selectedLocation(): string {
    return this.filterStates[this.activeTab].selectedLocation;
  }
  set selectedLocation(value: string) {
    this.filterStates[this.activeTab].selectedLocation = value;
  }

  get selectedVendor(): string {
    return this.filterStates[this.activeTab].selectedVendor;
  }
  set selectedVendor(value: string) {
    this.filterStates[this.activeTab].selectedVendor = value;
  }

  get selectedCategory(): string {
    return this.filterStates[this.activeTab].selectedCategory;
  }
  set selectedCategory(value: string) {
    this.filterStates[this.activeTab].selectedCategory = value;
  }

  get selectedSubCategory(): string {
    return this.filterStates[this.activeTab].selectedSubCategory;
  }
  set selectedSubCategory(value: string) {
    this.filterStates[this.activeTab].selectedSubCategory = value;
  }

  get selectedItemName(): string {
    return this.filterStates[this.activeTab].selectedItemName;
  }
  set selectedItemName(value: string) {
    this.filterStates[this.activeTab].selectedItemName = value;
  }

  get selectedKeyword(): string {
    return this.filterStates[this.activeTab].selectedKeyword;
  }
  set selectedKeyword(value: string) {
    this.filterStates[this.activeTab].selectedKeyword = value;
  }

  get uomMode(): 'set' | 'no' {
    return this.filterStates[this.activeTab].uomMode;
  }
  set uomMode(value: 'set' | 'no') {
    this.filterStates[this.activeTab].uomMode = value;
  }

  get selectedUoms(): string[] {
    return this.filterStates[this.activeTab].selectedUoms;
  }
  set selectedUoms(value: string[]) {
    this.filterStates[this.activeTab].selectedUoms = value;
  }

  get projectType(): 'within' | 'outside' {
    return this.filterStates[this.activeTab].projectType;
  }
  set projectType(value: 'within' | 'outside') {
    this.filterStates[this.activeTab].projectType = value;
  }

  get minRate(): number {
    return this.filterStates[this.activeTab].minRate;
  }
  set minRate(value: number) {
    this.filterStates[this.activeTab].minRate = value;
  }

  get maxRate(): number {
    return this.filterStates[this.activeTab].maxRate;
  }
  set maxRate(value: number) {
    this.filterStates[this.activeTab].maxRate = value;
  }

  get activeTabLabel(): string {
    if (this.activeTab === 'raw-material') {
      return 'Raw Material Database';
    }
    if (this.activeTab === 'project-specific') {
      return 'Project Specific Database';
    }
    return 'Location Specific Database';
  }

  setTab(tab: TabKey): void {
    this.activeTab = tab;
  }

  updateFilters(): void {
    const state = this.filterStates[this.activeTab];
    state.appliedYear = state.selectedYear === 'All' ? '' : state.selectedYear;
    state.appliedLocation = state.selectedLocation === 'All' ? '' : state.selectedLocation;
    state.appliedVendor = state.selectedVendor === 'All' ? '' : state.selectedVendor;
    state.appliedCategory = state.selectedCategory === 'All' ? '' : state.selectedCategory;
    state.appliedKeyword = state.selectedKeyword.trim();
    this.filterToken += 1;
    this.rawTab?.applyFilterSort();
    this.locationTab?.applyFilterSort();
    this.projectTab?.applyFilterSort();
  }

  applyFilters(): void {
    this.updateFilters();
    this.isFilterSidebarOpen = false;
  }

  sortByRate(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.sortToken += 1;
    this.rawTab?.applyFilterSort();
    this.locationTab?.applyFilterSort();
    this.projectTab?.applyFilterSort();
  }

  addRowToActiveTab(): void {
    if (this.activeTab === 'raw-material') {
      this.rawTab?.toggleAddRow();
      return;
    }
    if (this.activeTab === 'project-specific') {
      this.projectTab?.toggleAddRow();
      return;
    }
    this.locationTab?.toggleAddRow();
  }

  openImportModal(): void {
    this.showImportModal = true;
  }

  closeImportModal(): void {
    this.showImportModal = false;
  }

  handleImport(data: { file: File | null; type: 'append' | 'replace' }): void {
    if (!data.file) {
      alert('Please select a file to import.');
      this.showImportModal = false;
      return;
    }

    this.costLocationService.importLocations(data.file, data.type).subscribe({
      next: (res) => {
        alert(res?.message || 'Import completed.');
        if (this.activeTab === 'location-specific') {
          this.locationTab?.reloadData();
        } else if (this.activeTab === 'project-specific') {
          this.projectTab?.reloadData();
        }
        this.showImportModal = false;
      },
      error: (err) => {
        console.error(err);
        alert(err?.error?.message || 'Import failed.');
        this.showImportModal = false;
      }
    });
  }

  openFilterSidebar(): void {
    this.isFilterSidebarOpen = true;
  }

  closeFilterSidebar(): void {
    this.isFilterSidebarOpen = false;
  }

  clearSidebarFilters(): void {
    const state = this.filterStates[this.activeTab];
    state.selectedYear = 'All';
    state.selectedLocation = 'All';
    state.selectedVendor = 'All';
    state.selectedCategory = '';
    state.selectedSubCategory = '';
    state.selectedItemName = '';
    state.selectedKeyword = '';
    state.selectedUoms = [];
    state.uomMode = 'set';
    state.projectType = 'within';
    state.minRate = 1000;
    state.maxRate = 1000000;
  }

  toggleUom(uom: string): void {
    const idx = this.selectedUoms.indexOf(uom);
    if (idx === -1) {
      this.selectedUoms = [...this.selectedUoms, uom];
    } else {
      this.selectedUoms = this.selectedUoms.filter(u => u !== uom);
    }
  }

  private createDefaultFilterState(): TabFilterState {
    return {
      selectedYear: 'All',
      selectedLocation: 'All',
      selectedVendor: 'All',
      selectedCategory: 'All',
      selectedSubCategory: '',
      selectedItemName: '',
      selectedKeyword: '',
      uomMode: 'set',
      selectedUoms: [],
      projectType: 'within',
      minRate: 1000,
      maxRate: 1000000,
      appliedYear: '',
      appliedLocation: '',
      appliedVendor: '',
      appliedCategory: '',
      appliedKeyword: ''
    };
  }

  deleteSelectedRows(): void {
    if (this.activeTab === 'raw-material') {
      this.rawTab?.deleteSelectedRows();
      return;
    }
    if (this.activeTab === 'project-specific') {
      this.projectTab?.deleteSelectedRows();
      return;
    }
    this.locationTab?.deleteSelectedRows();
  }

  editSelectedRows(): void {
    if (this.activeTab === 'raw-material') {
      this.rawTab?.editSelectedRows?.();
      return;
    }
    if (this.activeTab === 'project-specific') {
      this.projectTab?.editSelectedRows?.();
      return;
    }
    this.locationTab?.editSelectedRows?.();
  }

  saveActiveTab(): void {
    if (this.activeTab === 'raw-material') {
      this.rawTab?.saveActive();
      return;
    }
    if (this.activeTab === 'project-specific') {
      this.projectTab?.saveActive();
      return;
    }
    this.locationTab?.saveActive();
  }

  exportActiveTab(): void {
    if (this.activeTab === 'location-specific') {
      this.locationTab?.exportData();
      return;
    }
    if (this.activeTab === 'project-specific') {
      this.projectTab?.exportData();
      return;
    }
    alert('Export is currently not enabled for Raw Material Database.');
  }
}
