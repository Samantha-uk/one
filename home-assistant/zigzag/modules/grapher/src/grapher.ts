import {
  RenderDictionary,
  PluginRenderBase,
  RenderPerformanceInfo,
  RenderPoint,
} from "@samantha-uk/zigzag-render";

import {
  PluginLayoutBase,
  LayoutLinkBase,
  LayoutNodeBase,
} from "@samantha-uk/zigzag-layout";

import { PluginDataBase, Zig, Zag } from "@samantha-uk/zigzag-data";

// https://github.com/localvoid/perf-monitor
import * as pm from "perf-monitor";
// eslint-disable-next-line import/no-cycle
import { ZagWidget } from "./zag-widget";
// eslint-disable-next-line import/no-cycle
import { ZigWidget, ZIG_RADIUS } from "./zig-widget";

export interface GrapherViewState {
  pan: { x: number; y: number };
  scale: number;
  zigs: ZigPosition[];
}

export interface ZagDatum {
  source: ZigDatum;
  target: ZigDatum;
  widget?: ZagWidget;
  zags: Zag[];
}

export interface ZigDatum {
  grapher?: Grapher;
  index: number;
  isLocked: boolean;
  position: RenderPoint;
  widget?: ZigWidget;
  zagDs: ZagDatum[];
  zig: Zig;
}

export interface ZigEvent {
  zig: Zig;
}

interface ZigDatumPair {
  source: ZigDatum | undefined;
  target: ZigDatum | undefined;
}

interface ZigPosition {
  ieee: string;
  x: number;
  y: number;
  z: number;
}

const PERFMON = true;

type GpuMonitor = { samples: pm.MonitorSamples; widget: pm.MonitorWidget };
function createGpuMonitor(container: HTMLElement): GpuMonitor {
  const _samples = new pm.MonitorSamples(pm.MonitorMaxSamples);
  const gpuMon: GpuMonitor = {
    samples: _samples,
    widget: new pm.MonitorWidget(`GPU`, 0, `Calls`, _samples),
  };

  container.append(gpuMon.widget.element);
  return gpuMon;
}

export class Grapher {
  private _colorCSS: RenderDictionary<string> = {};

  private _dataPlugin: PluginDataBase;

  private _fontCSS: RenderDictionary<string> = {};

  private _height = 0;

  private _layoutPlugin: PluginLayoutBase;

  private _parentDivElement: HTMLDivElement | undefined = undefined;

  private _pmGPU!: GpuMonitor;

  private _renderPlugin: PluginRenderBase;

  private _width = 0;

  private _zagDatums: ZagDatum[] = [];

  private _zigDatums: ZigDatum[] = [];

  constructor(
    dataPlugin: PluginDataBase,
    layoutPlugin: PluginLayoutBase,
    renderPlugin: PluginRenderBase
  ) {
    this._dataPlugin = dataPlugin;
    this._layoutPlugin = layoutPlugin;
    this._renderPlugin = renderPlugin;
  }

  // Provide the layout data, to be used to persist the layout externally.
  get viewState(): GrapherViewState {
    // Return the coordinates of all locked zigs.
    const _viewState: GrapherViewState = {
      pan: { x: 0, y: 0 },
      scale: 0,
      zigs: [],
    };
    this._zigDatums.forEach((zigD: ZigDatum) => {
      // if fx & fy then the zig is locked and we will include it in the returned layout data.
      if (zigD.isLocked) {
        _viewState.zigs.push({
          ieee: zigD.zig.ieee,
          x: zigD.position.x,
          y: zigD.position.y,
          z: zigD.position.z,
        } as ZigPosition);
      }
    });

    // The transform allows us to restore pan/zoom state.
    // At this stage the dom elements have gone, so we use the cached value.
    /*     _viewState.pan = { x: this._transform!.x, y: this._transform!.y };
    _viewState.scale = this._transform!.k; */
    return _viewState;
  }

