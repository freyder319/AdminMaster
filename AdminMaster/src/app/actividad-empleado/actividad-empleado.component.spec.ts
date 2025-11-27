import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActividadEmpleadoComponent } from './actividad-empleado.component';

describe('ActividadEmpleadoComponent', () => {
  let component: ActividadEmpleadoComponent;
  let fixture: ComponentFixture<ActividadEmpleadoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActividadEmpleadoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActividadEmpleadoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
