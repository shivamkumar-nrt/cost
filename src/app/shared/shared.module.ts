import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutocompleteComponent } from './components/autocomplete/autocomplete.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    AutocompleteComponent
  ],
  exports: [
    AutocompleteComponent
  ]
})
export class SharedModule {}
