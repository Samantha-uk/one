{{ template:title }}
{{ template:packageVersion }}{{ template:issues }} {{ template:semver }}{{ template:licence }} {{ template:commitizen }}{{ template:dependencies }} {{ template:vulnerabilities }}{{ template:maintained }}

{{ template:toc }}

## Description
Zigzag-panel is a custom panel for [Home Assistant](https://www.home-assistant.io/) that displays a graphical layout of Zigbee devices and the connections between them.

In Zigzag, Zigbee devices are known as Zigs and the connections between them as Zags.

Zigzag-panel is built using Zigzag-wc.

_Zigzag is currently an alpha release. There are likely to be a number of issues and new releases may be frequent._

## Installation
At present the installation of Zigzag is a manual process.

### Prerequisites

- [Home Assistant](https://www.home-assistant.io/) - version `2020.12.0` or more recent. 
- [ZHA](https://www.home-assistant.io/integrations/zha/) - A Home Assistant Zigbee Integration.
 _The plugin architecture of Zigzag means new sources of Zigbee information can be easily added.  Support for zigbee2mqtt is under investigation._

### Installation Steps

You will need to:

- Copy the [`zigzag`](/zigzag/) directory (_and its contents_) to a `zigzag` directory in the `www` folder of your Home Assistant server.
It should then look something like this:
```
└── www
    └── zigzag
        ├── plugins
        │   ├── plugin-data-file.esm.js
        │   ├── plugin-data-gen.esm.js
        │   ├── plugin-data-zha.esm.js
        │   ├── plugin-layout-d3.esm.js
        │   └── plugin-render-pixi.esm.js
        ├── zigzag-panel-config.yaml
        └── zigzag-panel.esm.js
```
- Copy the contents of `zigzag/zigzag-panel-config.yaml` into your Home Assistant `configuration.yaml` file.
- Restart Home Assistant.
- Zigzag should appear as an entry on the left of the display, which if you select should display your Zigbee network.
_If not, check in the console of your web browser for any error messages._


## Configuration
At present configuring Zigzag-panel is carried out using entries in the Home Assistant `configuration.yaml` file.

## Know Issues/Limitations
There are several known issues that will be addressed soon, including:
- Not saving the layout when you leave the page.
- Not allowing unlocking of Zigs without using the unlock all button.
- Zoom to fit ... doesn't!

{{ template:license }}