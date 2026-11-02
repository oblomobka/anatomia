// Cortadora láser en isométrico: máquina neutra, material en color, recorrido del rayo con espejos y flechas X/Y/Z.
//   node examples/cortadora-laser/build.mjs          -> cortadora-laser.html y .svg
//   node scripts/export.mjs examples/cortadora-laser/cortadora-laser.html   -> .png y .pdf
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as G from "../../kit/lathe.mjs";
import { arrowSvg, axisTagSvg, labelSvg, beamSvg, materialSvg, cutSvg, sparkSvg, mirrorSvg, fabSvg, fabPageHtml, FAB_KEYS } from "../../kit/fab.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const W = 780, H = 470;

// Medidas en unidades del kit. x derecha, y hacia el espectador, z arriba.
const CAB = { x: -120, y: -92, w: 240, d: 184, r: 4 }, CAB_H = 40;          // mueble de la máquina
const BED = { x: -96, y: -50, w: 176, d: 130, r: 2 }, BED_H = 5;           // mesa de panal
const SHEET = { x: -74, y: -30, w: 136, d: 100, r: 1 }, SHEET_H = 3;       // plancha de material
const TOP = BED_H + SHEET_H;
const RAIL_X = [-106, 106], RAIL = { y: -60, d: 132 }, RAIL_H = 14, ROD_R = 3, ROD_Z = RAIL_H + ROD_R;
const GY = 10;                                                              // posición del puente en Y
const CARR = { w: 16, d: 22, z: 12, h: 18 };                               // carros que abrazan cada riel
const BRIDGE = { x: -98, y: GY - 6, w: 196, d: 12, r: 1.5 }, BRIDGE_Z = 18, BRIDGE_H = 11;
const BZ = 25;                                                              // altura del rayo
const HX = -50, HY = GY + 12;                                               // cabezal
const NOZ_Z = 16, HEAD_Z = 20, HEAD_H = 18, HEAD_R = 6.5;
const TUBE = { x0: -36, x1: 56, y: -76, r: 9 };
const M1 = [116, TUBE.y, BZ], M2 = [116, HY, BZ];                           // espejos

const P = k.fitProjection([...k.boxCorners(CAB, -CAB_H, BZ + 14)], W, H, { pad: 92, azimuth: 62 });
const S = (paths, o) => k.solidSvg(paths, o);
const piece = (id, html) => `<g data-piece="${id}">${html}</g>`;
const rod = (x) => S(G.solidOf([[0, ROD_R], [RAIL.d, ROD_R]], G.frameAlong([x, RAIL.y, ROD_Z], [0, 1, 0]), P), { tone: "hi" });

const cabinet = `<path class="iso-halo" d="${k.haloOf(CAB, -CAB_H, CAB_H, P)}"/>` + S(k.slabOf(CAB, -CAB_H, CAB_H, P, 3, 0.8), { tone: "hi" });
const bed = S(k.slabOf(BED, 0, BED_H, P, 3, 0.6), { tone: "hi" }) + k.dotsSvg(k.dotGrid(BED.x + 6, BED.y + 6, 24, 18, 7.2, BED_H, P), { size: 0.55, tone: "mid" });

// La pieza que se corta: ya cortado de B a A pasando por C y D; falta de A a B.
const A = [HX, HY, TOP], B = [HX + 50, HY, TOP], C = [HX + 50, HY + 38, TOP], D = [HX, HY + 38, TOP];
const sheet = materialSvg(S(k.slabOf(SHEET, BED_H, SHEET_H, P, 2, 0.4), { tone: "hi" })) + cutSvg(P, [B, C, D, A], [A, B]);

const tube = [-16, 34].map((x) => S(k.slabOf({ x: x - 5, y: TUBE.y - 7, w: 10, d: 14, r: 1 }, 0, BZ - TUBE.r + 1, P, 2), { tone: "hi" })).join("")
  + S(G.solidOf([[0, TUBE.r], [TUBE.x1 - TUBE.x0, TUBE.r]], G.frameAlong([TUBE.x0, TUBE.y, BZ], [1, 0, 0]), P), { tone: "hi" })
  + S(G.solidOf([[0, 4], [5, 4]], G.frameAlong([TUBE.x1, TUBE.y, BZ], [1, 0, 0]), P), { tone: "hi" });
