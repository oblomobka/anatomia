// Cortadora láser en isométrico: seis piezas, flechas X/Y/Z, rayo y etiquetas en español.
//   node examples/cortadora-laser/build.mjs          -> cortadora-laser.html y .svg
//   node scripts/export.mjs examples/cortadora-laser/cortadora-laser.html   -> .png y .pdf
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import { arrowSvg, axisTagSvg, labelSvg, beamSvg, fabSvg, fabPageHtml, FAB_KEYS } from "../../kit/fab.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const W = 760, H = 430;

// Medidas en unidades del kit. x derecha, y hacia el espectador, z arriba.
const BASE = { x: -120, y: -85, w: 240, d: 170, r: 4 }, BASE_H = 14;
const BED = { x: -92, y: -70, w: 184, d: 140, r: 2 }, BED_H = 6;
const SHEET = { x: -70, y: -50, w: 120, d: 90, r: 1 }, SHEET_H = 3;
const RAIL_W = 12, RAIL_H = 52, RAILS = [-120, 120 - RAIL_W];
const GY = -6;                                            // posición del puente en Y
const GANTRY = { x: -120, y: GY - 7, w: 240, d: 14, r: 1.5 }, G_H = 12, G_TOP = RAIL_H + G_H;
const HX = 6;                                             // posición del cabezal en X
const HEAD = { x: HX - 10, y: GY + 7, w: 20, d: 16, r: 2 }, HEAD_Z = 34, HEAD_H = 32;
const NOZ = [HX, GY + 15], NOZ_Z = 25;
const SHEET_TOP = BED_H + SHEET_H;

const P = k.fitProjection([...k.boxCorners(BASE, -BASE_H, G_TOP), [HX, GY, HEAD_Z + HEAD_H]], W, H, { pad: 70, azimuth: 40 });
const S = (paths, o) => k.solidSvg(paths, o);
const piece = (id, html) => `<g data-piece="${id}">${html}</g>`;

const base = `<path class="iso-halo" d="${k.haloOf(BASE, -BASE_H, BASE_H, P)}"/>` + S(k.slabOf(BASE, -BASE_H, BASE_H, P, 3, 0.8), { tone: "hi" });
const bed = S(k.slabOf(BED, 0, BED_H, P, 3, 0.6), { tone: "hi" })
  + k.dotsSvg(k.dotGrid(BED.x + 6, BED.y + 6, 25, 19, 7.2, BED_H, P), { size: 0.55, tone: "mid" });
const path = [[NOZ[0] - 30, NOZ[1]], [NOZ[0] - 30, NOZ[1] - 24], [NOZ[0], NOZ[1] - 24], [NOZ[0], NOZ[1]]];
const sheet = S(k.slabOf(SHEET, BED_H, SHEET_H, P, 2, 0.4), { tone: "hi", lit: true }) + k.lineSvg(k.onTop(path, SHEET_TOP, P), { tone: "mid", dashed: true });
const rail = (x) => S(k.slabOf({ x, y: BASE.y, w: RAIL_W, d: BASE.d, r: 1.5 }, 0, RAIL_H, P, 3, 0.5), { tone: "hi" });
const gantry = S(k.slabOf(GANTRY, RAIL_H, G_H, P, 3, 0.6), { tone: "hi", lit: true });
const head = S(k.slabOf(HEAD, HEAD_Z, HEAD_H, P, 3, 0.6), { tone: "hi", lit: true }) + S(k.cylinder(NOZ[0], NOZ[1], 4, NOZ_Z, HEAD_Z - NOZ_Z, P, 24), { tone: "hi", lit: true });

// Movimiento: X el cabezal por el puente, Y el puente por las guías, Z la mesa para enfocar.
const X = [[HX - 72, GY + 7, G_TOP + 5], [HX + 72, GY + 7, G_TOP + 5]];
const YX = RAILS[1] + RAIL_W / 2, Y = [[YX, GY + 16, RAIL_H + 4], [YX, BASE.y + BASE.d - 4, RAIL_H + 4]];
const Z = [[-100, BASE.y + BASE.d - 18, 2], [-100, BASE.y + BASE.d - 18, 40]];
const moves = [
  arrowSvg(P, ...X), axisTagSvg(P, X[1], "X", [16, -4]),
  arrowSvg(P, ...Y), axisTagSvg(P, Y[1], "Y", [-14, 10]),
  arrowSvg(P, ...Z), axisTagSvg(P, Z[1], "Z", [0, -16]),
].join("");

const labels = [
  labelSvg(P, [RAILS[0] + RAIL_W / 2, BASE.y + 30, RAIL_H], [250, 50], "Guía", { anchor: "end", sub: "el puente se desliza sobre ella" }),
  labelSvg(P, [HX - 60, GY - 7, G_TOP], [150, 120], "Puente", { anchor: "end", sub: "lleva el cabezal" }),
  labelSvg(P, [HX - 8, GY + 15, HEAD_Z + HEAD_H - 4], [520, 60], "Cabezal láser", { sub: "con lente de enfoque" }),
  labelSvg(P, [NOZ[0], NOZ[1], (NOZ_Z + SHEET_TOP) / 2], [640, 215], "Rayo láser", { sub: "corta o graba" }),
  labelSvg(P, [SHEET.x + 14, SHEET.y + SHEET.d - 10, SHEET_TOP], [160, 205], "Plancha de material", { anchor: "end" }),
  labelSvg(P, [BED.x + 14, BED.y + BED.d - 3, BED_H], [230, 345], "Mesa de panal", { anchor: "end", sub: "sube y baja para enfocar" }),
].join("");

// Orden de pintado: de atrás hacia delante, y encima las flechas y las etiquetas.
const body = [
  piece("base", base), piece("mesa", bed), piece("plancha", sheet),
  piece("guia-izquierda", rail(RAILS[0])), piece("guia-derecha", rail(RAILS[1])),
  piece("puente", gantry), piece("rayo", beamSvg(P, [NOZ[0], NOZ[1], NOZ_Z], [NOZ[0], NOZ[1], SHEET_TOP])), piece("cabezal", head),
  `<g data-layer="movimiento">${moves}</g>`, `<g data-layer="etiquetas">${labels}</g>`,
];
const label = "Cortadora láser en isométrico: base, mesa de panal con una plancha, dos guías laterales, un puente que avanza sobre las guías (eje Y) y un cabezal que recorre el puente (eje X). La mesa sube y baja para enfocar (eje Z).";

writeFileSync(join(HERE, "cortadora-laser.svg"), fabSvg({ width: W, height: H, label, body }));
writeFileSync(join(HERE, "cortadora-laser.html"), fabPageHtml({
  title: "Cortadora láser",
  hint: "Vista isométrica",
  keys: [FAB_KEYS.move, { mark: "red", label: "Rayo láser (en la máquina real no se ve)" }],
  caption: "El cabezal se mueve a lo largo del puente (X) y el puente avanza sobre las guías (Y): así el rayo puede llegar a cualquier punto de la plancha. La mesa sube o baja (Z) para que el rayo quede enfocado justo en la superficie del material.",
  svg: k.figureSvg({ width: W, height: H, label, body }),
}));
console.log("escrito cortadora-laser.html y cortadora-laser.svg");
