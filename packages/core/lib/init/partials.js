/**
 * Module for registering all partials
 * @module init/partials
 */

const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");
const log = require("../logger.js");
const helpers = require("../helpers.js");
const config = require("../config.json");

async function register(shortPath, fullFilePath) {
  return new Promise((resolve) => {
    fs.readFile(fullFilePath, "utf8", function registerPartialCallback(
      err,
      data
    ) {
      if (data) {
        handlebars.registerPartial(
          shortPath,
          handlebars.compile(data.toString())
        );
      } else {
        log(
          "warn",
          config.messages.fileNotFound.replace("{{filePath}}", shortPath)
        );
      }
      resolve();
    });
  });
}

async function registerLayouts() {
  return Promise.all(
    ["main", "iframe", "component_iframe"].map(
      (layout) =>
        new Promise((resolve) => {
          register(
            layout,
            path.join(
              __dirname,
              `../../${config.folders.views}/layouts/${layout}.hbs`
            )
          ).then(resolve);
        })
    )
  );
}

async function registerComponents(app) {
  return Promise.all(
    Object.entries(app.get("state").partials).map(
      (entry) =>
        new Promise((resolve) => {
          register(entry[0], entry[1]).then(resolve);
        })
    )
  );
}

async function registerPartial(app, fullPath) {
  return new Promise((resolve) => {
    register(helpers.getShortPathFromFullPath(app, fullPath), fullPath).then(
      resolve
    );
  });
}

async function registerAll(app) {
  const promises = [];

  promises.push(
    new Promise((resolve) => {
      registerLayouts().then(resolve);
    })
  );

  promises.push(
    new Promise((resolve) => {
      registerComponents(app).then(resolve);
    })
  );

  return Promise.all(promises);
}

module.exports = {
  registerPartial,
  registerAll,
};