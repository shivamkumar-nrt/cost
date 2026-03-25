import { Component, Input, forwardRef, ElementRef, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'app-multi-year-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiYearSelectorComponent),
      multi: true
    }
  ],
  template: `
    <div class="range-selector-wrapper">
      <div class="display-box" (mousedown)="toggle($event)">
        <span class="display-text">{{ displayValue || 'Select Year Range' }}</span>
        <span class="calendar-icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M12.6667 2.66667H3.33333C2.59695 2.66667 2 3.26362 2 4V13.3333C2 14.0697 2.59695 14.6667 3.33333 14.6667H12.6667C13.403 14.6667 14 14.0697 14 13.3333V4C14 3.26362 13.403 2.66667 12.6667 2.66667Z" stroke="#2563EB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10.6667 1.33333V4" stroke="#2563EB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M5.33333 1.33333V4" stroke="#2563EB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 6.66667H14" stroke="#2563EB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </div>

      <div class="dropdown-panel" *ngIf="isOpen" (mousedown)="$event.stopPropagation()">
        <div class="range-inputs">
          <div class="year-col">
            <label>From</label>
            <select [(ngModel)]="startYear" (change)="onRangeChange()">
              <option value="">Start</option>
              <option *ngFor="let y of yearsOnly" [value]="y">{{ y }}</option>
            </select>
          </div>
          <div class="separator">-</div>
          <div class="year-col">
            <label>To</label>
            <select [(ngModel)]="endYear" (change)="onRangeChange()">
              <option value="">End</option>
              <option *ngFor="let y of endYearOptions" [value]="y">{{ y }}</option>
            </select>
          </div>
        </div>
        <div class="panel-footer">
          <button type="button" class="apply-btn" (click)="close()">Apply</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .range-selector-wrapper {
      position: relative;
      width: 100%;
      min-width: 160px;
      font-family: inherit;
    }
    .display-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 32px;
      padding: 0 10px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .display-box:hover {
      border-color: #2563eb;
      background: #fff;
    }
    .display-text {
      font-size: 12px;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .calendar-icon {
      display: flex;
      align-items: center;
      margin-left: 8px;
    }
    .dropdown-panel {
      position: absolute;
      top: 100%;
      left: 0;
      margin-top: 6px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      z-index: 999999;
      padding: 16px;
      width: 250px;
    }
    .range-inputs {
      display: flex;
      align-items: flex-end;
      gap: 10px;
      margin-bottom: 16px;
    }
    .year-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .year-col label {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }
    .year-col select {
      height: 32px;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 0 5px;
      font-size: 12px;
      width: 100%;
      outline: none;
    }
    .separator {
      padding-bottom: 8px;
      color: #94a3b8;
      font-weight: bold;
    }
    .panel-footer {
      display: flex;
      justify-content: flex-end;
    }
    .apply-btn {
      background: #2563eb;
      color: #fff;
      border: none;
      padding: 6px 16px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .apply-btn:hover {
      background: #1d4ed8;
    }
  `]
})
export class MultiYearSelectorComponent implements OnInit, ControlValueAccessor {
  @Input() multiple = true;
  
  yearsOnly: number[] = [];
  startYear: string = '';
  endYear: string = '';
  displayValue: string = '';
  isOpen = false;

  onChange: any = () => {};
  onTouch: any = () => {};

  constructor(private eRef: ElementRef) { }

  ngOnInit() {
    this.generateYears();
  }

  generateYears() {
    const currentYear = new Date().getFullYear();
    for (let i = 2002; i <= currentYear + 5; i++) {
      this.yearsOnly.push(i);
    }
  }

  get endYearOptions() {
    if (!this.startYear) return this.yearsOnly;
    return this.yearsOnly.filter(y => y >= parseInt(this.startYear));
  }

  toggle(e: MouseEvent) {
    e.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  close() {
    this.isOpen = false;
    this.onChange(this.displayValue);
    this.onTouch();
  }

  onRangeChange() {
    if (this.startYear && this.endYear) {
      if (parseInt(this.endYear) < parseInt(this.startYear)) {
        this.endYear = this.startYear;
      }
      this.displayValue = `${this.startYear}-${this.endYear}`;
    } else if (this.startYear) {
      this.displayValue = this.startYear;
    } else if (this.endYear) {
      this.displayValue = this.endYear;
    } else {
      this.displayValue = '';
    }
    this.onChange(this.displayValue);
  }

  @HostListener('document:mousedown', ['$event'])
  clickout(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  writeValue(val: any): void {
    if (!val) {
      this.startYear = '';
      this.endYear = '';
      this.displayValue = '';
      return;
    }

    if (typeof val === 'string') {
      this.displayValue = val;
      if (val.includes('-')) {
        const parts = val.split('-').map(p => p.trim());
        this.startYear = parts[0];
        this.endYear = parts[1];
      } else {
        this.startYear = val;
        this.endYear = '';
      }
    }
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouch = fn; }
}
