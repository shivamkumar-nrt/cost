import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'cost-database', pathMatch: 'full' },
  {
    path: 'cost-database',
    loadChildren: () =>
      import('./modules/cost-database/cost-database.module').then(
        (m) => m.CostDatabaseModule
      )
  },
  {
    path: 'master-sheet',
    loadChildren: () =>
      import('./modules/master-sheet/master-sheet.module').then(
        (m) => m.MasterSheetModule
      )
  },
  { path: '**', redirectTo: 'cost-database' }
];
