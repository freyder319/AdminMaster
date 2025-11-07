import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoGastosComponent } from './info-gastos.component';

describe('InfoGastosComponent', () => {
  let component: InfoGastosComponent;
  let fixture: ComponentFixture<InfoGastosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfoGastosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfoGastosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
