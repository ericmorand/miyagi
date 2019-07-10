const logger = require("../../../lib/logger.js");
const helpers = require("../../../lib/render/_helpers.js");
const express = require("express");
const path = require("path");

logger.log = jest.fn();

describe("lib/render/_helpers", () => {
  describe("getFallbackData()", () => {
    describe("with data in variations", () => {
      test("returns the data of the first variation with data", () => {
        const variations = [
          {},
          {
            data: 2
          },
          {
            data: 3
          }
        ];

        expect(helpers.getFallbackData(variations)).toEqual(2);
      });
    });

    describe("without data in variations", () => {
      test("returns {}", () => {
        const variations = [{}, {}, {}];

        expect(helpers.getFallbackData(variations)).toEqual({});
      });
    });
  });

  describe("getComponentErrorHtml()", () => {
    describe("with passed error", () => {
      test("it renders the error", () => {
        expect(helpers.getComponentErrorHtml("error")).toEqual(
          '<p class="FreitagError">error</p>'
        );
      });
    });
    describe("with passed error being null", () => {
      test("it renders the error", () => {
        expect(helpers.getComponentErrorHtml(null)).toEqual(
          '<p class="FreitagError">Component couldn\'t be rendered.</p>'
        );
      });
    });
  });

  describe("getDataForRenderFunction()", () => {
    test("it sets engine specific keys on the given object", () => {
      const app = express();
      app.set("config", {
        srcFolder: "srcFolder"
      });
      app.set("state", {
        partials: "partials"
      });
      const req = {
        app
      };
      const fullPath = path.join(process.cwd(), "srcFolder");

      expect(
        helpers.getDataForRenderFunction(req, {
          foo: "bar"
        })
      ).toEqual({
        foo: "bar",
        partials: "partials",
        basedir: fullPath,
        root: fullPath,
        settings: {
          views: fullPath
        }
      });
    });
  });

  describe("mergeRootDataWithVariationData()", () => {
    const rootData = {
      merged: {
        root: true,
        data: "root"
      }
    };

    const variationData = {
      merged: {
        variation: true,
        data: "variation"
      }
    };

    describe("with only rootData given", () => {
      expect(helpers.mergeRootDataWithVariationData(rootData, null)).toEqual({
        merged: {
          root: true,
          data: "root"
        }
      });
    });

    describe("with only variationData given", () => {
      expect(
        helpers.mergeRootDataWithVariationData(null, variationData)
      ).toEqual({
        merged: {
          variation: true,
          data: "variation"
        }
      });
    });

    describe("with rootData and variationData given", () => {
      expect(
        helpers.mergeRootDataWithVariationData(rootData, variationData)
      ).toEqual({
        merged: {
          root: true,
          variation: true,
          data: "variation"
        }
      });
    });
  });

  describe("overwriteJsonLinksWithJsonData()", () => {
    test("resolves linked json data", async done => {
      const app = express();
      app.set("config", {
        srcFolder: "tests/mocks/"
      });
      const data = {};
      data[`${process.cwd()}/tests/mocks/resolve/resolve.json`] = {
        variations: [
          {
            name: "variation",
            data: {
              resolve: [
                {
                  component: "resolve/resolve/resolve.json"
                }
              ]
            }
          }
        ]
      };
      data[`${process.cwd()}/tests/mocks/resolve/resolve/resolve.json`] = {
        data: {
          resolve: {
            component: "resolve/resolve/resolve/resolve.json"
          }
        }
      };
      data[
        `${process.cwd()}/tests/mocks/resolve/resolve/resolve/resolve.json`
      ] = {
        data: {
          resolve: "resolve"
        }
      };

      app.set("state", {
        partials: "partials",
        data
      });
      const req = {
        app
      };

      expect(
        await helpers.overwriteJsonLinksWithJsonData(req, {
          resolve: {
            component: "resolve/resolve.json",
            variation: "variation"
          }
        })
      ).toEqual({
        resolve: {
          resolve: [
            {
              resolve: {
                resolve: "resolve"
              }
            }
          ]
        }
      });

      done();
    });

    describe("with passing null", () => {
      test("", async done => {
        const app = express();
        app.set("config", {
          srcFolder: "tests/mocks/"
        });
        const data = {};
        app.set("state", {
          partials: "partials",
          data
        });
        const req = {
          app
        };

        expect(
          await helpers.overwriteJsonLinksWithJsonData(req, {
            resolve: null
          })
        ).toEqual({
          resolve: null
        });

        done();
      });
    });

    describe("with value for component not being a data file", () => {
      test("deletes the entry.component key, returns the entry, logs error", async done => {
        const app = express();
        app.set("config", {
          srcFolder: "tests/mocks/"
        });
        app.set("state", {
          partials: "partials",
          data: {
            "some/component.json": "foo"
          }
        });
        const req = {
          app
        };
        const spy = jest.spyOn(logger, "log");

        expect(
          await helpers.overwriteJsonLinksWithJsonData(req, {
            resolve: {
              component: "some/component.foo"
            }
          })
        ).toEqual({
          resolve: {}
        });
        expect(spy).toHaveBeenCalledWith(
          "warn",
          "some/component.foo has not the correct file type."
        );

        done();
      });
    });

    describe("with value for component not being stored in data", () => {
      test("returns {}, logs error", async done => {
        const app = express();
        app.set("config", {
          srcFolder: "tests/mocks/"
        });
        app.set("state", {
          partials: "partials",
          data: {
            "some/component.json": "foo"
          }
        });
        const req = {
          app
        };
        const spy = jest.spyOn(logger, "log");

        expect(
          await helpers.overwriteJsonLinksWithJsonData(req, {
            resolve: {
              component: "some/component.json"
            }
          })
        ).toEqual({
          resolve: {}
        });
        expect(spy).toHaveBeenCalledWith(
          "warn",
          "Couldn't find file some/component.json. Please check that it's linked correctly."
        );

        done();
      });
    });

    describe("variant not having any data", () => {
      test("returns {}", async done => {
        const app = express();
        app.set("config", {
          srcFolder: "tests/mocks/"
        });
        const data = {};
        data[`${process.cwd()}/tests/mocks/resolve/resolve.json`] = {
          variations: [
            {
              name: "variation"
            }
          ]
        };

        app.set("state", {
          partials: "partials",
          data
        });
        const req = {
          app
        };

        expect(
          await helpers.overwriteJsonLinksWithJsonData(req, {
            resolve: {
              component: "resolve/resolve.json",
              variation: "variation"
            }
          })
        ).toEqual({
          resolve: {}
        });

        done();
      });
    });

    describe("variant not having any data", () => {
      test("returns {}", async done => {
        const app = express();
        app.set("config", {
          srcFolder: "tests/mocks/"
        });
        app.set("state", {
          partials: "partials"
        });
        const req = {
          app
        };

        expect(
          await helpers.overwriteJsonLinksWithJsonData(req, {
            resolve: {
              name: "variation"
            }
          })
        ).toEqual({
          resolve: {
            name: "variation"
          }
        });

        done();
      });
    });
  });
});