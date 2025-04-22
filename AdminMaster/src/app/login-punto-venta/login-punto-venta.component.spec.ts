import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginPuntoVentaComponent } from './login-punto-venta.component';

describe('LoginPuntoVentaComponent', () => {
  let component: LoginPuntoVentaComponent;
  let fixture: ComponentFixture<LoginPuntoVentaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPuntoVentaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginPuntoVentaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
