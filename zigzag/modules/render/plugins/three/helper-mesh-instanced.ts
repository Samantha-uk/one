import {
  BufferGeometry,
  Color,
  Geometry,
  InstancedMesh,
  Material,
  Matrix4,
} from "three";

// eslint-disable-next-line import/no-cycle
import {
  RenderLinkThree,
  RenderNodeThree,
  RenderIconThree,
} from "./plugin-render-three";
// Thin wrapper/compositor class for THREE InstancedMesh to keep things tidied away.
/**
 * @internal
 */
export class InstancedMeshHelperThree<
  TGeometry extends Geometry | BufferGeometry = Geometry | BufferGeometry,
  TMaterial extends Material | Material[] = Material | Material[],
  RenderElement = RenderLinkThree | RenderNodeThree | RenderIconThree
> {
  private _currentCount: number;

  private _instancedMesh: InstancedMesh<TGeometry, TMaterial>;

  private _renderElements: RenderElement[];

  constructor(geometry: TGeometry, material: TMaterial, maxCount: number) {
    this._currentCount = 0;
    this._renderElements = new Array(maxCount);
    this._instancedMesh = new InstancedMesh<TGeometry, TMaterial>(
      geometry,
      material,
      maxCount
    );
  }

  public get count(): number {
    return this._currentCount;
  }

  public set count(count: number) {
    this._currentCount = count;
    this._instancedMesh.count = this._currentCount;
  }

  public get name(): string {
    return this._instancedMesh.name;
  }

  public set name(name: string) {
    this._instancedMesh.name = name;
  }

  public get mesh(): InstancedMesh<TGeometry, TMaterial> {
    return this._instancedMesh;
  }

  public get renderElements(): RenderElement[] {
    return this._renderElements;
  }

  public setColorAt(index: number, color: Color): this {
    this._instancedMesh.setColorAt(index, color);
    return this;
  }

  public setMatrixAt(index: number, matrix: Matrix4): this {
    this._instancedMesh.setMatrixAt(index, matrix);
    this._instancedMesh.instanceMatrix.needsUpdate = true;
    return this;
  }
}
