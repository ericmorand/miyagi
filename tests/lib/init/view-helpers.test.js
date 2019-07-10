const express = require("express");
const handlebars = require("handlebars");
const viewHelpers = require("../../../lib/init/view-helpers.js");
const menu = require("../../../lib/render/menu/index.js");
const registerHelper = handlebars.registerHelper;

jest.mock("../../../lib/render/menu/index.js", () => {
  return {
    render: jest.fn(() => "menuHtml")
  };
});

afterEach(() => {
  jest.resetModules();
  jest.resetAllMocks();
});

describe("lib/init/view-helpers", () => {
  const app = express();
  app.set("config", {
    cssFiles: ["index.css"],
    jsFiles: ["index.js"]
  });

  describe("", () => {
    test("calls handlebars.registerHelper with renderMenu", () => {
      handlebars.registerHelper = jest.fn();
      viewHelpers(app);

      expect(handlebars.registerHelper.mock.calls[0][0]).toEqual("renderMenu");
      expect(typeof handlebars.registerHelper.mock.calls[0][1]).toEqual(
        "function"
      );
    });

    test("calls handlebars.registerHelper with cssFiles", () => {
      handlebars.registerHelper = jest.fn();
      viewHelpers(app);

      expect(handlebars.registerHelper.mock.calls[1][0]).toEqual("cssFiles");
      expect(handlebars.registerHelper.mock.calls[1][1]).toEqual(
        '<link rel="stylesheet" href="index.css">'
      );
    });

    test("calls handlebars.registerHelper with jsFiles", () => {
      handlebars.registerHelper = jest.fn();
      viewHelpers(app);

      expect(handlebars.registerHelper.mock.calls[2][0]).toEqual("jsFiles");
      expect(handlebars.registerHelper.mock.calls[2][1]).toEqual(
        '<script src="index.js" defer></script>'
      );
    });
  });

  describe("renderMenu", () => {
    app.set("config", {
      cssFiles: ["index.css"],
      jsFiles: ["index.js"]
    });

    test("returns the result from render/menu/index", () => {
      handlebars.registerHelper = registerHelper;
      menu.render = jest.fn(() => "menuHtml");
      viewHelpers(app);

      const template = handlebars.compile("{{#renderMenu}}{{/renderMenu}}");

      expect(template()).toEqual("menuHtml");
    });
  });
});