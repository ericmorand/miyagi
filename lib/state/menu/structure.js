"use strict";

const path = require("path");
const config = require("../../config.json");
const logger = require("../../logger.js");
const helpers = require("../../helpers.js");

function handleFileResult(app, json, obj, fullPath, jsonChild) {
  const variations = json.variations;
  const shortPath = helpers.getShortPathFromFullPath(app, fullPath);

  if (
    variations &&
    variations.length &&
    obj.name === path.basename(jsonChild.name, `.${config.dataFileType}`)
  ) {
    if (json.data) {
      obj.variations = [{ name: obj.name, data: json.data }].concat(variations);
    } else {
      obj.variations = variations;
    }
    obj.variations = obj.variations.filter((variation, i) => {
      if (variation.name && variation.data) {
        return variation;
      } else {
        if (!variation.name) {
          logger.log(
            "warn",
            config.messages.noNameSetForVariation
              .replace("${i}", i)
              .replace("${file}", shortPath)
          );
        } else {
          logger.log(
            "warn",
            config.messages.noDataSetForVariation
              .replace("${variation}", variation.name)
              .replace("${file}", shortPath)
          );
        }
        return false;
      }
    });
  }

  return obj;
}

function getFileContent(app, obj, jsonChild) {
  const fullPath = jsonChild.path;
  let result;

  if (app.get("state").data[fullPath]) {
    result = app.get("state").data[fullPath];
  } else {
    result = {};
  }

  return handleFileResult(app, result, obj, fullPath, jsonChild);
}

function addVariations(app, obj) {
  const jsonChild = obj.children.filter(
    o =>
      path.basename(o.name, `.${config.dataFileType}`) === obj.name &&
      o.extension === `.${config.dataFileType}`
  )[0];
  if (jsonChild) {
    return getFileContent(app, obj, jsonChild);
  } else {
    return obj;
  }
}

function updateSourceObject(app, obj) {
  if (obj.path) {
    obj.shortPath = helpers.getShortPathFromFullPath(app, obj.path);
  }

  if (obj.children) {
    obj = addVariations(app, obj);

    obj.children.map(child => {
      updateSourceObject(app, child);
    });
  }

  return obj;
}

module.exports = function(app) {
  const result = updateSourceObject(app, app.get("state").sourceTree);

  (function loop(obj, index) {
    obj.index = index;

    if (obj.children) {
      obj.children.forEach(child => {
        const newIndex = child.type === "directory" ? index + 1 : index;
        loop(child, newIndex);
      });
    }
  })(result, -1);

  return result && result.children ? result.children : [];
};