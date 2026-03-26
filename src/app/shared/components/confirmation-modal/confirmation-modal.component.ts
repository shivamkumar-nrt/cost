import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="confirm-overlay" *ngIf="show">
      <div class="confirm-card" role="dialog" aria-modal="true">
        <div class="confirm-header">
          <h5 class="confirm-title">{{ title }}</h5>
          <button type="button" class="close-btn" (click)="onCancel()" aria-label="Close">×</button>
        </div>
        <div class="confirm-body">
          <p class="confirm-message">{{ message }}</p>
        </div>
        <div class="confirm-footer">
          <button type="button" class="btn-secondary" (click)="onCancel()">No</button>
          <button type="button" class="btn-danger" (click)="onConfirm()">Yes, Delete</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirm-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 3000;
    }
    .confirm-card {
      background: #fff;
      width: min(520px, 92vw);
      border-radius: 14px;
      box-shadow: 0 24px 60px rgba(15, 23, 42, 0.25);
      overflow: hidden;
    }
    .confirm-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #e2e8f0;
    }
    .confirm-title {
      font-weight: 600;
      color: #0f172a;
      font-size: 18px;
      margin: 0;
    }
    .close-btn {
      border: none;
      background: transparent;
      font-size: 22px;
      line-height: 1;
      color: #64748b;
      cursor: pointer;
    }
    .confirm-body {
      padding: 18px 20px 10px;
    }
    .confirm-message {
      margin: 0;
      color: #475569;
      font-size: 14px;
    }
    .confirm-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 12px 20px 18px;
    }
    .btn-secondary {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      color: #334155;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-secondary:hover {
      background: #f1f5f9;
    }
    .btn-danger {
      border: none;
      background: #dc2626;
      color: #fff;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-danger:hover {
      background: #b91c1c;
    }
  `]
})
export class ConfirmationModalComponent {
  @Input() show = false;
  @Input() title = 'Confirm Deletion';
  @Input() message = 'Are you sure you want to delete the selected items?';
  
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
