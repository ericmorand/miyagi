/**
 * Module for rendering a variation link in the menu
 * @module render/menu/variation-link
 */

const classes = require("./classes.js");
const helpers = require("../../helpers.js");
const menuHelpers = require("./helpers.js");

function render(isBuild, component, variation, current) {
  const href = isBuild
    ? `component-${component.normalizedShortPath}-${helpers.normalizeString(
        variation.name
      )}-embedded.html`
    : `/component?file=${component.shortPath}&variation=${encodeURI(
        variation.name
      )}&embedded=true`;

  return `<a class="${classes.link} ${classes.link}--lvl${component.index} ${
    classes.link
  }--variation" target="iframe" href="${href}"${
    current ? menuHelpers.activeState : ""
  }>${variation.name}</a>`;
}

module.exports = {
  render,
};