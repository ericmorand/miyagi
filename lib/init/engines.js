"use strict";

const path = require("path");
const engines = require("consolidate");
const config = require("../config.json");
const logger = require("../logger.js");

module.exports = function(app) {
  app.engine("hbs", engines.handlebars);
  app.set("view engine", "hbs");

  try {
    app.engine(app.get("config").extension, engines[app.get("config").engine]);
    app.set("view engine", app.get("config").extension);
  } catch (e) {
    logger.log("error", config.messages.settingEngineFailed);
    return false;
  }

  if (app.get("config").engine === "twig") {
    const originalRender = app.render;
    const render = function() {
      originalRender.call(
        this,
        arguments[0],
        Object.assign({}, arguments[1], {
          path: path.join(process.cwd(), app.get("config").srcFolder),
          allowInlineIncludes: true
        }),
        arguments[2]
      );
    };

    app.render = render;
  }

  return true;
};