/**
 * Module for setting the express engines
 * @module init/engines
 */

const engines = require("consolidate");
const config = require("../config.json");
const log = require("../logger.js");
const helpers = require("../helpers.js");

function setHeadmanEngine(app) {
  app.engine("hbs", engines.handlebars);
}

function setUserEngine(app) {
  const { extension } = app.get("config").files.templates;
  const { engine, plugins } = app.get("config");

  if (engine.instance) {
    engines.requires[engine.name] = engine.instance;
  } else {
    for (const plugin of plugins) {
      if (plugin.engine) {
        engines.requires[engine.name] = plugin.engine;
      }
    }
  }

  try {
    app.engine(helpers.getSingleFileExtension(extension), engines[engine.name]);
  } catch (e) {
    log("error", config.messages.settingEngineFailed);
    return false;
  }

  return true;
}

module.exports = function initEngines(app) {
  setHeadmanEngine(app);
  const userEngineSet = setUserEngine(app);

  return userEngineSet;
};