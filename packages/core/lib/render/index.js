/**
 * Rendering module
 * @module render
 */

const path = require("path");
const jsonToYaml = require("json-to-pretty-yaml");
const tests = require("./tests.json");
const config = require("../config.json");
const helpers = require("../helpers.js");
const validateSchema = require("../validator/schema.js");
const {
  extendTemplateData,
  resolveData,
  getComponentErrorHtml,
  getDataForRenderFunction,
  getFallbackData,
} = require("./helpers.js");

async function renderVariations({
  app,
  res,
  file,
  context,
  componentDocumentation,
  componentSchema,
  name,
  cb,
  schemaType,
}) {
  const variations = [];
  const promises = [];
  const { extension } = app.get("config").files.templates;
  const validatedSchema = validateSchema(app, file, context);

  for (let i = 0, len = context.length; i < len; i += 1) {
    const entry = context[i];
    promises.push(
      new Promise((resolve) => {
        app.render(
          file,
          getDataForRenderFunction(app, entry.data),
          (err, result) => {
            const baseName = file.replace(`.${extension}`, "");
            const variation = context[i].name;

            variations[i] = {
              url: app.get("config").isBuild
                ? `component-${helpers.normalizeString(
                    baseName
                  )}-${helpers.normalizeString(variation)}-embedded.html`
                : `/component?file=${file}&variation=${variation}&embedded=true`,
              file,
              html:
                typeof result === "string"
                  ? result
                  : getComponentErrorHtml(err),
              variation,
            };

            if (validatedSchema !== null) {
              variations[i].schemaValidation = {
                valid: validatedSchema[i],
                copy:
                  config.messages.schemaValidator[
                    validatedSchema[i] ? "valid" : "invalid"
                  ],
              };
            }

            resolve(result);
          }
        );
      })
    );
  }

  await Promise.all(promises).then(async () => {
    const { ui } = app.get("config");

    await res.render(
      "component_variations.hbs",
      {
        variations,
        dev: process.env.NODE_ENV === "development",
        prod: process.env.NODE_ENV === "production",
        a11yTestsPreload: ui.validations.accessibility,
        projectName: config.projectName,
        userProjectName: app.get("config").projectName,
        isBuild: app.get("config").isBuild,
        theme: app.get("config").ui.theme,
        documentation: componentDocumentation,
        schema: componentSchema,
        folder: path.join(
          app.get("config").components.folder,
          file.split(path.sep).slice(0, -1).join("/")
        ),
        name,
        schemaType,
      },
      (err, html) => {
        if (res.send) {
          if (html) {
            res.send(html);
          } else {
            res.send(err);
          }
        }

        if (cb) {
          cb(html);
        }
      }
    );
  });
}

async function renderSingleComponent({
  app,
  res,
  file,
  context,
  standaloneUrl,
  cb,
}) {
  return new Promise((resolve) => {
    app.render(
      file,
      getDataForRenderFunction(app, context),
      async (error, result) => {
        const { ui } = app.get("config");

        await res.render(
          standaloneUrl ? "component_frame.hbs" : "component.hbs",
          {
            html:
              typeof result === "string"
                ? result
                : getComponentErrorHtml(error),
            htmlValidation: ui.validations.html,
            accessibilityValidation:
              standaloneUrl && ui.validations.accessibility,
            standalone: !standaloneUrl,
            standaloneUrl,
            dev: process.env.NODE_ENV === "development",
            prod: process.env.NODE_ENV === "production",
            projectName: config.projectName,
            userProjectName: app.get("config").projectName,
            isBuild: app.get("config").isBuild,
          },
          (err, html) => {
            if (res.send) {
              if (html) {
                res.send(html);
              }
            }

            if (cb) {
              cb(html);
            }
          }
        );

        resolve();
      }
    );
  });
}

