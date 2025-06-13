import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewGroupDialogComponent } from './new-group-dialog.component';

describe('NewGroupDialogComponent', () => {
  let component: NewGroupDialogComponent;
  let fixture: ComponentFixture<NewGroupDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewGroupDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewGroupDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
