<!-- ⚠️ This README has been generated from the file(s) "blueprint.md" ⚠️--><h1 align="center">@samantha-uk/zigzag-panel</h1>
![](https://img.shields.io/static/v1?label=Version&message=0.2.0-alpha-0.3&color=orange)![Issues](https://img.shields.io/github/issues/Samantha-uk/one) ![(https://semver.org/)](https://img.shields.io/badge/SemVer-2.0.0-brightgreen)![GitHub](https://img.shields.io/github/license/Samantha-uk/one) ![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)![David](https://img.shields.io/david/Samantha-uk/one) ![Snyk Vulnerabilities for GitHub Repo](https://img.shields.io/snyk/vulnerabilities/github/Samantha-uk/one)![Maintained](https://img.shields.io/maintenance/yes/2021)


[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/grass.png)](#table-of-contents)

## Table of Contents

* [Description](#description)
* [Installation](#installation)
	* [Prerequisites](#prerequisites)
	* [Installation Steps](#installation-steps)
* [Configuration](#configuration)
* [Know Issues/Limitations](#know-issueslimitations)
* [License](#license)


[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/grass.png)](#description)

## Description
Zigzag-panel is a custom panel for [Home Assistant](https://www.home-assistant.io/) that displays a graphical layout of Zigbee devices and the connections between them.

In Zigzag, Zigbee devices are known as Zigs and the connections between them as Zags.

Zigzag-panel is built using Zigzag-wc.

_Zigzag is currently an alpha release. There are likely to be a number of issues and new releases may be frequent._


[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/grass.png)](#installation)

## Installation
At present the installation of Zigzag is a manual process.

### Prerequisites

- [Home Assistant](https://www.home-assistant.io/) - version `2020.12.0` or more recent. 
- [ZHA](https://www.home-assistant.io/integrations/zha/) - A Home Assistant Zigbee Integration.
 _The plugin architecture of Zigzag means new sources of Zigbee information can be easily added.  Support for zigbee2mqtt is under investigation._

### Installation Steps

You will need to:

- Copy the [zigzag](/zigzag/) directory (_and its contents_) to a `zigzag` directory in the `www` folder of your Home Assistant server.
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



[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/grass.png)](#configuration)

## Configuration
At present configuring Zigzag-panel is carried out using entries in the Home Assistant `configuration.yaml` file.


[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/grass.png)](#know-issueslimitations)

## Know Issues/Limitations
There are several known issues that will be addressed soon, including:
- Not saving the layout when you leave the page.
- Not allowing unlocking of Zigs without using the unlock all button.
- Zoom to fit ... doesn't!


[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/grass.png)](#license)

## License
	
Licensed under [MIT](https://opensource.org/licenses/MIT).
