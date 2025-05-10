import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdministradorPrincipalComponent } from './admin-principal.component';

describe('AdministradorPrincipalComponent', () => {
  let component: AdministradorPrincipalComponent;
  let fixture: ComponentFixture<AdministradorPrincipalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdministradorPrincipalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdministradorPrincipalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
