import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CostDatabaseRoutingModule } from './cost-database-routing.module';
import { CostDatabaseComponent } from './cost-database.component';
import { RawMaterialDatabaseComponent } from './raw-material-database.component';
import { LocationSpecificDatabaseComponent } from './location-specific-database.component';
import { ProjectSpecificDatabaseComponent } from './project-specific-database.component';

@NgModule({
  declarations: [
    CostDatabaseComponent,
    RawMaterialDatabaseComponent,
    LocationSpecificDatabaseComponent,
    ProjectSpecificDatabaseComponent
  ],
  imports: [CommonModule, FormsModule, RouterModule, CostDatabaseRoutingModule]
})
export class CostDatabaseModule {}
