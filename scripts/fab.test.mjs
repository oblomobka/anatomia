import { test } from "node:test";
import assert from "node:assert/strict";
import { fitProjection, boxCorners } from "../kit/iso-kit.mjs";
import { arrowSvg, axisTagSvg, labelSvg, beamSvg, fabSvg, fabPageHtml } from "../kit/fab.mjs";

const P = fitProjection(boxCorners({ x: -50, y: -50, w: 100, d: 100, r: 0 }, 0, 50), 400, 300);

test("arrowSvg dibuja una punta o dos", () => {
  assert.equal((arrowSvg(P, [0, 0, 0], [40, 0, 0]).match(/fab-move-head/g) || []).length, 2);
  assert.equal((arrowSvg(P, [0, 0, 0], [40, 0, 0], { both: false }).match(/fab-move-head/g) || []).length, 1);
});

test("labelSvg escapa el texto y pone el subtítulo", () => {
  const svg = labelSvg(P, [0, 0, 0], [10, 10], "Mesa <panal> & co", { sub: "sube y baja" });
  assert.match(svg, /Mesa &lt;panal&gt; &amp; co/);
  assert.match(svg, /class="fab-sub"[^>]*>sube y baja</);
});

test("axisTagSvg y beamSvg aceptan puntos de pantalla", () => {
  assert.match(axisTagSvg(P, [100, 100], "X"), /cx="100" cy="100"/);
  assert.match(beamSvg(P, [0, 0], [0, 20]), /M0 0L0 20/);
});

test("fabSvg es un SVG autónomo en tema claro con los estilos fab", () => {
  const svg = fabSvg({ width: 100, height: 80, label: "prueba", body: "" });
  assert.match(svg, /data-theme="light"/);
  assert.match(svg, /\.fab-move-line/);
});

test("fabPageHtml está en español", () => {
  assert.match(fabPageHtml({ title: "T", svg: "<svg></svg>" }), /<html lang="es">/);
});
