/* eslint-disable */
module.exports = {
name: "@samantha-uk/plugin-penguin",
factory: function (require) {
var plugin;plugin=(()=>{"use strict";var e={854:(e,t,o)=>{o.r(t),o.d(t,{default:()=>a});const r=require("clipanion");var n=function(e,t,o,r){var n,l=arguments.length,a=l<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,o):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,o,r);else for(var c=e.length-1;c>=0;c--)(n=e[c])&&(a=(l<3?n(a):l>3?n(t,o,a):n(t,o))||a);return l>3&&a&&Object.defineProperty(t,o,a),a};class l extends r.Command{constructor(){super(...arguments),this.name="John Doe"}async execute(){console.log(`Hello ${this.name}!`)}}n([r.Command.String("--name")],l.prototype,"name",void 0),n([r.Command.Path("hello","world")],l.prototype,"execute",null);const a={commands:[l]}}},t={};function o(r){if(t[r])return t[r].exports;var n=t[r]={exports:{}};return e[r](n,n.exports,o),n.exports}return o.d=(e,t)=>{for(var r in t)o.o(t,r)&&!o.o(e,r)&&Object.defineProperty(e,r,{enumerable:!0,get:t[r]})},o.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),o.r=e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},o(854)})();
return plugin;
}
};