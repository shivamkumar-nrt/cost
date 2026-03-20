import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasterSheetComponent } from './master-sheet.component';

describe('MasterSheetComponent', () => {
  let component: MasterSheetComponent;
  let fixture: ComponentFixture<MasterSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasterSheetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MasterSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