function renderMain({ app, res, cb }) {
  res.render(
    "index.hbs",
    {
      folders: app.get("state").menu,
      iframeSrc: app.get("config").isBuild
        ? "component-all-embedded.html"
        : "/component?file=all&embedded=true",
      showAll: true,
      hideTests: true,
      tests,
      projectName: config.projectName,
      userProjectName: app.get("config").projectName,
      indexPath: app.get("config").isBuild
        ? "component-all-embedded.html"
        : "/component?file=all&embedded=true",
      headmanDev: !!process.env.HEADMAN_DEVELOPMENT,
      headmanProd: !process.env.HEADMAN_DEVELOPMENT,
      isBuild: app.get("config").isBuild,
      theme: app.get("config").ui.theme,
    },
    (err, html) => {
      if (res.send) {
        if (html) {
          res.send(html);
        } else {
          res.send(err);
        }
      }

      if (cb) {
        cb(html);
      }
    }
  );
}

async function renderMainWithComponent({ app, res, file, variation, cb }) {
  let iframeSrc = app.get("config").isBuild
    ? `/component-${helpers.normalizeString(
        file.replace(`.${app.get("config").files.templates.extension}`, "")
      )}.html`
    : `/component?file=${file}`;

  const hideTests =
    !app.get("config").ui.validations.accessibility &&
    !app.get("config").ui.validations.html;

  if (variation) {
    if (app.get("config").isBuild) {
      iframeSrc = iframeSrc.replace(
        ".html",
        `-${helpers.normalizeString(variation)}.html`
      );
    } else {
      iframeSrc += `&variation=${variation}`;
    }
  }

  if (app.get("config").isBuild) {
    iframeSrc = iframeSrc.replace(".html", "-embedded.html");
  } else {
    iframeSrc += "&embedded=true";
  }

  await res.render(
    "index.hbs",
    {
      folders: app.get("state").menu,
      iframeSrc,
      requestedComponent: file,
      requestedVariation: variation,
      hideTests,
      tests,
      projectName: config.projectName,
      userProjectName: app.get("config").projectName,
      indexPath: app.get("config").isBuild
        ? "component-all-embedded.html"
        : "/component?file=all&embedded=true",
      headmanDev: !!process.env.HEADMAN_DEVELOPMENT,
      headmanProd: !process.env.HEADMAN_DEVELOPMENT,
      isBuild: app.get("config").isBuild,
      theme: app.get("config").ui.theme,
    },
    (err, html) => {
      if (res.send) {
        if (html) {
          res.send(html);
        } else {
          res.send(err);
        }
      }

      if (cb) {
        cb(html);
      }
    }
  );
}

async function renderMainWith404({ app, res, file, variation }) {
  let iframeSrc = `/component?file=${file}`;

  if (variation) {
    iframeSrc += `&variation=${variation}`;
  }

  iframeSrc += "&embedded=true";

  await res.render("index.hbs", {
    folders: app.get("state").menu,
    iframeSrc,
    requestedComponent: null,
    requestedVariation: null,
    hideTests: true,
    projectName: config.projectName,
    userProjectName: app.get("config").projectName,
    htmlValidation: false,
    accessibilityValidation: false,
    headmanDev: !!process.env.HEADMAN_DEVELOPMENT,
    headmanProd: !process.env.HEADMAN_DEVELOPMENT,
    isBuild: app.get("config").isBuild,
    theme: app.get("config").ui.theme,
  });
}

async function renderComponent({ app, res, file, variation, embedded, cb }) {
  const componentJson = helpers.cloneDeep(
    app.get("state").fileContents[
      helpers.getFullPathFromShortPath(
        app,
        helpers.getDataPathFromTemplatePath(app, file)
      )
    ] || {}
  );
  const componentVariations = componentJson.$variants;
  let componentRootData = helpers.removeInternalKeys(componentJson);
  let componentData;

  if (componentVariations && variation) {
    let variationJson = componentVariations.find(
      (vari) => vari.$name === decodeURI(variation)
    );

    if (variationJson) {
      componentData = helpers.removeInternalKeys(variationJson);
    }
  }

  componentData = await resolveData(app, componentData, componentRootData);

  componentData = await extendTemplateData(
    app.get("config"),
    componentData,
    file
  );

  validateSchema(app, file, [
    {
      data: componentData,
      name: variation,
    },
  ]);

  let standaloneUrl;

  if (embedded) {
    if (app.get("config").isBuild) {
      standaloneUrl = `component-${helpers.normalizeString(
        file.replace(`.${app.get("config").files.templates.extension}`, "")
      )}-${helpers.normalizeString(variation)}.html`;
    } else {
      standaloneUrl = `/component?file=${file}&variation=${variation}`;
    }
  } else {
    standaloneUrl = null;
  }

  await renderSingleComponent({
    app,
    res,
    file,
    context: componentData,
    standaloneUrl,
    cb,
  });
}

