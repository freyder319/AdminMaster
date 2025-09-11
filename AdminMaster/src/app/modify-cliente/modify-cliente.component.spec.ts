import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModifyClienteComponent } from './modify-cliente.component';

describe('ModifyClienteComponent', () => {
  let component: ModifyClienteComponent;
  let fixture: ComponentFixture<ModifyClienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModifyClienteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModifyClienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
