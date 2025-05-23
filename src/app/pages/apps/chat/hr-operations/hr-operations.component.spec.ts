import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrOperationsComponent } from './hr-operations.component';

describe('HrOperationsComponent', () => {
  let component: HrOperationsComponent;
  let fixture: ComponentFixture<HrOperationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HrOperationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HrOperationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