async function renderComponentVariations({ app, res, file, cb }) {
  const componentJson = helpers.cloneDeep(
    app.get("state").fileContents[
      helpers.getFullPathFromShortPath(
        app,
        helpers.getDataPathFromTemplatePath(app, file)
      )
    ]
  );
  const componentDocumentation = app.get("state").fileContents[
    helpers.getFullPathFromShortPath(
      app,
      helpers.getDocumentationPathFromTemplatePath(app, file)
    )
  ];
  const componentInfo = app.get("state").fileContents[
    helpers.getFullPathFromShortPath(
      app,
      helpers.getInfoPathFromTemplatePath(app, file)
    )
  ];
  const componentSchema = app.get("state").fileContents[
    helpers.getFullPathFromShortPath(
      app,
      helpers.getSchemaPathFromTemplatePath(app, file)
    )
  ];

  let componentSchemaString;
  if (componentSchema) {
    if (app.get("config").files.schema.extension === "yaml") {
      componentSchemaString = jsonToYaml.stringify(componentSchema);
    } else {
      componentSchemaString = JSON.stringify(componentSchema, 0, 2);
    }
  }

  let componentName = path.basename(path.dirname(file));

  if (componentInfo) {
    if (componentInfo.name) {
      componentName = componentInfo.name;
    }
  }

  if (componentJson) {
    let context = [];
    let componentData = helpers.removeInternalKeys(componentJson);
    const componentVariations = componentJson.$variants;

    if (Object.keys(componentData).length > 0) {
      componentData = await resolveData(app, componentData);
      componentData = await extendTemplateData(
        app.get("config"),
        componentData,
        file
      );

      if (!componentJson.$hidden) {
        context.push({
          component: file,
          data: componentData,
          name: componentJson.$name || config.defaultVariationName,
        });
      }
    } else {
      componentData = await extendTemplateData(
        app.get("config"),
        componentData,
        file
      );
    }

    if (componentVariations) {
      const promises = [];
      let startIndex = context.length;
      for (const [index, variationJson] of componentVariations.entries()) {
        if (variationJson.$name) {
          promises.push(
            new Promise((resolve) => {
              let variationData = helpers.removeInternalKeys(variationJson);

              resolveData(app, variationData, componentData).then(
                async (data) => {
                  data = await extendTemplateData(
                    app.get("config"),
                    data,
                    file
                  );

                  context[startIndex + index] = {
                    component: file,
                    data: data || {},
                    name: variationJson.$name,
                  };
                  resolve();
                }
              );
            })
          );
        }
      }

      await Promise.all(promises).then(async () => {
        await renderVariations({
          app,
          res,
          file,
          context: context.filter((entry) => entry !== null),
          componentDocumentation,
          componentSchema: componentSchemaString,
          name: componentName,
          cb,
          schemaType: app.get("config").files.schema.extension,
        });
      });
    } else {
      await renderVariations({
        app,
        res,
        file,
        context,
        componentDocumentation,
        componentSchema: componentSchemaString,
        name: componentName,
        cb,
        schemaType: app.get("config").files.schema.extension,
      });
    }
  } else {
    const componentData = await extendTemplateData(
      app.get("config"),
      {
        component: file,
        name: config.defaultVariationName,
      },
      file
    );

    await renderVariations({
      app,
      res,
      file,
      context: [componentData],
      componentDocumentation,
      componentSchema: componentSchemaString,
      name: componentName,
      cb,
      schemaType: app.get("config").files.schema.extension,
    });
  }
}