  // Inject the layout data and update zigs.
  set viewState(viewState: GrapherViewState) {
    try {
      for (const _zigPosition of viewState.zigs) {
        const _zigToLock: ZigDatum | undefined = this._zigDatums.find(
          (zigD) => zigD.zig.ieee === _zigPosition.ieee
        );
        // If we have found the zig.
        if (_zigToLock !== undefined) {
          _zigToLock.position.x = _zigPosition.x;
          _zigToLock.position.y = _zigPosition.y;
          _zigToLock.position.z = _zigPosition.z;
          this._zigLockOn(_zigToLock);
        }
      }

      /* 
      const _restoreTranslate = d3z.zoomIdentity
        .translate(viewState.pan.x, viewState.pan.y)
        .scale(viewState.scale);

      this._zigzagContainer!.call(this._zoom!.transform, _restoreTranslate);

      this._renderEngine!.translate({
        x: this._transform.x,
        y: this._transform.y,
        z: 500,
      });
      this._renderEngine!.scale(this._transform.k); */
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(
        `Zigzag encountered a problem [${error}] restoring the viewState [${viewState}].`
      );
    }
  }

  public agitate(): void {
    this.unlockAll();
    this._layoutPlugin?.reset();
  }

  // If the container has been resized we need to modify some of the simulation settings and restart.
  public resize(): void {
    if (this._parentDivElement) {
      const _newWidth = this._parentDivElement.getBoundingClientRect().width;
      const _newHeight = this._parentDivElement.getBoundingClientRect().height;

      if (this._width !== _newWidth || this._height !== _newHeight) {
        this._width = _newWidth;
        this._height = _newHeight;

        if (this._renderPlugin) {
          this._renderPlugin.viewSize = {
            x: this._width,
            y: this._height,
            z: 0,
          };
        }
      }
    }
  }

  public async start(parentDivElement: HTMLDivElement): Promise<boolean> {
    this._parentDivElement = parentDivElement;
    this._getCSSValues(parentDivElement);

    if (!this._initRenderEngine()) {
      return false;
    }
    // Fetch the zig & zag data.
    const { zigs, zags } = await this._dataPlugin.fetchData();
    this._dataInject(zigs, zags);

    // Create the display widgets.
    this._zigCreateWidgets();
    this._zagCreateWidgets();

    // Start the render loop.
    this._renderLoop();
    return true;
  }

  public stop(): void {
    this._layoutPlugin.stop();
    this._renderPlugin?.dispose();
    this._zigDatums = [];
    this._zagDatums = [];
  }

  public unlockAll(): void {
    this._zigDatums.forEach((zigD) => this._zigLockOff(zigD));
    // this._requestUpdate();
  }

  public zoomToFit(): void {
    const { min, max } = this._getModelBounds();

    const _scaleWidth = this._width / (max.x - min.x + ZIG_RADIUS * 5);
    const _scaleHeight = this._height / (max.y - min.y + ZIG_RADIUS * 5);
    const _centreX = (max.x + min.x) / 2;
    const _centreY = (max.y + min.y) / 2;

    this._renderPlugin.zoomToFit(
      _centreX,
      _centreY,
      Math.min(_scaleWidth, _scaleHeight)
    );
  }
  /* 
  private static _zagHighlightOff(_zagD: ZagDatum) {}

  private static _zagHighlightOn(_zagD: ZagDatum) {}

  private static _zigHighlightOff(_zigD: ZigDatum) {}

  private static _zigHighlightOn(_zigD: ZigDatum) {}
 */

  public zigClicked(zig: Zig): void {
    this._parentDivElement?.dispatchEvent(
      new CustomEvent<ZigEvent>(`zigClicked`, { detail: { zig } })
    );
  }

