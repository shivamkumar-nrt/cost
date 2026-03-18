import { Component, ViewChild } from '@angular/core';
import { LocationSpecificDatabaseComponent } from './location-specific-database.component';
import { ProjectSpecificDatabaseComponent } from './project-specific-database.component';
import { RawMaterialDatabaseComponent } from './raw-material-database.component';

type TabKey = 'raw-material' | 'location-specific' | 'project-specific';
type SortDirection = 'asc' | 'desc';

interface Category {
  id: number;
  name: string;
}

@Component({
  selector: 'app-cost-database',
  standalone: false,
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

  selectedYear = 'All';
  selectedLocation = 'All';
  selectedVendor = 'All';
  selectedCategory = 'All';
  selectedSubCategory = '';
  selectedItemName = '';
  selectedKeyword = '';
  uomMode: 'set' | 'no' = 'set';
  selectedUoms: string[] = [];
  projectType: 'within' | 'outside' = 'within';
  minRate = 1000;
  maxRate = 1000000;

  appliedYear = '';
  appliedLocation = '';
  appliedVendor = '';
  appliedCategory = '';
  appliedKeyword = '';
  appliedMinRate = 1000;
  appliedMaxRate = 1000000;
  activeTab: TabKey = 'location-specific';
  sortDirection: SortDirection = 'asc';
  filterToken = 0;
  sortToken = 0;
  isFilterSidebarOpen = false;
  showImportModal = false;

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
    this.appliedYear = this.selectedYear === 'All' ? '' : this.selectedYear;
    this.appliedLocation = this.selectedLocation === 'All' ? '' : this.selectedLocation;
    this.appliedVendor = this.selectedVendor === 'All' ? '' : this.selectedVendor;
    this.appliedCategory = this.selectedCategory === 'All' ? '' : this.selectedCategory;
    this.appliedKeyword = this.selectedKeyword.trim();
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
    console.log('Import data:', data);
    // Placeholder for actual import logic
    // For now it just closes the modal
    this.showImportModal = false;
  }

  openFilterSidebar(): void {
    this.isFilterSidebarOpen = true;
  }

  closeFilterSidebar(): void {
    this.isFilterSidebarOpen = false;
  }

  clearSidebarFilters(): void {
    this.selectedYear = 'All';
    this.selectedLocation = 'All';
    this.selectedVendor = 'All';
    this.selectedCategory = '';
    this.selectedSubCategory = '';
    this.selectedItemName = '';
    this.selectedKeyword = '';
    this.selectedUoms = [];
    this.uomMode = 'set';
    this.projectType = 'within';
    this.minRate = 1000;
  }

  toggleUom(uom: string): void {
    const idx = this.selectedUoms.indexOf(uom);
    if (idx === -1) {
      this.selectedUoms = [...this.selectedUoms, uom];
    } else {
      this.selectedUoms = this.selectedUoms.filter(u => u !== uom);
    }
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
}
