import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleTurnoCerradoComponent } from './detalle-turno-cerrado.component';

describe('DetalleTurnoCerradoComponent', () => {
  let component: DetalleTurnoCerradoComponent;
  let fixture: ComponentFixture<DetalleTurnoCerradoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleTurnoCerradoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetalleTurnoCerradoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
