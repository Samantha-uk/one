import * as three from "three";

import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader";
import { BufferGeometryUtils } from "three/examples/jsm/utils/BufferGeometryUtils";
import CameraControls from "camera-controls";
import SpriteText from "three-spritetext";
// eslint-disable-next-line import/no-cycle
import {
  IconHelper,
  RenderDictionary,
  RenderIcon,
  RenderLabel,
  RenderLink,
  RenderNode,
  RenderPerformanceInfo,
  RenderPoint,
  RenderWidget,
  PluginRenderBase,
  PluginConfigRender,
} from "@samantha-uk/zigzag-render";
// eslint-disable-next-line import/no-cycle
import { InstancedMeshHelperThree } from "./helper-mesh-instanced";
import { InstancedMeshDragControls } from "./controls-drag-mesh-instanced";

const THREE = three;

/**
 * @internal
 */
export interface RenderIconThree extends RenderIcon {
  color: three.Color;
  index: number;
  instancedMesh: InstancedMeshHelperThree<
    three.BufferGeometry,
    three.MeshLambertMaterial
  >;
  matrix: three.Matrix4;
}

/**
 * @internal
 */
interface RenderLabelThree extends RenderLabel {
  sprite: SpriteText;
}

/**
 * @internal
 */
export interface RenderLinkThree extends RenderLink {
  color: three.Color;
  from: three.Vector3;
  index: number;
  icons: RenderIconThree[];
  labels: RenderLabelThree[];
  matrix: three.Matrix4;
  to: three.Vector3;
}

/**
 * @internal
 */
export interface RenderNodeThree extends RenderNode {
  color: three.Color;
  index: number;
  icons: RenderIconThree[];
  labels: RenderLabelThree[];
  matrix: three.Matrix4;
  widget: RenderWidget;
}

const LINK_SEGMENTS = 8;
const NODE_SEGMENTS = 32;
const ICON_THICKNESS = 5;

type PluginConfigRenderThree = PluginConfigRender;

/**
 * @internal
 */
export class RenderEngineThree extends PluginRenderBase {
  public readonly fqpi: string;

  public readonly config: PluginConfigRenderThree;

  private _axes?: three.AxesHelper;

  private _camera: three.PerspectiveCamera;

  private _cameraControls: CameraControls;

  private _clock = new three.Clock();

  private _colorCSS: RenderDictionary<string> = {};

  private _dragControls?: InstancedMeshDragControls;

  private _fontCSS: RenderDictionary<string> = {};

  private _hasChanged = true;

  private _height = 0;

  private _iconInstances: RenderDictionary<
    InstancedMeshHelperThree<
      three.BufferGeometry,
      three.MeshLambertMaterial,
      RenderIconThree
    >
  > = {};

  private _instanceObjHelper = new three.Object3D();

  private _linkInstances!: InstancedMeshHelperThree<
    three.CylinderBufferGeometry,
    three.MeshLambertMaterial,
    RenderLinkThree
  >;

  private _maxLinkCount: number;

  private _maxNodeCount: number;

  private _nodeInstances!: InstancedMeshHelperThree<
    three.CylinderBufferGeometry,
    three.MeshLambertMaterial,
    RenderNodeThree
  >;

  private _renderer: three.WebGLRenderer;

  private _scene: three.Scene;

  private _sharedThreeColor: RenderDictionary<three.Color> = {};

  private _sharedThreeMaterial: RenderDictionary<three.MeshLambertMaterial> = {};

  private _width = 0;

