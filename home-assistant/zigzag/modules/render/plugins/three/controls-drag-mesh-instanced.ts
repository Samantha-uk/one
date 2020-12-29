// The heavy lifting is based on Three.js DragControls.
// https://github.com/mrdoob/three.js/blob/master/examples/jsm/controls/DragControls.js

import {
  Event,
  EventDispatcher,
  InstancedMesh,
  Intersection,
  Matrix4,
  PerspectiveCamera,
  Plane,
  Raycaster,
  Vector2,
  Vector3,
} from "three";

enum PointerState {
  IDLE,
  HOVERED,
  GRABBED,
  DRAGGING,
}
/**
 * @internal
 */
export class InstancedMeshDragControls extends EventDispatcher {
  protected _camera: PerspectiveCamera;

  protected _closestIntersectingMeshId?: number;

  protected _dragSensitivityThreshold = 5;

  protected _enabled = true;

  protected _grabbedPosition = new Vector2();

  protected _instancedMesh: InstancedMesh;

  protected _intersections: Intersection[] = [];

  protected _inverseMatrix = new Matrix4();

  protected _meshOfInterestId?: number;

  protected _meshOfInterestWorldPosition = new Vector3();

  protected _offset = new Vector3();

  protected _parentHTMLElement: HTMLElement;

  protected _plane: Plane = new Plane(new Vector3(0, 0, 1), 0);

  protected _planeIntersection = new Vector3();

  protected _pointerDisplayPosition = new Vector2();

  protected _pointerNormalisedPosition = new Vector2();

  protected _pointerState = PointerState.IDLE;

  protected _pointerWorldPosition = new Vector3();

  protected _raycaster: Raycaster = new Raycaster();

  constructor(
    nodeInstancedMesh: InstancedMesh,
    camera: PerspectiveCamera,
    parentHTMLElement: HTMLElement
  ) {
    super();
    this._instancedMesh = nodeInstancedMesh;
    this._camera = camera;
    this._parentHTMLElement = parentHTMLElement;
    this._eventListenersAdd();
  }

  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(enabled: boolean) {
    this._enabled = enabled;
  }

  public dispose(): this {
    this._eventListenersRemove();
    return this;
  }

  protected _clicked(event: PointerEvent): void {
    event.preventDefault();
    this.dispatchEvent({ type: `clicked`, instanceId: this._meshOfInterestId });
  }

  protected _dragStart(event: Event): void {
    event.preventDefault();

    this._pointerState = PointerState.DRAGGING;
    this._parentHTMLElement.style.cursor = `grabbing`;

    // See if we have something along the raycaster.
    this._closestIntersectingMeshId = this._findClosestIntersectingMesh();
    if (this._closestIntersectingMeshId) {
      // Get the instance matrix for the mesh of interest.
      this._meshOfInterestId = this._closestIntersectingMeshId;
      const _meshOfInterestInstanceMatrix = new Matrix4();
      this._instancedMesh.getMatrixAt(
        this._meshOfInterestId!,
        _meshOfInterestInstanceMatrix
      );

      // Where does the raycaster intersect that plane?
      if (
        this._raycaster.ray.intersectPlane(this._plane, this._planeIntersection)
      ) {
        // Store the inverse matrix of the parent.
        this._inverseMatrix.getInverse(this._instancedMesh.matrixWorld);

        // Store the offset between the pointer and the mesh of interest.
        this._offset
          .copy(this._planeIntersection)
          .sub(
            this._meshOfInterestWorldPosition.setFromMatrixPosition(
              _meshOfInterestInstanceMatrix
            )
          );
      }

      // Emit a moved event
      this.dispatchEvent({
        type: `dragStart`,
        instanceId: this._meshOfInterestId,
      });
    }
  }

  protected _eventListenersAdd(): void {
    this._parentHTMLElement.addEventListener(
      `pointercancel`,
      this._onPointerCancel,
      false
    );
    this._parentHTMLElement.addEventListener(
      `pointerdown`,
      this._onPointerDown,
      false
    );
    this._parentHTMLElement.addEventListener(
      `pointermove`,
      this._onPointerMove,
      false
    );
    this._parentHTMLElement.addEventListener(
      `pointerup`,
      this._onPointerUp,
      false
    );
  }

  protected _eventListenersRemove(): void {
    this._parentHTMLElement.removeEventListener(
      `pointercancel`,
      this._onPointerCancel,
      false
    );
    this._parentHTMLElement.removeEventListener(
      `pointerdown`,
      this._onPointerDown,
      false
    );
    this._parentHTMLElement.removeEventListener(
      `pointermove`,
      this._onPointerMove,
      false
    );
    this._parentHTMLElement.removeEventListener(
      `pointerup`,
      this._onPointerUp,
      false
    );
  }