async function renderComponentOverview({ app, res, cb }) {
  const arr = [];
  const promises = [];
  let components;

  const documentation = app.get("state").fileContents[
    helpers.getFullPathFromShortPath(
      app,
      `index.${app.get("config").files.docs.extension}`
    )
  ];

  if (app.get("config").ui.renderComponentOverview) {
    components = [];

    for (const partialPath in app.get("state").partials) {
      const componentInfo =
        app.get("state").fileContents[
          helpers.getFullPathFromShortPath(
            app,
            helpers.getInfoPathFromTemplatePath(app, partialPath)
          )
        ] || {};
      const componentJson =
        app.get("state").fileContents[
          helpers.getFullPathFromShortPath(
            app,
            helpers.getDataPathFromTemplatePath(app, partialPath)
          )
        ] || {};
      let componentData;
      const componentRootData = helpers.removeInternalKeys(componentJson);

      if (Object.keys(componentRootData).length > 0) {
        if (componentRootData.$hidden) {
          if (componentJson.$variants && componentJson.$variants.length) {
            componentData = getFallbackData(
              componentJson.$variants,
              componentRootData
            );
          }
        } else {
          componentData = componentRootData;
        }
      } else if (componentJson.$variants && componentJson.$variants.length) {
        componentData = getFallbackData(componentJson.$variants);
      }

      components.push([
        partialPath,
        componentData,
        componentInfo.name ||
          path.basename(
            path.dirname(
              partialPath,
              `.${app.get("config").files.templates.extension}`
            )
          ),
        partialPath.split(path.sep).slice(0, -2),
      ]);
    }

    for (let i = 0, len = components.length; i < len; i += 1) {
      const component = components[i];
      promises.push(
        new Promise((resolve) => {
          const [componentPath] = component;

          let [, componentData = {}] = component;
          resolveData(app, componentData).then(async (data) => {
            data = await extendTemplateData(
              app.get("config"),
              data,
              componentPath
            );

            app.render(
              componentPath,
              getDataForRenderFunction(app, data),
              (err, result) => {
                const [file, , name, folders] = components[i];
                arr[i] = {
                  url: app.get("config").isBuild
                    ? `component-${helpers.normalizeString(
                        componentPath.replace(
                          `.${app.get("config").files.templates.extension}`,
                          ""
                        )
                      )}-embedded.html`
                    : `/component?file=${file}&embedded=true`,
                  name,
                  folders,
                  html:
                    typeof result === "string"
                      ? result
                      : getComponentErrorHtml(err),
                };

                resolve();
              }
            );
          });
        })
      );
    }
  }

  await Promise.all(promises).then(async () => {
    const { ui } = app.get("config");

    await res.render(
      "component_overview.hbs",
      {
        components: arr,
        dev: process.env.NODE_ENV === "development",
        prod: process.env.NODE_ENV === "production",
        a11yTestsPreload: ui.validations.accessibility,
        projectName: config.projectName,
        userProjectName: app.get("config").projectName,
        isBuild: app.get("config").isBuild,
        theme: app.get("config").ui.theme,
        documentation,
        renderComponentOverview: ui.renderComponentOverview,
      },
      (err, html) => {
        if (res.send) {
          if (html) {
            res.send(html);
          } else {
            res.send(err);
          }
        }

        if (cb) {
          cb(html);
        }
      }
    );
  });
}

async function renderComponentNotFound({ app, res, embedded, target }) {
  await res.render(embedded ? "component_frame.hbs" : "component.hbs", {
    html: `<p class="HeadmanError">${target} not found.</p>`,
    dev: process.env.NODE_ENV === "development",
    prod: process.env.NODE_ENV === "production",
    projectName: config.projectName,
    userProjectName: app.get("config").projectName,
    htmlValidation: false,
    accessibilityValidation: false,
    isBuild: app.get("config").isBuild,
    theme: app.get("config").ui.theme,
  });
}

module.exports = {
  renderMain,
  renderMainWithComponent,
  renderMainWith404,
  renderComponent,
  renderComponentVariations,
  renderComponentOverview,
  renderComponentNotFound,
};