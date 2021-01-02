import {
  mdiLockOutline,
  mdiRadioTower,
  mdiHelp,
  mdiZigbee,
  mdiLightbulb,
  mdiMotionSensor,
  mdiBattery,
  mdiPowerPlug,
  mdiDoorClosedLock,
  mdiRemote,
  mdiHomeThermometer,
  mdiElectricSwitch,
  mdiAccessPointNetwork,
} from "@mdi/js";
import svgpath from "svgpath"; // https://github.com/fontello/svgpath
import { svgPathBbox } from "svg-path-bbox"; // https://github.com/mondeja/svg-path-bbox
import { svgMesh } from "./svg-path-strings";

export class IconHelper {
  public static getIconPath(iconName: string): string {
    switch (iconName) {
      // Power Types.
      case `Mains`:
        return mdiPowerPlug;
      case `Battery or Unknown`:
        return mdiBattery;

      // Device Types
      case `Coordinator`:
        return mdiRadioTower;
      case `Router`:
        return svgMesh;
      case `EndDevice`:
        return mdiZigbee;
      case `IAS_ZONE`:
        return mdiAccessPointNetwork;

      // Lock.
      case `Lock`:
        return mdiLockOutline;

      // Endpoints.
      case `COLOR_DIMMABLE_LIGHT`:
      case `COLOR_TEMPERATURE_LIGHT`:
      case `DIMMABLE_LIGHT`:
      case `EXTENDED_COLOR_LIGHT`:
        return mdiLightbulb;

      case `COLOR_CONTROLLER`:
      case `COLOR_DIMMER_SWITCH`:
      case `CONTROLLER`:
      case `NON_COLOR_CONTROLLER`:
      case `NON_COLOR_SCENE_CONTROLLER`:
      case `REMOTE_CONTROL`:
      case `SCENE_CONTROLLER`:
        return mdiRemote;

      case `DOOR_LOCK`:
        return mdiDoorClosedLock;

      case `OCCUPANCY_SENSOR`:
        return mdiMotionSensor;

      case `TEMPERATURE_SENSOR`:
        return mdiHomeThermometer;

      case `ON_OFF_LIGHT_SWITCH`:
      case `ON_OFF_OUTPUT`:
      case `ON_OFF_PLUG_IN_UNIT`:
      case `SMART_PLUG`:
        return mdiElectricSwitch;

      default:
        return mdiHelp;
    }
  }

  public static getNormalizedIconPath(iconName: string): string {
    const nPath = IconHelper.normalizePath(IconHelper.getIconPath(iconName));
    return nPath;
  }

  public static normalizePath(iconPath: string): string {
    const [minX, minY, maxX, maxY] = svgPathBbox(iconPath);
    const xSize = maxX - minX;
    const ySize = maxY - minY;
    return svgpath(iconPath)
      .translate(-minX, -minY)
      .scale(10 / Math.max(xSize, ySize))
      .toString();
  }
}
