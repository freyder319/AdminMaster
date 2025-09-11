import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModifyProveedorComponent } from './modify-proveedor.component';

describe('ModifyProveedorComponent', () => {
  let component: ModifyProveedorComponent;
  let fixture: ComponentFixture<ModifyProveedorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModifyProveedorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModifyProveedorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