  protected _hoverOff(event: PointerEvent): void {
    event.preventDefault();
    this.dispatchEvent({
      type: `hoverOff`,
      instanceId: this._meshOfInterestId,
    });

    this._pointerState = PointerState.IDLE;
    this._meshOfInterestId = undefined;
    this._parentHTMLElement.style.cursor = `auto`;
  }

  protected _hoverOn(event: PointerEvent): void {
    event.preventDefault();
    this.dispatchEvent({
      type: `hoverOn`,
      instanceId: this._closestIntersectingMeshId,
    });

    this._pointerState = PointerState.HOVERED;
    this._meshOfInterestId = this._closestIntersectingMeshId;
    this._parentHTMLElement.style.cursor = `grab`;
  }

  protected _moved(event: PointerEvent): void {
    event.preventDefault();

    this._meshOfInterestWorldPosition.copy(
      this._planeIntersection
        .sub(this._offset)
        .applyMatrix4(this._inverseMatrix)
    );

    this.dispatchEvent({
      type: `dragged`,
      instanceId: this._meshOfInterestId,
      position: this._meshOfInterestWorldPosition,
    });
  }

  protected _onPointerCancel = (_event: PointerEvent): void =>
    this._onPointerUp(_event);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _onPointerDown = (_event: PointerEvent): void => {
    if (!this._enabled) {
      return;
    }
    switch (this._pointerState) {
      case PointerState.HOVERED:
        this._pointerState = PointerState.GRABBED;
        this._parentHTMLElement.style.cursor = `grabbing`;
        this._grabbedPosition = this._pointerDisplayPosition;
        break;
      case PointerState.DRAGGING:
      // falls through
      case PointerState.GRABBED:
      // falls through
      case PointerState.IDLE:
      // falls through
      // no default
    }
  };

  protected _onPointerMove = (event: PointerEvent): void => {
    if (!this._enabled) {
      return;
    }
    // We _always_ have to create a raycaster.
    // If we are dragging, we do so to find our normalised pointer position.
    // If any other state, we need to see if the pointer has moved over or left a mesh.
    // Normalise the pointer position.
    this._pointerDisplayPosition.set(event.clientX, event.clientY);
    const _rect = this._parentHTMLElement.getBoundingClientRect();

    this._pointerNormalisedPosition.set(
      ((this._pointerDisplayPosition.x - _rect.left) / _rect.width) * 2 - 1,
      -((this._pointerDisplayPosition.y - _rect.top) / _rect.height) * 2 + 1
    );

    // Set our raycaster from the camera to the pointer.
    this._raycaster.setFromCamera(
      this._pointerNormalisedPosition,
      this._camera
    );

    switch (this._pointerState) {
      case PointerState.DRAGGING: // We are dragging, so find the new pointer position and emit a moved event.
        if (
          this._raycaster.ray.intersectPlane(
            this._plane,
            this._planeIntersection
          )
        ) {
          this._moved(event);
        }
        break;

      case PointerState.GRABBED: // We have initiated dragging.
        this._dragStart(event);
        break;

      // Hovered & Idle have some common code.
      case PointerState.HOVERED:
      case PointerState.IDLE:
        // See if we have something along the raycaster.
        this._closestIntersectingMeshId = this._findClosestIntersectingMesh();

        // Check to see if we are still hovering over the existing mesh of interest.
        if (this._closestIntersectingMeshId === this._meshOfInterestId) {
          return;
        }

        // We are no longer over the mesh of interest, so emit hoverOff for it.
        if (this._meshOfInterestId) {
          this._hoverOff(event);
        }

        // If we have a mesh under the pointer, then emit a hoverOn for it.
        if (this._closestIntersectingMeshId) {
          this._hoverOn(event);
        }
      // no default
    }
  };

  protected _onPointerUp = (event: PointerEvent): void => {
    if (!this._enabled) {
      return;
    }

    // The last pointer move would have set both the pointer position
    // and the closest object.

    switch (this._pointerState) {
      case PointerState.DRAGGING:
        this._pointerState = PointerState.HOVERED;
        this.dispatchEvent({
          type: `dragEnd`,
          instanceId: this._meshOfInterestId,
        });
        break;

      case PointerState.GRABBED:
        this._clicked(event);
        break;

      case PointerState.HOVERED:
      // falls through
      case PointerState.IDLE:
      // no default
    }
  };

  private _findClosestIntersectingMesh(): number | undefined {
    this._intersections.length = 0;
    this._intersections = this._raycaster.intersectObject(this._instancedMesh);

    if (this._intersections.length > 0) {
      return this._intersections[0].instanceId;
    }
    return undefined;
  }
}
