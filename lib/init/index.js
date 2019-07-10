"use strict";

const compression = require("compression");
const express = require("express");
const handlebars = require("handlebars");
const handlebarsLayouts = require("handlebars-layouts");
const helmet = require("helmet");
const http = require("http");

const logger = require("../logger.js");
const setConfig = require("./config.js");
const setEngines = require("./engines.js");
const setPartials = require("./partials.js");
const setRouter = require("./router.js");
const setState = require("../state/index.js");
const setStatic = require("./static.js");
const setViewHelpers = require("./view-helpers.js");
const setViews = require("./views.js");
const setWatcher = require("./watcher.js");

module.exports = async function(appConfig, userConfig) {
  const app = express();
  setConfig(app, appConfig, userConfig);

  if (setEngines(app)) {
    const port = process.env.PORT || appConfig.defaultPort;
    const server = http.createServer(app);

    app.use(helmet());
    app.use(
      compression({
        threshold: 0
      })
    );
    app.set("port", port);

    await setState(app, {
      sourceTree: true,
      menu: true,
      partials: true,
      data: true
    });
    setStatic(app);
    setRouter(app);
    setViews(app);
    setViewHelpers(app);
    await setPartials.registerAll(app, true);
    handlebarsLayouts.register(handlebars);
    server.listen(app.get("port"));

    setWatcher(server, app, handlebars);

    logger.log(
      "info",
      appConfig.messages.serverStarted.replace("${port}", port)
    );

    return server;
  }
};