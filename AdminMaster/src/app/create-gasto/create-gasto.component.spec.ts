import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateGastoComponent } from './create-gasto.component';

describe('CreateGastoComponent', () => {
  let component: CreateGastoComponent;
  let fixture: ComponentFixture<CreateGastoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateGastoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateGastoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
