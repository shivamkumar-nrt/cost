import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocationSpecificDatabaseComponent } from './location-specific-database.component';
import { ProjectSpecificDatabaseComponent } from './project-specific-database.component';
import { RawMaterialDatabaseComponent } from './raw-material-database.component';
import { CostLocationService } from '../../core/services/cost-location.service';
import { CatalogService, HierarchyCategory } from '../../core/services/catalog.service';
import { ProjectDbService } from '../../core/services/project-db.service';
import { AutocompleteComponent } from '../../shared/components/autocomplete/autocomplete.component';
import { ImportModalComponent } from './import-modal.component';
import { MultiYearSelectorComponent } from '../../shared/components/multi-year-selector/multi-year-selector.component';
import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';

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
  selectedProject: string;
  selectedType: string;
  selectedItem: string;
  selectedFromDate: string;
  selectedToDate: string;
  selectedSector: string;
  selectedMoc: string;
  selectedUnit: string;
  selectedItemDescriptionLike: string;
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
  appliedProject: string;
  appliedSubCategory: string;
  appliedItemName: string;
  appliedType: string;
  appliedItem: string;
  appliedFromDate: string;
  appliedToDate: string;
  appliedSector: string;
  appliedMoc: string;
  appliedUnit: string;
  appliedItemDescriptionLike: string;
}

@Component({
  selector: 'app-cost-database',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AutocompleteComponent,
    ImportModalComponent,
    MultiYearSelectorComponent,
    ConfirmationModalComponent,
    RawMaterialDatabaseComponent,
    LocationSpecificDatabaseComponent,
    ProjectSpecificDatabaseComponent
  ],
  templateUrl: './cost-database.component.html',
  styleUrl: './cost-database.component.css'
})
export class CostDatabaseComponent implements OnInit {
  @ViewChild('rawTab') rawTab?: RawMaterialDatabaseComponent;
  @ViewChild('locationTab') locationTab?: LocationSpecificDatabaseComponent;
  @ViewChild('projectTab') projectTab?: ProjectSpecificDatabaseComponent;
  readonly financialYears = ['All', '2024 - 2025', '2025 - 2026'];
  readonly locations = ['All', 'BLR', 'MUM', 'DEL'];
  readonly vendors = ['All', 'Blue Star Limited (R 3)', 'ABC Vendor Pvt Ltd', 'Project Sunrise'];

  activeTab: TabKey = 'raw-material';
  sortDirection: SortDirection = 'asc';
  filterToken = 0;
  sortToken = 0;
  isFilterSidebarOpen = false;
  showImportModal = false;
  showDeleteConfirm = false;

  filterStates: Record<TabKey, TabFilterState> = {
    'raw-material': this.createDefaultFilterState(),
    'location-specific': this.createDefaultFilterState(),
    'project-specific': this.createDefaultFilterState()
  };

  categoryOptions: string[] = ['All'];
  subCategories: string[] = ['All'];
  itemNames: string[] = ['All'];
  typeOptions: string[] = ['All'];
  itemOptions: string[] = ['All'];
  uomOptions: string[] = [];
  catalog: HierarchyCategory[] = [];

  locationSectors: string[] = [];
  locationProjects: string[] = [];
  locationMocs: string[] = [];
  locationUnits: string[] = [];
  locationItemDescriptions: string[] = [];

  projectSectors: string[] = [];
  projectProjects: string[] = [];
  projectMocs: string[] = [];
  projectUnits: string[] = [];
  projectItemDescriptions: string[] = [];

  constructor(
    private costLocationService: CostLocationService,
    private catalogService: CatalogService,
    private projectDbService: ProjectDbService
  ) {}

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

  get selectedProject(): string {
    return this.filterStates[this.activeTab].selectedProject;
  }
  set selectedProject(value: string) {
    this.filterStates[this.activeTab].selectedProject = value;
  }

