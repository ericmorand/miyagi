"use strict";

const path = require("path");
const express = require("express");
const config = require("../config.json");

function registerUserFiles(app, files) {
  app.get("config")[files].forEach(file => {
    app.use(
      `/${path.dirname(file)}`,
      express.static(path.join(process.cwd(), path.dirname(file)))
    );
  });
}

function registerNodeModule(app, nodeModule) {
  app.use(
    `/${config.projectName}/js`,
    express.static(path.join(process.cwd(), `node_modules/${nodeModule}`))
  );
}

module.exports = function(app) {
  const assetFolder =
    config.folders.assets[
      process.env.FREITAG_DEVELOPMENT ? "development" : "production"
    ];

  registerUserFiles(app, "cssFiles");
  registerUserFiles(app, "jsFiles");
  registerNodeModule(app, "socket.io-client/dist");
  registerNodeModule(app, "axe-core");

  app.use(
    `/${config.projectName}`,
    express.static(path.join(__dirname, `../../${assetFolder}`))
  );
};