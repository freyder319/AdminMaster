import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AgenteIAComponent } from './agente-ia.component';

describe('AgenteIAComponent', () => {
  let component: AgenteIAComponent;
  let fixture: ComponentFixture<AgenteIAComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgenteIAComponent, HttpClientTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgenteIAComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