  get selectedType(): string {
    return this.filterStates[this.activeTab].selectedType;
  }
  set selectedType(value: string) {
    this.filterStates[this.activeTab].selectedType = value;
  }

  get selectedItem(): string {
    return this.filterStates[this.activeTab].selectedItem;
  }
  set selectedItem(value: string) {
    this.filterStates[this.activeTab].selectedItem = value;
  }

  get selectedFromDate(): string {
    return this.filterStates[this.activeTab].selectedFromDate;
  }
  set selectedFromDate(value: string) {
    this.filterStates[this.activeTab].selectedFromDate = value;
  }

  get selectedToDate(): string {
    return this.filterStates[this.activeTab].selectedToDate;
  }
  set selectedToDate(value: string) {
    this.filterStates[this.activeTab].selectedToDate = value;
  }

  get selectedSector(): string {
    return this.filterStates[this.activeTab].selectedSector;
  }
  set selectedSector(value: string) {
    this.filterStates[this.activeTab].selectedSector = value;
  }

  get selectedMoc(): string {
    return this.filterStates[this.activeTab].selectedMoc;
  }
  set selectedMoc(value: string) {
    this.filterStates[this.activeTab].selectedMoc = value;
  }

  get selectedUnit(): string {
    return this.filterStates[this.activeTab].selectedUnit;
  }
  set selectedUnit(value: string) {
    this.filterStates[this.activeTab].selectedUnit = value;
  }

  get selectedItemDescriptionLike(): string {
    return this.filterStates[this.activeTab].selectedItemDescriptionLike;
  }
  set selectedItemDescriptionLike(value: string) {
    this.filterStates[this.activeTab].selectedItemDescriptionLike = value;
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

  ngOnInit(): void {
    this.loadCatalogOptions();
    this.loadLocationFilterOptions();
    this.loadProjectFilterOptions();
  }

  updateFilters(): void {
    const state = this.filterStates[this.activeTab];
    state.appliedYear = state.selectedYear === 'All' ? '' : state.selectedYear;
    state.appliedLocation = state.selectedLocation === 'All' ? '' : state.selectedLocation;
    state.appliedVendor = state.selectedVendor === 'All' ? '' : state.selectedVendor;
    state.appliedCategory = state.selectedCategory === 'All' ? '' : state.selectedCategory;
    state.appliedKeyword = state.selectedKeyword.trim();
    state.appliedProject = state.selectedProject.trim();
    state.appliedSubCategory = state.selectedSubCategory.trim();
    state.appliedItemName = state.selectedItemName.trim();
    state.appliedType = state.selectedType.trim();
    state.appliedItem = state.selectedItem.trim();
    state.appliedFromDate = state.selectedFromDate;
    state.appliedToDate = state.selectedToDate;
    state.appliedSector = state.selectedSector.trim();
    state.appliedMoc = state.selectedMoc.trim();
    state.appliedUnit = state.selectedUnit.trim();
    state.appliedItemDescriptionLike = state.selectedItemDescriptionLike.trim();
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
    state.selectedProject = '';
    state.selectedType = '';
    state.selectedItem = '';
    state.selectedFromDate = '';
    state.selectedToDate = '';
    state.selectedSector = '';
    state.selectedMoc = '';
    state.selectedUnit = '';
    state.selectedItemDescriptionLike = '';
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
      selectedProject: '',
      selectedType: '',
      selectedItem: '',
      selectedFromDate: '',
      selectedToDate: '',
      selectedSector: '',
      selectedMoc: '',
      selectedUnit: '',
      selectedItemDescriptionLike: '',
      uomMode: 'set',
      selectedUoms: [],
      projectType: 'within',
      minRate: 1000,
      maxRate: 1000000,
      appliedYear: '',
      appliedLocation: '',
      appliedVendor: '',
      appliedCategory: '',
      appliedKeyword: '',
      appliedProject: '',
      appliedSubCategory: '',
      appliedItemName: '',
      appliedType: '',
      appliedItem: '',
      appliedFromDate: '',
      appliedToDate: '',
      appliedSector: '',
      appliedMoc: '',
      appliedUnit: '',
      appliedItemDescriptionLike: ''
    };
  }

