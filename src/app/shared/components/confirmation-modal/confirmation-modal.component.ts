import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal fade" [class.show]="show" [style.display]="show ? 'block' : 'none'" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content border-0 shadow">
          <div class="modal-header bg-light">
            <h5 class="modal-title">{{ title }}</h5>
            <button type="button" class="btn-close" (click)="onCancel()" aria-label="Close"></button>
          </div>
          <div class="modal-body py-4">
            <p class="mb-0 text-secondary" style="font-size: 15px;">{{ message }}</p>
          </div>
          <div class="modal-footer bg-light border-0">
            <button type="button" class="btn btn-secondary px-4 py-2" (click)="onCancel()" style="font-size: 14px; font-weight: 500;">No</button>
            <button type="button" class="btn btn-danger px-4 py-2" (click)="onConfirm()" style="font-size: 14px; font-weight: 500;">Yes, Delete</button>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade show" *ngIf="show"></div>
    </div>
  `,
  styles: [`
    .modal.show {
      background: rgba(0, 0, 0, 0.4);
    }
    .modal-content {
      border-radius: 12px;
      overflow: hidden;
    }
    .modal-header {
      border-bottom: 1px solid #edf2f7;
      padding: 16px 20px;
    }
    .modal-title {
      font-weight: 600;
      color: #1a202c;
      font-size: 18px;
    }
    .modal-footer {
      padding: 12px 20px;
    }
    .btn-danger {
      background-color: #e53e3e;
      border-color: #e53e3e;
    }
    .btn-danger:hover {
      background-color: #c53030;
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
