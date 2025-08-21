import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeroButtonComponent } from './hero-button.component';

describe('HeroButtonComponent', () => {
  let component: HeroButtonComponent;
  let fixture: ComponentFixture<HeroButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeroButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
