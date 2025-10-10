import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModifyEmpleadoComponent } from './modify-empleado.component';

describe('ModifyEmpleadoComponent', () => {
  let component: ModifyEmpleadoComponent;
  let fixture: ComponentFixture<ModifyEmpleadoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModifyEmpleadoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModifyEmpleadoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
