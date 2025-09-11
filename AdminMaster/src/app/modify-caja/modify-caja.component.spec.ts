import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModifyCajaComponent } from './modify-caja.component';

describe('ModifyCajaComponent', () => {
  let component: ModifyCajaComponent;
  let fixture: ComponentFixture<ModifyCajaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModifyCajaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModifyCajaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
