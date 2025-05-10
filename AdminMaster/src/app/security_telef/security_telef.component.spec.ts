import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityTelefComponent } from './security_telef.component';

describe('SecurityTelefComponent', () => {
  let component: SecurityTelefComponent;
  let fixture: ComponentFixture<SecurityTelefComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecurityTelefComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecurityTelefComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
