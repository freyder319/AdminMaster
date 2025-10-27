import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddVentaLibreComponent } from './add-venta-libre.component';

describe('AddVentaLibreComponent', () => {
  let component: AddVentaLibreComponent;
  let fixture: ComponentFixture<AddVentaLibreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddVentaLibreComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddVentaLibreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