  private _dataInject(zigs: Zig[], zags: Zag[]): void {
    // Copy & initialise all the Zigs.
    let _index = 0;
    this._zigDatums = zigs.map((zig: Zig) => ({
      zig,
      grapher: this,
      index: _index++,
      isLocked: false,
      position: { x: 0, y: 0, z: 0 },
      widget: undefined,
      zagDs: [],
    }));

    zags.forEach((zagToAdd: Zag) => {
      // Find the source and target Zigs.
      // eslint-disable-next-line unicorn/no-reduce
      const _zigDPair: ZigDatumPair = this._zigDatums.reduce(
        (zigDPair: ZigDatumPair, zigD: ZigDatum) => {
          zigDPair.source =
            zigD.zig.ieee === zagToAdd.ieee ? zigD : zigDPair.source;
          zigDPair.target =
            zigD.zig.ieee === zagToAdd.from ? zigD : zigDPair.target;
          return zigDPair;
        },
        { source: undefined, target: undefined }
      );

      if (!_zigDPair.source || !_zigDPair.target) {
        throw new Error(
          `Data inconsistency in ZigZag Grapher -> _injectData: No Zig found for Zag[${zagToAdd}]`
        );
      }

      // Check to see if we already have a ZagD with the same two Zigs.
      let _zagDToUpdate = this._zagDatums.find(
        (zagD: ZagDatum) =>
          zagD.zags[0].from === zagToAdd.ieee &&
          zagD.zags[0].ieee === zagToAdd.from
      );

      // If nothing found then create a new ZagD.
      if (_zagDToUpdate === undefined) {
        _zagDToUpdate = {
          source: _zigDPair.source,
          target: _zigDPair.target,
          widget: undefined,
          zags: [],
        };
        this._zagDatums.push(_zagDToUpdate);
      }

      // By now we have either found or added a new ZagWidget.
      // We add the zagToAdd to it.
      _zagDToUpdate.zags.push(zagToAdd);

      // Add the ZagWidget to the ZigWidgets it connects. This is for quick highlighting of the Zags on mouseover.
      _zigDPair.source.zagDs.push(_zagDToUpdate);
      _zigDPair.target.zagDs.push(_zagDToUpdate);
    });

    this._layoutPlugin.injectNodes(
      this._zigDatums.map(
        (zigD: ZigDatum): LayoutNodeBase => ({
          index: zigD.index,
          x: zigD.position.x,
          y: zigD.position.y,
          z: zigD.position.z,
        })
      )
    );

    this._layoutPlugin.injectLinks(
      this._zagDatums.map(
        (zagD: ZagDatum): LayoutLinkBase => ({
          source: zagD.source.index,
          target: zagD.target.index,
        })
      )
    );
  }

  private _getCSSValues(htmlElement: HTMLElement) {
    const _style = getComputedStyle(htmlElement);
    this._colorCSS.state_icon_color = _style
      .getPropertyValue(`--state-icon-color`)
      .replace(` `, ``);

    this._colorCSS.success_color = _style
      .getPropertyValue(`--success-color`)
      .replace(` `, ``);
    this._colorCSS.warning_color = _style
      .getPropertyValue(`--warning-color`)
      .replace(` `, ``);
    this._colorCSS.error_color = _style
      .getPropertyValue(`--error-color`)
      .replace(` `, ``);

    this._colorCSS.background_primary_color = _style
      .getPropertyValue(`--primary-background-color`)
      .replace(` `, ``);
    this._colorCSS.background_secondary_color = _style
      .getPropertyValue(`--secondary-background-color`)
      .replace(` `, ``);

    this._colorCSS.text_primary_color = _style
      .getPropertyValue(`--primary-text-color`)
      .replace(` `, ``);

    this._colorCSS.text_secondary_color = _style
      .getPropertyValue(`--secondary-text-color`)
      .replace(` `, ``);

    this._fontCSS.family = _style.getPropertyValue(
      `--paper-font-common-base_-_font-family`
    );

    this._fontCSS.size = _style.getPropertyValue(
      `--paper-font-subhead_-_font-size`
    );
  }

  private _getModelBounds(): {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  } {
    let _minX: number = Number.MAX_VALUE;
    let _minY: number = Number.MAX_VALUE;
    let _minZ: number = Number.MAX_VALUE;
    let _maxX: number = Number.MIN_VALUE;
    let _maxY: number = Number.MIN_VALUE;
    let _maxZ: number = Number.MIN_VALUE;

    this._zigDatums.forEach((zigD: ZigDatum) => {
      _maxX = Math.max(_maxX, zigD.position.x);
      _minX = Math.min(_minX, zigD.position.x);
      _maxY = Math.max(_maxY, zigD.position.y);
      _minY = Math.min(_minY, zigD.position.y);
      _maxZ = Math.max(_maxZ, zigD.position.z);
      _minZ = Math.min(_minZ, zigD.position.z);
    });

    return {
      min: { x: _minX, y: _minY, z: _minZ },
      max: { x: _maxX, y: _maxY, z: _maxZ },
    };
  }

