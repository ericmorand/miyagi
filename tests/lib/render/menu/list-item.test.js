const listItem = require("../../../../lib/render/menu/list-item.js");

beforeEach(() => {
  jest.resetModules();
  jest.resetAllMocks();
});

describe("lib/menu/elements/list-item", () => {
  test("renders the correct listItem html", () => {
    expect(listItem.render({ index: 1 }, "content", "variation")).toEqual(
      `<li class="Freitag-listItem Freitag-listItem--variation Freitag-listItem--lvl1">content</li>`
    );
  });
});