const post1 = S(k.slabOf({ x: M1[0] - 4, y: M1[1] - 4, w: 8, d: 8, r: 1 }, 0, BZ - 4, P, 2), { tone: "hi" });

const rail = (x) => S(k.slabOf({ x: x - 4, y: RAIL.y, w: 8, d: RAIL.d, r: 1 }, 0, RAIL_H, P, 2, 0.4), { tone: "hi" }) + rod(x);
const carriage = (x) => S(k.slabOf({ x: x - CARR.w / 2, y: GY - CARR.d / 2, w: CARR.w, d: CARR.d, r: 1.5 }, CARR.z, CARR.h, P, 3, 0.5), { tone: "hi", lit: true });
const bridge = S(k.slabOf(BRIDGE, BRIDGE_Z, BRIDGE_H, P, 3, 0.6), { tone: "hi", lit: true });
const bracket2 = S(k.slabOf({ x: RAIL_X[1] + 6, y: HY - 5, w: 14, d: 10, r: 1 }, BZ - 7, 3, P, 2), { tone: "hi", lit: true })
  + S(k.slabOf({ x: RAIL_X[1] + 4, y: GY + 4, w: 6, d: HY - GY + 1, r: 1 }, BZ - 7, 3, P, 2), { tone: "hi", lit: true });
const head = S(k.slabOf({ x: HX - 5, y: GY + 6, w: 10, d: HY - GY - 6, r: 1 }, HEAD_Z + 6, 8, P, 2), { tone: "hi", lit: true })
  + S(k.cylinder(HX, HY, 3, NOZ_Z, HEAD_Z - NOZ_Z, P, 20), { tone: "hi", lit: true })
  + S(k.cylinder(HX, HY, HEAD_R, HEAD_Z, HEAD_H, P, 32, 0.6), { tone: "hi", lit: true });

// Recorrido del rayo: tubo -> espejo 1 -> espejo 2 (en el puente) -> cabezal -> material.
const beamBack = beamSvg(P, [TUBE.x1 + 5, TUBE.y, BZ], M1, { dot: 0 });
const beamSide = beamSvg(P, M1, M2, { dot: 0 });
const beamFront = beamSvg(P, M2, [HX, HY, BZ], { dot: 0 });
const beamDown = beamSvg(P, [HX, HY, NOZ_Z], A, { dot: 0 });
const mirrors = mirrorSvg(P, M1, [1, 1]) + mirrorSvg(P, M2, [1, -1]);

const moves = [
  arrowSvg(P, [HX - 12, GY, BRIDGE_Z + BRIDGE_H + 4], [HX - 42, GY, BRIDGE_Z + BRIDGE_H + 4], { both: false }),
  arrowSvg(P, [HX + 12, GY, BRIDGE_Z + BRIDGE_H + 4], [HX + 52, GY, BRIDGE_Z + BRIDGE_H + 4], { both: false }),
  axisTagSvg(P, [HX - 42, GY, BRIDGE_Z + BRIDGE_H + 4], "X", [-14, -6]),
  arrowSvg(P, [RAIL_X[0], GY - 16, ROD_Z + 4], [RAIL_X[0], GY - 56, ROD_Z + 4], { both: false }),
  arrowSvg(P, [RAIL_X[0], GY + 16, ROD_Z + 4], [RAIL_X[0], GY + 54, ROD_Z + 4], { both: false }),
  axisTagSvg(P, [RAIL_X[0], GY + 54, ROD_Z + 4], "Y", [-12, 10]),
  arrowSvg(P, [92, 88, 1], [92, 88, 34]),
  axisTagSvg(P, [92, 88, 34], "Z", [0, -16]),
].join("");