  private _renderLoop(loop = true) {
    window.requestAnimationFrame(() => {
      if (PERFMON) {
        pm.startProfile(`raf`);
      }

      // If the layout is still changing, step the layout engine and update the zigs.
      if (!this._layoutPlugin.isStable) {
        const _zigsUpdated: LayoutNodeBase[] = this._layoutPlugin.step();

        this._setPositionBatch(_zigsUpdated);
      }

      const renderInfo:
        | RenderPerformanceInfo
        | undefined = this._renderPlugin.render();

      if (PERFMON) {
        if (renderInfo) {
          this._pmGPU.samples.addSample(renderInfo.drawCalls);
          this._pmGPU.widget.invalidate();
        }
        pm.endProfile(`raf`);
      }

      if (loop) {
        this._renderLoop();
      }
    });
  }

  private _setPositionBatch(zigs: LayoutNodeBase[]) {
    // Create a set of Zags we need to update, so we don't update the same Zag more than once.
    const _zagsToUpdate = new Set<ZagDatum>();
    zigs.forEach((zig: LayoutNodeBase) => {
      const _zigW = this._setPositionZigByIndex(zig.index, {
        x: zig.x ?? 0,
        y: zig.y ?? 0,
        z: zig.z ?? 0,
      });
      _zigW.zagDs.forEach((zagD: ZagDatum) => _zagsToUpdate.add(zagD));
    });

    // Update the Zags.
    _zagsToUpdate.forEach((zagD: ZagDatum) => this._setPositionZag(zagD));
  }

  // eslint-disable-next-line class-methods-use-this
  private _setPositionZag(zagD: ZagDatum): void {
    zagD.widget?.source(zagD.source.position).target(zagD.target.position);
  }

  // eslint-disable-next-line class-methods-use-this
  private _setPositionZigByDatum(zigD: ZigDatum, position: RenderPoint) {
    zigD.position = position;
    zigD.widget?.position(zigD.position);
  }

  private _setPositionZigByIndex(
    zigIndex: number,
    position: RenderPoint
  ): ZigDatum {
    const _zigD = this._zigDatums[zigIndex];
    this._setPositionZigByDatum(_zigD, position);
    return _zigD;
  }

  public setPositionZigWithZags(zigD: ZigDatum, position: RenderPoint): void {
    // Redraw the zig.
    this._setPositionZigByDatum(zigD, position);
    // Redraw all the zags connected to it.
    zigD.zagDs.forEach((zagD: ZagDatum) => this._setPositionZag(zagD));
  }

  private _initRenderEngine(): boolean {
    // Find the div that holds zigzag.
    if (this._parentDivElement) {
      // Store the dimensions of the div.
      this._width = this._parentDivElement.clientWidth;
      this._height = this._parentDivElement.clientHeight;

      if (this._renderPlugin) {
        this._renderPlugin.init(
          this._parentDivElement,
          this._fontCSS,
          this._colorCSS
        );

        if (PERFMON) {
          const container = document.createElement(`div`);
          container.style.cssText = `position: fixed; opacity: 0.9; right: 0; bottom: 0`;
          document.body.append(container);
          pm.initPerfMonitor({ container });
          pm.initProfiler(`raf`);
          pm.startFPSMonitor();
          pm.startMemMonitor();

          this._pmGPU = createGpuMonitor(container);
        }

        return true;
      }
    }

    return false;
  }

  private _zagCreateWidgets() {
    this._zagDatums.forEach((zagD: ZagDatum) => {
      zagD.widget = new ZagWidget(this._renderPlugin, zagD);
      this._renderLoop(false);
    });
  }

  private _zigCreateWidgets(): void {
    if (this._renderPlugin) {
      this._zigDatums.forEach((zigD: ZigDatum) => {
        zigD.widget = new ZigWidget(this._renderPlugin, zigD);
        zigD.widget.grapher = this;
        this._renderLoop(false);
      });
    }
  }

  /*   private _zigHighlightOff(zigD: ZigDatum) {

  }

  private _zigHighlightOn(zigD: ZigDatum) {

  } */

  private _zigLockOff(zigD: ZigDatum) {
    if (zigD.widget) {
      zigD.widget.isLocked = false;
    }

    this._layoutPlugin.unlockNode(zigD.index);
    zigD.isLocked = false;
  }

  // eslint-disable-next-line class-methods-use-this
  private _zigLockOn(zigD: ZigDatum) {
    if (!zigD.isLocked) {
      if (zigD.widget) {
        zigD.widget.isLocked = true;
      }
      zigD.isLocked = true;
    }
    // This call is outside the if block as we always want to update the node position in the layout engine as we drag.
    zigD.grapher?._layoutPlugin.lockNode({ index: zigD.index });
  }
}
