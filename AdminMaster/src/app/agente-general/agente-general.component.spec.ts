import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgenteGeneralComponent } from './agente-general.component';

describe('AgenteGeneralComponent', () => {
  let component: AgenteGeneralComponent;
  let fixture: ComponentFixture<AgenteGeneralComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgenteGeneralComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgenteGeneralComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
