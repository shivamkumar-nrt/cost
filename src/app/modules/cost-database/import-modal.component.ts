import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-import-modal',
  standalone: false,
  templateUrl: './import-modal.component.html',
  styleUrls: ['./import-modal.component.css']
})
export class ImportModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() upload = new EventEmitter<{ file: File | null; type: 'append' | 'replace' }>();

  selectedFile: File | null = null;
  fileName: string = '';
  insertType: 'append' | 'replace' = 'append';

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.fileName = file.name;
    }
  }

  onCancel(): void {
    this.close.emit();
  }

  onUpload(): void {
    this.upload.emit({
      file: this.selectedFile,
      type: this.insertType
    });
    this.close.emit();
  }

  onClose(): void {
    this.close.emit();
  }
}