  constructor(config: PluginConfigRenderThree) {
    super();
    this.fqpi = `${this.id}-three`;
    this.config = config;

    // Instances require a specified limit.
    this._maxNodeCount = 1024;
    this._maxLinkCount = 4096;

    // Lights ...
    const _hemiLight = new three.HemisphereLight(0xffffff, 0x0000ff, 0.75);
    _hemiLight.position.set(100, 100, 1000);

    const _directionalLight = new three.DirectionalLight(0xffffff, 1);
    _directionalLight.position.set(-500, 500, 1000);
    _directionalLight.lookAt(0, 0, 0);

    // Camera ...
    this._camera = new three.PerspectiveCamera(
      55, // view angle
      1, // aspect ratio.
      0.1, // near plane.
      20000 // far plane.
    );
    this._camera.up.set(0, 0, 1); // Z axis is up.
    this._camera.position.set(0, 0, 10000); // Start our camera up high.
    this._camera.lookAt(0, 0, 0); // Looking down at the center of the mesh.

    // Create the renderer
    this._renderer = new three.WebGLRenderer({
      antialias: true,
      powerPreference: `high-performance`,
    });
    this._renderer.domElement.style.position = `absolute`;
    this._renderer.domElement.style.top = `0`;

    CameraControls.install({ THREE });
    this._cameraControls = new CameraControls(
      this._camera,
      this._renderer.domElement
    );
    this._cameraControls.dollyToCursor = true;
    this._cameraControls.verticalDragToForward = true;

    // Action!.
    this._scene = new three.Scene();
    this._scene.add(_hemiLight);
    this._scene.add(_directionalLight);

    /*
    _gridHelper.position.set(0, 0, 0);
    _gridHelper.geometry.rotateX(Math.PI / 2);

    this._scene.add(_gridHelper); */
  }

  public get hasChanged(): boolean {
    return this._hasChanged;
  }

  public get viewSize(): RenderPoint {
    return { x: this._width, y: this._height, z: 0 };
  }

  public set viewSize(newDimensions: RenderPoint) {
    this._hasChanged = true;

    this._width = newDimensions.x;
    this._height = newDimensions.y;
  }

  public get viewPosition(): RenderPoint {
    return {
      x: this._camera.position.x,
      y: this._camera.position.y,
      z: this._camera.position.z,
    };
  }

  public set viewPosition(_center: RenderPoint) {
    this._hasChanged = true;
  }

  public get viewZoom(): number {
    return this._camera.zoom;
  }

  public set viewZoom(_scale: number) {
    this._hasChanged = true;
  }

  public addLink(
    from: RenderPoint,
    to: RenderPoint,
    radius: number,
    color: string,
    widget: RenderWidget
  ): RenderLinkThree {
    const RLnk3: RenderLinkThree = {
      color: new three.Color(),
      from: new three.Vector3(),
      icons: [],
      labels: [],
      index: this._linkInstances.count + 1,
      matrix: new three.Matrix4(),
      to: new three.Vector3(),
      widget,
    };
    RLnk3.matrix.scale(new three.Vector3(radius, radius, 1));
    this.setLinkColor(RLnk3, color);
    this.setLinkPosition(RLnk3, from, to);

    // "add" to the scene.
    this._linkInstances.count++;
    this._linkInstances.renderElements[RLnk3.index] = RLnk3;
    return RLnk3;
  }

  public addLinkLabel(
    RLnk: RenderLinkThree,
    offset: number,
    rotation: number,
    text: string,
    size: number,
    visible: boolean,
    id: string[]
  ): RenderLabelThree {
    const RLbl: RenderLabelThree = this._addLabel(
      rotation,
      text,
      size,
      visible,
      id
    );
    RLbl.offset = offset;
    this.setLinkLabelOffset(RLnk, RLbl, offset);
    this._scene.add(RLbl.sprite);
    RLnk.labels.push(RLbl);
    return RLbl;
  }

  public addNode(
    position: RenderPoint,
    radius: number,
    height: number,
    color: string,
    _id: string[],
    widget: RenderWidget
  ): RenderNodeThree {
    const RNde3: RenderNodeThree = {
      color: new three.Color(),
      icons: [],
      labels: [],
      index: this._nodeInstances.count + 1,
      matrix: new three.Matrix4(),
      widget,
    };

    RNde3.matrix.scale(new three.Vector3(radius, radius, height));
    this.setNodeColor(RNde3, color);
    this.setNodePosition(RNde3, position);

    // "add" to the scene.
    this._nodeInstances.count++;
    this._nodeInstances.renderElements[RNde3.index] = RNde3;

    return RNde3;
  }

