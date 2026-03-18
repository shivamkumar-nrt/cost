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
  selectedKeyword = '';
  appliedYear = '';
  appliedLocation = '';
  appliedVendor = '';
  appliedCategory = '';
  appliedKeyword = '';
  activeTab: TabKey = 'location-specific';
  sortDirection: SortDirection = 'asc';
  filterToken = 0;
  sortToken = 0;
  isFilterSidebarOpen = false;

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
      this.rawTab?.addFromInput();
      return;
    }
    if (this.activeTab === 'project-specific') {
      this.projectTab?.addFromInput();
      return;
    }
    this.locationTab?.addFromInput();
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
    this.selectedCategory = 'All';
    this.selectedKeyword = '';
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
