import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FabricjsEditorComponent, DEFAULT_CANVAS_WIDTH } from './angular-editor-fabric-js.component';

fdescribe('FabricjsLibraryComponent', () => {
  let component: FabricjsEditorComponent;
  let fixture: ComponentFixture<FabricjsEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FabricjsEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FabricjsEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('SHOULD have the expected default width', () => {
    const canvas = getCanvas();
    expect(canvas.width).toBe(DEFAULT_CANVAS_WIDTH);
  });

  function getCanvas() {
    return fixture.debugElement.nativeElement.querySelector('#canvas');
  }
});