  public addNodeIcon(
    RNde: RenderNodeThree,
    offset: RenderPoint,
    radius: number,
    height: number,
    iconName: string,
    color: string,
    _visible: boolean,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _id: string[]
  ): RenderIconThree {
    const _iconInstancedMesh = this._getIconInstance(iconName);
    const RIcn: RenderIconThree = {
      color: new three.Color(this._colorCSS[color]),
      index: _iconInstancedMesh.count + 1,
      instancedMesh: _iconInstancedMesh,
      matrix: new three.Matrix4(),
      offset,
    };

    RIcn.matrix.scale(new three.Vector3(radius, radius, height));

    this.setIconColor(RIcn, color);
    this.setNodeIconOffset(RNde, RIcn, offset);
    this.setIconVisibility(RIcn, _visible);

    // "add" to the scene.
    RIcn.instancedMesh.count++;
    RNde.icons.push(RIcn);
    return RIcn;
  }

  public addNodeLabel(
    RNde: RenderNodeThree,
    offset: RenderPoint,
    rotation: number,
    text: string,
    size: number,
    visible: boolean,
    id: string[]
  ): RenderLabelThree {
    const RLbl: RenderLabelThree = this._addLabel(
      rotation,
      text,
      size,
      visible,
      id
    );
    RLbl.offset = offset;
    this.setNodeLabelOffset(RNde, RLbl, offset);
    this._scene.add(RLbl.sprite);
    RNde.labels.push(RLbl);
    return RLbl;
  }

  public dispose(): void {
    this._cameraControls.dispose();
    this._dragControls?.dispose();
  }

  public init(
    parentDivElement: HTMLDivElement,
    font: RenderDictionary<string>,
    color: RenderDictionary<string>
  ): boolean {
    this._fontCSS = font;
    this._colorCSS = color;
    this._createSharedResources();
    const _width = parentDivElement.getBoundingClientRect().width;
    const _height = parentDivElement.getBoundingClientRect().height;
    this._renderer.setSize(_width, _height);
    this._scene.background = new three.Color(this._colorCSS.background_primary);

    parentDivElement.append(this._renderer.domElement);

    // Create user interaction controls.
    this._dragControls = new InstancedMeshDragControls(
      this._nodeInstances.mesh,
      this._camera,
      this._renderer.domElement
    );

    this._dragControls.addEventListener(`dragStart`, () => {
      this._cameraControls.enabled = false;
    });
    this._dragControls.addEventListener(`dragEnd`, () => {
      this._cameraControls.enabled = true;
    });

    this._dragControls.addEventListener(`dragged`, (event: three.Event) =>
      this._nodeInstances.renderElements[
        event.instanceId as number
      ].widget.onMoved(event.position)
    );

    this._dragControls.addEventListener(`hoverOff`, (event: three.Event) =>
      this._nodeInstances.renderElements[
        event.instanceId as number
      ].widget.onHoverOff()
    );

    this._dragControls.addEventListener(`hoverOn`, (event: three.Event) =>
      this._nodeInstances.renderElements[
        event.instanceId as number
      ].widget.onHoverOn()
    );

    this._dragControls.addEventListener(`clicked`, (event: three.Event) =>
      this._nodeInstances.renderElements[
        event.instanceId as number
      ].widget.onClicked()
    );

    this._dragControls.enabled = true;

    this._axes = new three.AxesHelper(500);
    this._scene.add(this._axes);
    this._scene.add(this._linkInstances.mesh);
    this._scene.add(this._nodeInstances.mesh);

    this._camera.aspect = _width / _height;
    this._camera.updateProjectionMatrix();
    return true;
  }

