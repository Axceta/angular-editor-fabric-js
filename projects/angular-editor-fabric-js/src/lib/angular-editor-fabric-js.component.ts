import { Component, ViewChild, ElementRef, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { fabric } from 'fabric';

export const DEFAULT_CANVAS_WIDTH = 500;

@Component({
  selector: 'angular-editor-fabric-js',
  templateUrl: './angular-editor-fabric-js.component.html',
  styleUrls: ['./angular-editor-fabric-js.component.css'],
})
export class FabricjsEditorComponent implements AfterViewInit {
  @ViewChild('htmlCanvas') private htmlCanvas: ElementRef;

  @Output() moving = new EventEmitter();
  @Output() modified = new EventEmitter();
  @Output() selection = new EventEmitter();
  @Output() cleared = new EventEmitter();

  public canvas: fabric.Canvas;
  public props = {
    canvasFill: '#ffffff',
    canvasImage: '',
    id: null,
    opacity: null,
    fill: null,
    fontSize: null,
    lineHeight: null,
    charSpacing: null,
    fontWeight: null,
    fontStyle: null,
    textAlign: null,
    fontFamily: null,
    TextDecoration: ''
  };

  public textString: string;
  public url: string | ArrayBuffer = '';
  public size: any = {
    width: DEFAULT_CANVAS_WIDTH,
    height: 800
  };

  public json: any;
  public textEditor = false;
  public figureEditor = false;
  public selected: any;

  constructor() { }

  ngAfterViewInit(): void {

    // setup front side canvas
    this.canvas = new fabric.Canvas(this.htmlCanvas.nativeElement, {
      hoverCursor: 'pointer',
      selection: true,
      selectionBorderColor: 'blue'
    });

    this.canvas.on({
      'object:moving': (e) => { this.moving.emit(e); },
      'object:modified': (e) => { this.modified.emit(e); },
      'object:selected': (e) => {
        this.selection.emit(e);

        const selectedObject = e.target;
        this.selected = selectedObject;
        selectedObject.hasRotatingPoint = true;
        selectedObject.transparentCorners = false;
        selectedObject.cornerColor = 'rgba(255, 87, 34, 0.7)';

        this.resetPanels();

        if (selectedObject.type !== 'group' && selectedObject) {

          this.getOpacity();

          switch (selectedObject.type) {
            case 'rect':
            case 'circle':
            case 'triangle':
              this.figureEditor = true;
              this.getFill();
              break;
            case 'i-text':
              this.textEditor = true;
              this.getLineHeight();
              this.getCharSpacing();
              this.getBold();
              this.getFill();
              this.getTextDecoration();
              this.getTextAlign();
              this.getFontFamily();
              break;
            case 'image':
              break;
          }
        }
      },
      'selection:cleared': (e) => {
        this.cleared.emit(e);
        this.selected = null;
        this.resetPanels();
      }
    });

    this.canvas.setWidth(this.size.width);
    this.canvas.setHeight(this.size.height);
  }


  /*------------------------Block elements------------------------*/

  /**
   * Subscribe to a FabricJS event. You can find the list of available events here: http://fabricjs.com/docs/fabric.Canvas.html
   * @param eventName The event name to listen to
   */
  public onEvent(eventName: string, callback: (event) => void) {
    this.canvas.on({[eventName]: callback});
  }

  // Block "Size"

  changeSize() {
    this.canvas.setWidth(this.size.width);
    this.canvas.setHeight(this.size.height);
  }

  // Block "Add text"

  addText() {
    if (this.textString) {
      const text = new fabric.IText(this.textString, {
        left: 10,
        top: 10,
        fontFamily: 'helvetica',
        angle: 0,
        fill: '#000000',
        scaleX: 0.5,
        scaleY: 0.5,
        fontWeight: '',
        hasRotatingPoint: true
      });

      this.extend(text, this.randomId());
      this.canvas.add(text);
      this.selectItemAfterAdded(text);
      this.textString = '';
    }
  }

  // Block "Add images"

  getImgPolaroid(event: any) {
    const el = event.target;
    fabric.loadSVGFromURL(el.src, (objects, options) => {
      const image = fabric.util.groupSVGElements(objects, options);
      image.set({
        left: 10,
        top: 10,
        angle: 0,
        padding: 10,
        cornerSize: 10,
        hasRotatingPoint: true,
      });
      this.extend(image, this.randomId());
      this.canvas.add(image);
      this.selectItemAfterAdded(image);
    });
  }

  // Block "Upload Image"

  addImageOnCanvas(url) {
    if (url) {
      fabric.Image.fromURL(url, (image) => {
        image.set({
          left: 10,
          top: 10,
          angle: 0,
          padding: 10,
          cornerSize: 10,
          hasRotatingPoint: true
        });
        image.scaleToWidth(200);
        image.scaleToHeight(200);
        this.extend(image, this.randomId());
        this.canvas.add(image);
        this.selectItemAfterAdded(image);
      });
    }
  }

  readUrl(event) {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        this.url = readerEvent.target.result;
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  }

  removeWhite(url) {
    this.url = '';
  }

  // Block "Add figure"

  /**
   * Add a figure to the canvas following the definition you provide.
   * If you passed a string to this function, please rename your implementation for addPredefinedFigure().
   * @param figure Your custom figure definition
   * @param id (Optional) The unique id you want to give to the figure. If no ID is specified a random one will be picked.
   * @returns The ID of the created figure
   */
  public addFigure(figure: fabric.Rect | fabric.Triangle | fabric.Circle | fabric.Object, id?: number): number {
    const figureId: number = id || this.randomId();

    this.extend(figure, figureId);
    this.canvas.add(figure);
    this.selectItemAfterAdded(figure);

    return figureId;
  }

  /**
   * Add a predefined figure to the canvas. If you want to create a custom figure, please use addFigure().
   * @param figure The name of the predefined figure. Can be one of the following: 'rectangle', 'square', 'triangle', 'circle'.
   * @param id (Optional) The unique id you want to give to the figure. If no ID is specified a random one will be picked.
   * @returns The ID of the created figure
   * TODO: Move to app.component
   */
  public addPredefinedFigure(figure: string, id?: number): number {
    let add: any;
    const figureId: number = id || this.randomId();

    switch (figure) {
      case 'rectangle':
        add = new fabric.Rect({
          width: 200, height: 100, left: 10, top: 10, angle: 0,
          fill: '#3f51b5'
        });
        break;
      case 'square':
        add = new fabric.Rect({
          width: 100, height: 100, left: 10, top: 10, angle: 0,
          fill: '#4caf50'
        });
        break;
      case 'triangle':
        add = new fabric.Triangle({
          width: 100, height: 100, left: 10, top: 10, fill: '#2196f3'
        });
        break;
      case 'circle':
        add = new fabric.Circle({
          radius: 50, left: 10, top: 10, fill: '#ff5722'
        });
        break;
    }

    return this.addFigure(add, figureId);
  }

  // TODO: Add copies of this for triangle and circle
  // TODO: Add JSdoc
  public addRect(options: fabric.IRectOptions, id?: number): number {
    let figure = new fabric.Rect(options);

    if (id) {
      figure = Object.assign(figure, { data: { id }});
    }

    return this.addFigure(figure, id);
  }

  /*Canvas*/

  cleanSelect() {
    this.canvas.discardActiveObject();
  }

  selectItemAfterAdded(obj) {
    this.canvas.discardActiveObject();
    this.canvas.setActiveObject(obj);
  }

  setCanvasFill() {
    if (!this.props.canvasImage) {
      this.canvas.backgroundColor = this.props.canvasFill;
      this.canvas.renderAll();
    }
  }

  extend(obj, id) {
    obj.toObject = ((toObject) => {
      return function() {
        return fabric.util.object.extend(toObject.call(this), {
          id
        });
      };
    })(obj.toObject);
  }

  setCanvasImage() {
    const self = this;
    if (this.props.canvasImage) {
      this.canvas.setBackgroundColor(new fabric.Pattern({ source: this.props.canvasImage, repeat: 'repeat' }), () => {
        self.props.canvasFill = '';
        self.canvas.renderAll();
      });
    }
  }

  randomId() {
    return Math.floor(Math.random() * 999999) + 1;
  }

  /*------------------------Global actions for element------------------------*/

  getActiveStyle(styleName, object) {
    object = object || this.canvas.getActiveObject();
    if (!object) { return ''; }

    if (object.getSelectionStyles && object.isEditing) {
      return (object.getSelectionStyles()[styleName] || '');
    } else {
      return (object[styleName] || '');
    }
  }

  setActiveStyle(styleName, value: string | number, object: fabric.IText) {
    object = object || this.canvas.getActiveObject() as fabric.IText;
    if (!object) { return; }

    if (object.setSelectionStyles && object.isEditing) {
      const style = {};
      style[styleName] = value;

      if (typeof value === 'string') {
        if (value.includes('underline')) {
          object.setSelectionStyles({underline: true});
        } else {
          object.setSelectionStyles({underline: false});
        }

        if (value.includes('overline')) {
          object.setSelectionStyles({overline: true});
        } else {
          object.setSelectionStyles({overline: false});
        }

        if (value.includes('line-through')) {
          object.setSelectionStyles({linethrough: true});
        } else {
          object.setSelectionStyles({linethrough: false});
        }
      }

      object.setSelectionStyles(style);
      object.setCoords();

    } else {
      if (typeof value === 'string') {
        if (value.includes('underline')) {
        object.set('underline', true);
        } else {
          object.set('underline', false);
        }

        if (value.includes('overline')) {
          object.set('overline', true);
        } else {
          object.set('overline', false);
        }

        if (value.includes('line-through')) {
          object.set('linethrough', true);
        } else {
          object.set('linethrough', false);
        }
      }

      object.set(styleName, value);
    }

    object.setCoords();
    this.canvas.renderAll();
  }


  getActiveProp(name) {
    const object = this.canvas.getActiveObject();
    if (!object) { return ''; }

    return object[name] || '';
  }

  setActiveProp(name, value) {
    const object = this.canvas.getActiveObject();
    if (!object) { return; }
    object.set(name, value).setCoords();
    this.canvas.renderAll();
  }

  clone() {
    const activeObject = this.canvas.getActiveObject();
    const activeGroup = this.canvas.getActiveObjects();

    if (activeObject) {
      let clone;
      switch (activeObject.type) {
        case 'rect':
          clone = new fabric.Rect(activeObject.toObject());
          break;
        case 'circle':
          clone = new fabric.Circle(activeObject.toObject());
          break;
        case 'triangle':
          clone = new fabric.Triangle(activeObject.toObject());
          break;
        case 'i-text':
          clone = new fabric.IText('', activeObject.toObject());
          break;
        case 'image':
          clone = fabric.util.object.clone(activeObject);
          break;
      }
      if (clone) {
        clone.set({ left: 10, top: 10 });
        this.canvas.add(clone);
        this.selectItemAfterAdded(clone);
      }
    }
  }

  /**
   * @deprecated Was renamed for getidOfSelectedObject
   */
  public getId(): any {
    return this.getIdOfSelectedObject();
  }

  /**
   * Returns the id of the currently selected object
   * @return Object ID
   */
  public getIdOfSelectedObject(): string | number {
    this.props.id = this.canvas.getActiveObject().toObject().id;
    return this.props.id;
  }

  /**
   * @deprecated Was renamed for setIdOfSelectedObject
   */
  public setId(): void {
    this.setIdOfSelectedObject();
  }

  public setIdOfSelectedObject(): void {
    const val = this.props.id;
    const complete = this.canvas.getActiveObject().toObject();

    // FIXME: This is bad, it overrides the toObject() method. If something else modifies the object it wont be picked up.
    this.canvas.getActiveObject().toObject = () => {
      complete.id = val;
      return complete;
    };
  }

  /**
   * Loops through all canvas objects and find one matching the supplied ID.
   * @param id The ID to look for
   */
  public getObjectWithID(id: number): fabric.Object {
    let foundObject: fabric.Object;

    this.canvas.getObjects().forEach((item: any) => {
      if (item.id === id) {
        foundObject = item;
      }
    });

    return foundObject;
  }

  getOpacity() {
    this.props.opacity = this.getActiveStyle('opacity', null) * 100;
  }

  setOpacity() {
    this.setActiveStyle('opacity', parseInt(this.props.opacity, 10) / 100, null);
  }

  getFill() {
    this.props.fill = this.getActiveStyle('fill', null);
  }

  setFill() {
    this.setActiveStyle('fill', this.props.fill, null);
  }

  getLineHeight() {
    this.props.lineHeight = this.getActiveStyle('lineHeight', null);
  }

  setLineHeight() {
    this.setActiveStyle('lineHeight', parseFloat(this.props.lineHeight), null);
  }

  getCharSpacing() {
    this.props.charSpacing = this.getActiveStyle('charSpacing', null);
  }

  setCharSpacing() {
    this.setActiveStyle('charSpacing', this.props.charSpacing, null);
  }

  getFontSize() {
    this.props.fontSize = this.getActiveStyle('fontSize', null);
  }

  setFontSize() {
    this.setActiveStyle('fontSize', parseInt(this.props.fontSize, 10), null);
  }

  getBold() {
    this.props.fontWeight = this.getActiveStyle('fontWeight', null);
  }

  setBold() {
    this.props.fontWeight = !this.props.fontWeight;
    this.setActiveStyle('fontWeight', this.props.fontWeight ? 'bold' : '', null);
  }

  setFontStyle() {
    this.props.fontStyle = !this.props.fontStyle;
    if (this.props.fontStyle) {
      this.setActiveStyle('fontStyle', 'italic', null);
    } else {
      this.setActiveStyle('fontStyle', 'normal', null);
    }
  }

  getTextDecoration() {
    this.props.TextDecoration = this.getActiveStyle('textDecoration', null);
  }

  setTextDecoration(value) {
    let iclass = this.props.TextDecoration;
    if (iclass.includes(value)) {
      iclass = iclass.replace(RegExp(value, 'g'), '');
    } else {
      iclass += ` ${value}`;
    }
    this.props.TextDecoration = iclass;
    this.setActiveStyle('textDecoration', this.props.TextDecoration, null);
  }

  hasTextDecoration(value) {
    return this.props.TextDecoration.includes(value);
  }

  getTextAlign() {
    this.props.textAlign = this.getActiveProp('textAlign');
  }

  setTextAlign(value) {
    this.props.textAlign = value;
    this.setActiveProp('textAlign', this.props.textAlign);
  }

  getFontFamily() {
    this.props.fontFamily = this.getActiveProp('fontFamily');
  }

  setFontFamily() {
    this.setActiveProp('fontFamily', this.props.fontFamily);
  }

  /*System*/


  removeSelected() {
    const activeObject = this.canvas.getActiveObject();
    const activeGroup = this.canvas.getActiveObjects();

    if (activeObject) {
      this.canvas.remove(activeObject);
      // this.textString = '';
    } else if (activeGroup) {
      this.canvas.discardActiveObject();
      const self = this;
      activeGroup.forEach((object) => {
        self.canvas.remove(object);
      });
    }
  }

  bringToFront() {
    const activeObject = this.canvas.getActiveObject();
    const activeGroup = this.canvas.getActiveObjects();

    if (activeObject) {
      activeObject.bringToFront();
      activeObject.opacity = 1;
    } else if (activeGroup) {
      this.canvas.discardActiveObject();
      activeGroup.forEach((object) => {
        object.bringToFront();
      });
    }
  }

  sendToBack() {
    const activeObject = this.canvas.getActiveObject();
    const activeGroup = this.canvas.getActiveObjects();

    if (activeObject) {
      this.canvas.sendToBack(activeObject);
      activeObject.sendToBack();
      activeObject.opacity = 1;
    } else if (activeGroup) {
      this.canvas.discardActiveObject();
      activeGroup.forEach((object) => {
        object.sendToBack();
      });
    }
  }

  /**
   * Show a confirmation to tu user before clearing the canvas.
   */
  public confirmClear() {
    if (confirm('Are you sure?')) {
      this.clear();
    }
  }

  /**
   * Clear the canvas.
   */
  public clear() {
    this.canvas.clear();
  }

  /**
   * @
   */
  rasterize() {
    const image = new Image();
    image.src = this.canvas.toDataURL({format: 'png'});
    const w = window.open('');
    w.document.write(image.outerHTML);
  }

  rasterizeSVG() {
    const w = window.open('');
    w.document.write(this.canvas.toSVG());
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(this.canvas.toSVG());
  }

  saveCanvasToJSON() {
    const json = JSON.stringify(this.canvas);
    localStorage.setItem('Kanvas', json);
    console.log('json');
    console.log(json);

  }

  public importCanvasFromLocalStorage() {
    this.loadCanvas(localStorage.getItem('Kanvas'));
  }

  public importCanvasFromJson(json: string) {
    this.loadCanvas(json);
  }

  public importFromObject(object: any) {
    this.loadCanvas(object);
  }

  private loadCanvas(canvasData: string | fabric.Object) {
    this.canvas.loadFromJSON(canvasData, () => {
      this.canvas.renderAll();
    });
  }

  /**
   * @deprecated Use importCanvasFromLocalStorage() instead.
   */
  public loadCanvasFromJSON() {
    this.importCanvasFromLocalStorage();
  }

  /**
   * Get the full canvas data as a Javascript object
   */
  public getCanvasData(propertiesToInclude?: string[]): any {
    return this.canvas.toObject(propertiesToInclude);
  }

  rasterizeJSON() {
    this.json = JSON.stringify(this.canvas, null, 2);
  }

  resetPanels() {
    this.textEditor = false;
    this.figureEditor = false;
  }
}
