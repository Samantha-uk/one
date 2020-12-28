{{ template:title }}
{{ template:version }} {{ template:licence }} {{ template:dependencies }}  {{ template:vulnerabilities }}
{{ template:toc }}

## Description
A _very_ opinionated compile/bundle tool that uses Rollup & Typescript to transpile & bundle code.  Any package that uses builder only requires a single entry in `devDependencies` of `{{ pkg.name }}`, easing the maintenance of the `package.json`.

## Usage
Intended for internal usage only.

{{ template:license }}