  private loadCatalogOptions(): void {
    this.catalogService.getHierarchy().subscribe({
      next: (res) => {
        this.catalog = res?.payload || [];
        this.categoryOptions = ['All', ...this.catalog.map(c => c.name)];

        const subCategories = new Set<string>();
        const itemNames = new Set<string>();
        const typeNames = new Set<string>();
        const itemOptions = new Set<string>();
        const uoms = new Set<string>();

        this.catalog.forEach(cat => {
          (cat.subCategories || []).forEach(sub => {
            subCategories.add(sub.name);
            (sub.itemTypes || []).forEach(type => {
              typeNames.add(type.name);
              (type.items || []).forEach(item => {
                itemNames.add(item.name);
                itemOptions.add(item.name);
                if (item.uom) uoms.add(item.uom);
              });
            });
          });
        });

        this.subCategories = ['All', ...Array.from(subCategories)];
        this.itemNames = ['All', ...Array.from(itemNames)];
        this.typeOptions = ['All', ...Array.from(typeNames)];
        this.itemOptions = ['All', ...Array.from(itemOptions)];
        this.uomOptions = Array.from(uoms);
      },
      error: () => {
        this.catalog = [];
        this.categoryOptions = ['All'];
        this.subCategories = ['All'];
        this.itemNames = ['All'];
        this.typeOptions = ['All'];
        this.itemOptions = ['All'];
        this.uomOptions = [];
      }
    });
  }

  private loadLocationFilterOptions(): void {
    this.costLocationService.getLocationsPage(0, 200).subscribe({
      next: (res) => {
        const records = res?.content || [];
        this.locationSectors = this.unique(records.map(r => r.sector));
        this.locationProjects = this.unique(records.map(r => r.projectLocation));
        this.locationMocs = this.unique(records.map(r => r.moc));
        this.locationUnits = this.unique(records.map(r => r.unit));
        this.locationItemDescriptions = this.unique(records.map(r => r.itemDescription));
      },
      error: () => {
        this.locationSectors = [];
        this.locationProjects = [];
        this.locationMocs = [];
        this.locationUnits = [];
        this.locationItemDescriptions = [];
      }
    });
  }

  private loadProjectFilterOptions(): void {
    this.projectDbService.getProjectRecordsPage(0, 200).subscribe({
      next: (res) => {
        const records = res?.content || [];
        this.projectSectors = this.unique(records.map(r => r.sector));
        this.projectProjects = this.unique(records.map(r => r.projectLocation));
        this.projectMocs = this.unique(records.map(r => r.moc));
        this.projectUnits = this.unique(records.map(r => r.unit));
        this.projectItemDescriptions = this.unique(records.map(r => r.itemDescription));
      },
      error: () => {
        this.projectSectors = [];
        this.projectProjects = [];
        this.projectMocs = [];
        this.projectUnits = [];
        this.projectItemDescriptions = [];
      }
    });
  }

  private unique(values: Array<string | null | undefined>): string[] {
    return Array.from(new Set(values.filter(v => !!v).map(v => String(v))));
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

  openDeleteConfirm(): void {
    if (!this.hasSelectedRows()) {
      return;
    }
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm = false;
  }

  confirmDelete(): void {
    this.deleteSelectedRows();
    this.showDeleteConfirm = false;
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

  hasSelectedRows(): boolean {
    if (this.activeTab === 'raw-material') {
      return this.rawTab?.hasSelectedRows() ?? false;
    }
    if (this.activeTab === 'project-specific') {
      return this.projectTab?.hasSelectedRows() ?? false;
    }
    return this.locationTab?.hasSelectedRows() ?? false;
  }
}
