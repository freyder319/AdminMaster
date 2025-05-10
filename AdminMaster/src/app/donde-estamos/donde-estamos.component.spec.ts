import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DondeEstamosComponent } from './donde-estamos.component';

describe('DondeEstamosComponent', () => {
  let component: DondeEstamosComponent;
  let fixture: ComponentFixture<DondeEstamosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DondeEstamosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DondeEstamosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
