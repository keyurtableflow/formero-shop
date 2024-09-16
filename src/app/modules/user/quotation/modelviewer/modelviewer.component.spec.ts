import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelviewerComponent } from './modelviewer.component';

describe('ModelviewerComponent', () => {
  let component: ModelviewerComponent;
  let fixture: ComponentFixture<ModelviewerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ModelviewerComponent]
    });
    fixture = TestBed.createComponent(ModelviewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
