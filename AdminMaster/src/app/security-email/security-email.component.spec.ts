import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityEmailComponent } from './security-email.component';

describe('SecurityEmailComponent', () => {
  let component: SecurityEmailComponent;
  let fixture: ComponentFixture<SecurityEmailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecurityEmailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecurityEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
