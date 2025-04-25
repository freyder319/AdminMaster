import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCajasComponent } from './add-cajas.component';

describe('AddCajasComponent', () => {
  let component: AddCajasComponent;
  let fixture: ComponentFixture<AddCajasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCajasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddCajasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
