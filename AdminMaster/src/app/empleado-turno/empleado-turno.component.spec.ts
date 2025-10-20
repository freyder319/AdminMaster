import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmpleadoTurnoComponent } from './empleado-turno.component';

describe('EmpleadoTurnoComponent', () => {
  let component: EmpleadoTurnoComponent;
  let fixture: ComponentFixture<EmpleadoTurnoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmpleadoTurnoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmpleadoTurnoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
