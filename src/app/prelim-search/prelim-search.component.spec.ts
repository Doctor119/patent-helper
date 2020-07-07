import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PrelimSearchComponent } from './prelim-search.component';

describe('PrelimSearchComponent', () => {
  let component: PrelimSearchComponent;
  let fixture: ComponentFixture<PrelimSearchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PrelimSearchComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrelimSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
