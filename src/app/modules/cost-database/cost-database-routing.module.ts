import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CostDatabaseComponent } from './cost-database.component';

const routes: Routes = [
  { path: '', component: CostDatabaseComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CostDatabaseRoutingModule {}