  public render(): RenderPerformanceInfo {
    // this._axes.position.copy(this._cameraControls.getPosition());

    const _delta = this._clock.getDelta();
    const _controlsUpdated = this._cameraControls.update(_delta);
    if (_controlsUpdated || this._hasChanged) {
      this._renderer.render(this._scene, this._camera);
      // console.log("%c scene", "color:green", this._scene);
      this._hasChanged = false;
    }
    return {
      drawCalls: this._renderer.info.render.calls,
    } as RenderPerformanceInfo;
  }

  public setIconColor(RIcn3: RenderIconThree, color: string): void {
    this._hasChanged = true;
    RIcn3.color.set(this._colorCSS[color]);
    RIcn3.instancedMesh.setColorAt(RIcn3.index, RIcn3.color);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public setIconVisibility(_RIcn3: RenderIconThree, _visible: boolean): void {
    this._hasChanged = true;
  }

  public setLabelRotation(
    RLbl3: RenderLabelThree,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _rotation: number
  ): RenderLabelThree {
    if (RLbl3 === undefined) {
      return RLbl3;
    }
    this._hasChanged = true;
    // TODO Set the rotation
    return RLbl3;
  }

  public setLabelText(RLbl3: RenderLabelThree, text: string): void {
    this._hasChanged = true;
    RLbl3.sprite.text = text;
  }

  public setLabelVisibility(RLbl3: RenderLabelThree, visible: boolean): void {
    this._hasChanged = true;
    RLbl3.sprite.visible = visible;
  }

  public setLinkColor(RLnk3: RenderLinkThree, color: string): void {
    this._hasChanged = true;
    RLnk3.color.set(this._colorCSS[color]);
    this._linkInstances.setColorAt(RLnk3.index, RLnk3.color);
  }

  public setLinkLabelOffset(
    RLnk3: RenderLinkThree,
    RLbl3: RenderLabelThree,
    offset: number
  ): void {
    this._hasChanged = true;
    const _line = new three.Line3(RLnk3.from, RLnk3.to);
    let _offsetPosition = new three.Vector3();
    _offsetPosition = _line.at(offset, _offsetPosition);
    _offsetPosition.z += 20;
    RLbl3.sprite.position.copy(_offsetPosition);
  }

  public setLinkPosition(
    RLnk3: RenderLinkThree,
    from: RenderPoint,
    to: RenderPoint
  ): void {
    this._hasChanged = true;
    RLnk3.from.set(from.x, from.y, from.z);
    RLnk3.to.set(to.x, to.y, to.z);

    const _to = RLnk3.to.clone();

    // Set the start point of the link.
    this._instanceObjHelper.position.copy(RLnk3.from);

    // Scale the z-axis to the length of the link.
    this._instanceObjHelper.scale.set(1, 1, RLnk3.from.distanceTo(_to));

    // Make the link point at the to point.
    this._scene.localToWorld(_to);
    this._instanceObjHelper.lookAt(_to);
    this._instanceObjHelper.updateMatrix();

    // Update the instance.
    RLnk3.matrix.copy(this._instanceObjHelper.matrix);
    this._linkInstances.setMatrixAt(RLnk3.index, RLnk3.matrix);
    // update any associated labels.
    RLnk3.labels.forEach((label) =>
      this.setLinkLabelOffset(RLnk3, label, label.offset as number)
    );
  }

  public setNodeColor(RNde3: RenderNodeThree, color: string): void {
    this._hasChanged = true;
    RNde3.color.set(this._colorCSS[color]);
    this._nodeInstances.setColorAt(RNde3.index, RNde3.color);
  }

  public setNodeIconOffset(
    RNde3: RenderNodeThree,
    RIcn3: RenderIconThree,
    offset: RenderPoint
  ): RenderIconThree {
    this._hasChanged = true;
    const _iconPosition = new three.Vector3()
      .setFromMatrixPosition(RNde3.matrix)
      .add(new three.Vector3(offset.x, offset.y, offset.z));

    RIcn3.matrix.setPosition(_iconPosition.x, _iconPosition.y, _iconPosition.z);
    RIcn3.instancedMesh.setMatrixAt(RIcn3.index, RIcn3.matrix);

    return RIcn3;
  }

  public setNodeLabelOffset(
    RNde3: RenderNodeThree,
    RLbl3: RenderLabelThree,
    offset: RenderPoint
  ): RenderLabelThree {
    if (!RLbl3 || !RNde3) {
      return RLbl3;
    }

    this._hasChanged = true;

    RLbl3.sprite.position
      .setFromMatrixPosition(RNde3.matrix)
      .add(new three.Vector3(offset.x, offset.y, offset.z));
    return RLbl3;
  }

  public setNodePosition(RNde3: RenderNodeThree, position: RenderPoint): void {
    this._hasChanged = true;
    RNde3.matrix.setPosition(position.x, position.y, position.z);
    this._nodeInstances.setMatrixAt(RNde3.index, RNde3.matrix);
    RNde3.labels.forEach((label) =>
      this.setNodeLabelOffset(RNde3, label, label.offset as RenderPoint)
    );
    RNde3.icons.forEach((icon) =>
      this.setNodeIconOffset(RNde3, icon, icon.offset as RenderPoint)
    );
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  public toWorld(_mouse: RenderPoint): RenderPoint {
    return { x: 0, y: 0, z: 0 };
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  public zoomToFit(_x: number, _y: number, _zoom: number): void {}

  private _addLabel(
    _rotation: number,
    text: string,
    size: number,
    visible: boolean,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _id: string[]
  ): RenderLabelThree {
    this._hasChanged = true;

    const RLbl: RenderLabelThree = {
      sprite: new SpriteText(text, size, this._colorCSS.text_primary_color),
    };
    RLbl.sprite.fontFace = this._fontCSS.family;
    RLbl.sprite.backgroundColor = this._colorCSS.background_primary_color;
    RLbl.sprite.borderColor = this._colorCSS.background_secondary_color;
    RLbl.sprite.borderWidth = 0.5;
    RLbl.sprite.padding = 2;
    RLbl.sprite.visible = visible;
    RLbl.sprite.frustumCulled = false;
    RLbl.sprite.fontFace = this._fontCSS.family;

    return RLbl;
  }

  private _createIconMeshFromSVGPath(
    iconName: string
  ): InstancedMeshHelperThree<
    three.BufferGeometry,
    three.MeshLambertMaterial,
    RenderIconThree
  > {
    const _loader = new SVGLoader();

    // Parse the svg path to three.shapes.
    const _shapes = _loader
      .parse(`<path d="${IconHelper.getIconPath(iconName)}">`)
      .paths[0].toShapes(true);

    // Extrude the shapes into 3d geometry.
    const _shapeBufferGeometry: three.BufferGeometry[] = [];
    _shapes.forEach((shape: three.Shape) => {
      _shapeBufferGeometry.push(
        new three.ExtrudeBufferGeometry(shape, {
          depth: ICON_THICKNESS,
          bevelEnabled: false,
        })
      );
    });

    // Merge the individual elements into one for performance gain.
    const _iconGeometry = BufferGeometryUtils.mergeBufferGeometries(
      _shapeBufferGeometry,
      true
    );
    // SVG y coordinates are the inverse of normal cartesian, so correct for this using rotation.
    _iconGeometry.applyMatrix4(new three.Matrix4().makeRotationX(Math.PI));

    // Normalise the size and center point  of the icon as different sources have different sizes.
    _iconGeometry.computeBoundingSphere();
    _iconGeometry.scale(
      10 / _iconGeometry.boundingSphere!.radius,
      10 / _iconGeometry.boundingSphere!.radius,
      1
    );
    _iconGeometry.center();

    const _iconMaterial = new three.MeshLambertMaterial();

    // Create and store the InstancedMesh.
    this._iconInstances[iconName] = new InstancedMeshHelperThree<
      three.BufferGeometry,
      three.MeshLambertMaterial,
      RenderIconThree
    >(_iconGeometry, _iconMaterial, this._maxNodeCount);
    this._iconInstances[iconName].name = `iconInstances[${iconName}]`;
    this._scene.add(this._iconInstances[iconName].mesh);
    return this._iconInstances[iconName];
  }

  private _createSharedResources() {
    this._sharedThreeColor.success_color = new three.Color(
      this._colorCSS.success_color
    );
    this._sharedThreeColor.warning_color = new three.Color(
      this._colorCSS.warning_color
    );
    this._sharedThreeColor.error_color = new three.Color(
      this._colorCSS.error_color
    );
    this._sharedThreeColor.state_icon_color = new three.Color(
      this._colorCSS.state_icon_color
    );
    this._sharedThreeColor.background_secondary_color = new three.Color(
      this._colorCSS.background_secondary_color
    );

    this._sharedThreeMaterial.success_color = new three.MeshLambertMaterial({
      color: this._sharedThreeColor.success_color,
    });
    this._sharedThreeMaterial.warning_color = new three.MeshLambertMaterial({
      color: this._sharedThreeColor.warning_color,
    });
    this._sharedThreeMaterial.error_color = new three.MeshLambertMaterial({
      color: this._sharedThreeColor.error_color,
    });
    this._sharedThreeMaterial.state_icon_color = new three.MeshLambertMaterial({
      color: this._sharedThreeColor.state_icon_color,
    });
    this._sharedThreeMaterial.background_secondary_color = new three.MeshLambertMaterial(
      {
        color: this._sharedThreeColor.background_secondary_color,
      }
    );
    // Create the instanced Link mesh.
    const _linkGeometry = new three.CylinderBufferGeometry(
      2,
      2,
      1,
      LINK_SEGMENTS,
      1,
      false
    );
    _linkGeometry.applyMatrix4(
      new three.Matrix4().makeTranslation(0, 1 / 2, 0)
    );
    _linkGeometry.applyMatrix4(new three.Matrix4().makeRotationX(Math.PI / 2));

    const _linkMaterial = new three.MeshLambertMaterial();

    this._linkInstances = new InstancedMeshHelperThree<
      three.CylinderBufferGeometry,
      three.MeshLambertMaterial,
      RenderLinkThree
    >(_linkGeometry, _linkMaterial, this._maxLinkCount);
    this._linkInstances.name = `linkInstances`;

    // Create the instanced Node mesh.
    const _nodeGeometry = new three.CylinderBufferGeometry(
      2,
      2,
      1,
      NODE_SEGMENTS,
      1,
      false
    );
    _nodeGeometry.applyMatrix4(
      new three.Matrix4().makeTranslation(0, 1 / 2, 0)
    );
    _nodeGeometry.applyMatrix4(new three.Matrix4().makeRotationX(Math.PI / 2));

    const _nodeMaterial = new three.MeshLambertMaterial();

    this._nodeInstances = new InstancedMeshHelperThree<
      three.CylinderBufferGeometry,
      three.MeshLambertMaterial,
      RenderNodeThree
    >(_nodeGeometry, _nodeMaterial, this._maxNodeCount);
    this._nodeInstances.name = `nodeInstances`;
  }

  // Returns the instancedMeshHelper for an icon.
  // Creates it on first request.
  private _getIconInstance(
    iconName: string
  ): InstancedMeshHelperThree<
    three.BufferGeometry,
    three.MeshLambertMaterial,
    RenderIconThree
  > {
    if (this._iconInstances[iconName]) {
      return this._iconInstances[iconName];
    }
    return this._createIconMeshFromSVGPath(iconName);
  }
}