const labels = [
  labelSvg(P, [10, TUBE.y, BZ + TUBE.r], [585, 62], "Tubo láser", { sub: "aquí nace el rayo" }),
  labelSvg(P, M1, [655, 130], "Espejos", { sub: "desvían el rayo" }),
  labelSvg(P, [(M1[0] + M2[0]) / 2, (M1[1] + M2[1]) / 2, BZ], [650, 215], "Recorrido del rayo"),
  labelSvg(P, [HX, HY, HEAD_Z + HEAD_H], [360, 36], "Cabezal", { sub: "lente que enfoca el rayo" }),
  labelSvg(P, [-88, GY - 6, BRIDGE_Z + BRIDGE_H], [150, 195], "Puente", { anchor: "end", sub: "se desliza sobre los rieles" }),
  labelSvg(P, [RAIL_X[0], RAIL.y + 10, ROD_Z + ROD_R], [170, 120], "Riel", { anchor: "end" }),
  labelSvg(P, [SHEET.x + 10, SHEET.y + SHEET.d - 8, TOP], [150, 300], "Material", { anchor: "end", sub: "en color: lo que se transforma" }),
  labelSvg(P, [BED.x + 8, BED.y + BED.d - 4, BED_H], [160, 350], "Mesa de panal", { anchor: "end", sub: "sube y baja para enfocar" }),
].join("");

const body = [
  piece("mueble", cabinet), piece("mesa", bed), piece("material", sheet),
  piece("tubo", tube), piece("espejo-1", post1), piece("rayo", beamBack),
  piece("riel-izquierdo", rail(RAIL_X[0])), piece("puente", carriage(RAIL_X[0]) + bridge),
  piece("riel-derecho", rail(RAIL_X[1])), piece("puente", carriage(RAIL_X[1]) + bracket2),
  piece("rayo", beamSide + beamFront), piece("espejos", mirrors), piece("cabezal", head),
  piece("rayo", beamDown + sparkSvg(P, A)),
  `<g data-layer="movimiento">${moves}</g>`, `<g data-layer="etiquetas">${labels}</g>`,
];
const label = "Cortadora láser en isométrico. El rayo nace en el tubo del fondo, un espejo lo desvía hacia delante y otro, montado en el puente, lo lleva al cabezal, que lo baja hasta el material. El cabezal recorre el puente (X), el puente se desliza por los rieles (Y) y la mesa sube y baja (Z).";

writeFileSync(join(HERE, "cortadora-laser.svg"), fabSvg({ width: W, height: H, label, body }));
writeFileSync(join(HERE, "cortadora-laser.html"), fabPageHtml({
  title: "Cortadora láser",
  hint: "Vista isométrica",
  keys: [FAB_KEYS.move, { mark: "red", label: "Recorrido del rayo (en la máquina real no se ve)" }, FAB_KEYS.material],
  caption: "El rayo sale del tubo, rebota en dos espejos y llega al cabezal, que lo enfoca hacia abajo. Como el segundo espejo viaja con el puente, el rayo llega al cabezal esté donde esté. El cabezal recorre el puente (X), el puente se desliza por los rieles (Y) y la mesa sube o baja (Z) para enfocar en la superficie. En azul, la pieza: el trazo continuo ya está cortado y el discontinuo es lo que falta.",
  svg: k.figureSvg({ width: W, height: H, label, body }),
}));
console.log("escrito cortadora-laser.html y cortadora-laser.svg");
if (process.env.DUMP) for (const [n, p] of Object.entries({ tube: [-40, TUBE.y, BZ + TUBE.r], tubeEnd: [TUBE.x1, TUBE.y, BZ], M1, M2, head: [HX, HY, HEAD_Z + HEAD_H], bridgeL: [-60, GY - 6, BRIDGE_Z + BRIDGE_H], railL: [RAIL_X[0], RAIL.y + 10, ROD_Z], railR: [RAIL_X[1], 70, ROD_Z], sheet: [SHEET.x + 10, SHEET.y + SHEET.d - 8, TOP], bed: [BED.x + 8, BED.y + BED.d - 4, BED_H], A, cabFL: [CAB.x, CAB.y + CAB.d, 0], cabFR: [CAB.x + CAB.w, CAB.y + CAB.d, 0], cabBR: [CAB.x + CAB.w, CAB.y, 0], cabBL: [CAB.x, CAB.y, 0] })) console.log(n, k.iso(p, P).map(Math.round));
