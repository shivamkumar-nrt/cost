import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MasterSheetComponent } from './master-sheet.component';

const routes: Routes = [{ path: '', component: MasterSheetComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MasterSheetRoutingModule { }
