const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const read = (file) => readFileSync(join(__dirname, "..", "dist", file), "utf8");

test("OMLDashboard exposes light and dark themes with stable branding hooks", () => {
  const types = read("dashboard.d.ts");
  const source = read("dashboard.js");
  const css = read("dashboard.css");

  assert.match(types, /type OMLDashboardTheme = "light" \| "dark"/);
  assert.match(types, /theme\?: OMLDashboardTheme \| null/);
  assert.match(source, /oml-dashboard--\$\{resolvedTheme\}/);
  assert.match(source, /data-oml-theme/);
  assert.match(css, /\.oml-dashboard--light/);
  assert.match(css, /--oml-color-scheme: light/);
  assert.match(css, /--oml-color-292929: #d8e0eaa3/);
  assert.match(css, /--oml-color-303030: #d8e0eaa3/);
  assert.match(css, /--oml-color-737373: #64748b/);
  assert.match(css, /box-shadow: none/);
  assert.match(source, /oml-dashboard__sidebar/);
  assert.match(source, /oml-dashboard__main/);
});

test("API Performance keeps endpoint controls client-side", () => {
  const source = read("dashboard.js");

  assert.match(
    source,
    /api-performance\?range=7d&limit=500&offset=0&sort=requests/,
  );
  assert.match(source, /matchingEndpoints\.slice\(offset, offset \+ pageSize\)/);
  assert.match(source, /setQuery\(e\.target\.value\);\s*setOffset\(0\)/);
  assert.match(source, /setMethod\(e\.target\.value\);\s*setOffset\(0\)/);
  assert.doesNotMatch(source, /setTimeout\(\(\) => \{\s*setSearch/);
});
