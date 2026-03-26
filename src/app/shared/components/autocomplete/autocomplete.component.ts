import { Component, Input, forwardRef, ElementRef, HostListener, ViewChild, OnInit, OnChanges, OnDestroy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './autocomplete.component.html',
  styleUrl: './autocomplete.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AutocompleteComponent),
      multi: true
    }
  ]
})
export class AutocompleteComponent implements ControlValueAccessor, OnInit, OnChanges, OnDestroy {
  @Input() label = '';
  @Input() placeholder = 'Select an option';
  @Input() options: any[] = [];
  @Input() displayKey = 'name'; // For object options
  @Input() valueKey = 'id';      // For object options
  @Input() width = 'auto';
  @Input() height = 'auto';
  @Input() errorMessage = '';
  @Input() disabled = false;

  @ViewChild('inputField') inputField?: ElementRef;
  @ViewChild('dropdownList') dropdownList?: ElementRef;

  value: any = '';
  searchQuery = '';
  isOpen = false;
  filteredOptions: any[] = [];
  public dropdownTop = '0px';
  public dropdownLeft = '0px';
  public dropdownWidth = '0px';
  private scrollParent?: HTMLElement | null;
  private readonly onScrollBound = () => this.updateDropdownPosition();

  onChange: any = () => {};
  onTouched: any = () => {};

  ngOnInit() {
    this.filteredOptions = this.options;
  }

  ngOnChanges() {
    this.filterOptions();
  }

  toggleDropdown() {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.filterOptions();
      this.bindScroll();
      this.updateDropdownPosition();
    } else {
      this.unbindScroll();
    }
  }

  filterOptions() {
    const query = this.searchQuery.toLowerCase().trim();
    this.filteredOptions = this.options.filter(option => {
      const text = this.getOptionDisplay(option).toLowerCase();
      return text.includes(query);
    });
  }

  selectOption(option: any) {
    this.value = this.getOptionValue(option);
    this.searchQuery = this.getOptionDisplay(option);
    this.isOpen = false;
    this.unbindScroll();
    this.onChange(this.value);
    this.onTouched();
  }

  getOptionDisplay(option: any): string {
    if (typeof option === 'object' && option !== null) {
      return option[this.displayKey] || '';
    }
    return String(option);
  }

  getOptionValue(option: any): any {
    if (typeof option === 'object' && option !== null) {
      return this.valueKey ? option[this.valueKey] : option;
    }
    return option;
  }

  // ControlValueAccessor methods
  writeValue(value: any): void {
    this.value = value;
    // Find display text for the value
    const selected = this.options.find(opt => this.getOptionValue(opt) === value);
    this.searchQuery = selected ? this.getOptionDisplay(selected) : (value || '');
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as Node;
    const inputContains = this.inputField?.nativeElement.contains(target);
    const dropdownContains = this.dropdownList?.nativeElement.contains(target);
    if (!inputContains && !dropdownContains) {
      this.isOpen = false;
      this.unbindScroll();
    }
  }

  onInputFocus() {
    this.isOpen = true;
    this.bindScroll();
    this.updateDropdownPosition();
    this.onTouched();
  }

  @HostListener('window:resize')
  onWindowResize() {
    if (this.isOpen) {
      this.updateDropdownPosition();
    }
  }

  ngOnDestroy(): void {
    this.unbindScroll();
  }

  private updateDropdownPosition(): void {
    const inputEl = this.inputField?.nativeElement as HTMLElement | undefined;
    if (!inputEl) return;
    const rect = inputEl.getBoundingClientRect();
    this.dropdownTop = `${rect.bottom + 4}px`;
    this.dropdownLeft = `${rect.left}px`;
    this.dropdownWidth = `${rect.width}px`;
  }

  private bindScroll(): void {
    if (this.scrollParent) return;
    const inputEl = this.inputField?.nativeElement as HTMLElement | undefined;
    this.scrollParent = inputEl?.closest('.table-scroll');
    if (this.scrollParent) {
      this.scrollParent.addEventListener('scroll', this.onScrollBound, { passive: true });
    }
  }

  private unbindScroll(): void {
    if (this.scrollParent) {
      this.scrollParent.removeEventListener('scroll', this.onScrollBound);
      this.scrollParent = null;
    }
  }

}
