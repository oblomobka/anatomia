// Capa "fab" sobre iso-kit: lo que necesita un diagrama de máquina para capacitación.
// Flechas de movimiento, etiquetas con línea guía, círculos de eje, rayo/haz y una lámina estática en español.
// Todo devuelve cadenas SVG/HTML, sin dependencias, igual que iso-kit.
import { iso, figureSvg, plateHtml, pageHtml } from "./iso-kit.mjs";

const f = (n) => (Math.round(n * 10) / 10).toFixed(1).replace(/\.0$/, "");
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Paleta y estilos de la capa fab. Todo pasa por variables para poder cambiar la estética en un sitio.
export const FAB_CSS = `
.iso{--fab-move:#e6e6e6;--fab-beam:#ff5a5f;--fab-ink:#e6e6e6;--fab-sub:#8c8c90;--fab-leader:#6a6a6a;--fab-tag-text:#111111;--fab-font:ui-sans-serif,system-ui,"Segoe UI",sans-serif;
  --fab-material:#2f6fe0;--fab-material-top:#1d3a6e;--fab-material-side:#16305c;--fab-material-edge:#7aa5ff}
.iso[data-theme="light"]{--fab-move:#2b2b30;--fab-beam:#e5484d;--fab-ink:#26262a;--fab-sub:#7a7a80;--fab-leader:#9a9aa0;--fab-tag-text:#ffffff;--anatomy-weight:.9px;
  --fab-material:#2563eb;--fab-material-top:#dbe7fd;--fab-material-side:#b8cdf6;--fab-material-edge:#2563eb}
.fab-move-line{fill:none;stroke:var(--fab-move);stroke-width:2.2;stroke-linecap:round}
.fab-move-head{fill:var(--fab-move);stroke:none}
.fab-axis circle{fill:var(--fab-move)}
.fab-axis text{fill:var(--fab-tag-text);font:700 12px var(--fab-font)}
.fab-beam path{stroke:var(--fab-beam);stroke-width:2;stroke-dasharray:4 3;fill:none}
.fab-beam circle{fill:var(--fab-beam)}
.fab-label path{fill:none;stroke:var(--fab-leader);stroke-width:.8}
.fab-label circle{fill:var(--fab-ink)}
.fab-label text{fill:var(--fab-ink);font:600 14px var(--fab-font)}
.fab-label text.fab-sub{fill:var(--fab-sub);font-weight:400;font-size:12px}
.fab-material>.iso-top,.fab-material>.iso-fill{fill:var(--fab-material-top)}
.fab-material>.iso-shade{fill:var(--fab-material-side)}
.fab-material>.iso-edge,.fab-material>.iso-crease,.fab-material>.iso-bevel{stroke:var(--fab-material-edge)}
.fab-cut-done{fill:none;stroke:var(--fab-material);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.fab-cut-todo{fill:none;stroke:var(--fab-material);stroke-width:1.1;stroke-dasharray:3 3;opacity:.7}
.fab-spark circle{fill:var(--fab-beam)}
.fab-spark circle.fab-glow{fill:var(--fab-beam);opacity:.18}
.fab-spark path{stroke:var(--fab-beam);stroke-width:1.2;stroke-linecap:round}
.fab-mirror{stroke:var(--fab-ink);stroke-width:2.6;stroke-linecap:round}
.iso-figure{--anatomy-blue:var(--fab-move);--anatomy-red:var(--fab-beam);--anatomy-green:var(--fab-material)}
`;

const screen = (p, P) => (p.length === 3 ? iso(p, P) : p);

/** Flecha de movimiento entre dos puntos del mundo [x,y,z] (o de pantalla [sx,sy]). both: punta en los dos extremos. */
export function arrowSvg(P, from, to, { both = true, head = 9, width = 4.2 } = {}) {
  const A = screen(from, P), B = screen(to, P);
  const tip = (t, o) => {
    const dx = t[0] - o[0], dy = t[1] - o[1], l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
    const bx = t[0] - ux * head, by = t[1] - uy * head;
    return `<path class="fab-move-head" d="M${f(t[0])} ${f(t[1])}L${f(bx - uy * width)} ${f(by + ux * width)}L${f(bx + uy * width)} ${f(by - ux * width)}Z"/>`;
  };
  const trim = (t, o) => { const dx = t[0] - o[0], dy = t[1] - o[1], l = Math.hypot(dx, dy) || 1, k = head * 0.75; return [t[0] - (dx / l) * k, t[1] - (dy / l) * k]; };
  const A2 = both ? trim(A, B) : A, B2 = trim(B, A);
  return `<g class="fab-move"><path class="fab-move-line" d="M${f(A2[0])} ${f(A2[1])}L${f(B2[0])} ${f(B2[1])}"/>${tip(B, A)}${both ? tip(A, B) : ""}</g>`;
}

/** Círculo con la letra del eje (X, Y, Z…) junto a un punto del mundo, desplazado [dx,dy] px en pantalla. */
export function axisTagSvg(P, at, text, [dx, dy] = [0, 0], { r = 10 } = {}) {
  const [x, y] = screen(at, P);
  return `<g class="fab-axis"><circle cx="${f(x + dx)}" cy="${f(y + dy)}" r="${r}"/><text x="${f(x + dx)}" y="${f(y + dy + 4.5)}" text-anchor="middle">${esc(text)}</text></g>`;
}

/** Etiqueta: punto sobre la pieza, línea guía y texto en una posición de pantalla [tx,ty]. anchor "start" (texto a la derecha) o "end". */
export function labelSvg(P, at, [tx, ty], text, { anchor = "start", sub = "" } = {}) {
  const [x, y] = screen(at, P);
  const elbow = anchor === "start" ? tx - 6 : tx + 6;
  return `<g class="fab-label"><circle cx="${f(x)}" cy="${f(y)}" r="2"/><path d="M${f(x)} ${f(y)}L${f(elbow)} ${f(ty)}"/>`
    + `<text x="${f(tx)}" y="${f(ty + 4)}" text-anchor="${anchor}">${esc(text)}</text>`
    + (sub ? `<text class="fab-sub" x="${f(tx)}" y="${f(ty + 19)}" text-anchor="${anchor}">${esc(sub)}</text>` : "") + `</g>`;
}

/** Rayo o haz (láser, chorro, filamento…): línea discontinua con punto de impacto. */
export function beamSvg(P, from, to, { dot = 2.6 } = {}) {
  const a = screen(from, P), b = screen(to, P);
  return `<g class="fab-beam"><path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}"/>${dot ? `<circle cx="${f(b[0])}" cy="${f(b[1])}" r="${dot}"/>` : ""}</g>`;
}

/** Pieza de material (lo que se transforma): pinta un sólido del kit con el color de material en vez de neutro. */
export const materialSvg = (solidHtml) => solidHtml.replace('class="iso-solid', 'class="iso-solid fab-material');

/** Transformación sobre el material: tramo ya hecho (continuo) y tramo pendiente (discontinuo), en puntos del mundo. */
export function cutSvg(P, done = [], todo = []) {
  const d = (pts) => pts.length > 1 ? "M" + pts.map((p) => screen(p, P).map(f).join(" ")).join("L") : "";
  return `<g class="fab-cut">${todo.length > 1 ? `<path class="fab-cut-todo" d="${d(todo)}"/>` : ""}${done.length > 1 ? `<path class="fab-cut-done" d="${d(done)}"/>` : ""}</g>`;
}

/** Punto donde la herramienta actúa sobre el material: núcleo, halo y chispas. */
export function sparkSvg(P, at, { r = 2.4, rays = 6, len = 6 } = {}) {
  const [x, y] = screen(at, P);
  const lines = Array.from({ length: rays }, (_, i) => {
    const a = (i / rays) * Math.PI * 2 + 0.3, c = Math.cos(a), s = Math.sin(a) * 0.6;
    return `M${f(x + c * (r + 2))} ${f(y + s * (r + 2))}L${f(x + c * (r + 2 + len))} ${f(y + s * (r + 2 + len))}`;
  }).join("");
  return `<g class="fab-spark"><circle class="fab-glow" cx="${f(x)}" cy="${f(y)}" r="${f(r * 3.2)}"/><path d="${lines}"/><circle cx="${f(x)}" cy="${f(y)}" r="${r}"/></g>`;
}

/** Espejo de 45° visto como un trazo corto sobre el plano horizontal: centro [x,y,z] y dirección de la cara en planta. */
export function mirrorSvg(P, [x, y, z], [dx, dy], half = 7) {
  const l = Math.hypot(dx, dy) || 1, ux = (dx / l) * half, uy = (dy / l) * half;
  const a = iso([x - ux, y - uy, z], P), b = iso([x + ux, y + uy, z], P);
  return `<path class="fab-mirror" d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}"/>`;
}

/** SVG listo para usar fuera de la página (diapositivas, Inkscape): lleva sus estilos, tema y fondo. */
export function fabSvg({ width, height, label, body, theme = "light", background = true }) {
  const bg = background ? `<rect width="${width}" height="${height}" style="fill:var(--anatomy-card)"/>` : "";
  return figureSvg({ width, height, label, body: bg + (Array.isArray(body) ? body.join("") : body), standalone: true })
    .replace('data-theme="true"', `data-theme="${theme}"`)
    .replace("</style>", `${FAB_CSS}</style>`);
}

/** Página HTML estática con la lámina (esquinas, leyenda y pie), en español. Es la fuente del PNG y del PDF. */
export function fabPageHtml({ title, fig = "Fig. 1", hint = "", keys = [], caption = "", svg, theme = "light", width = 820 }) {
  const plate = plateHtml({ fig, title, hint, keys, caption, body: `<div class="iso-stage">${svg}</div>` });
  return pageHtml({ title, theme, width, body: `<style>${FAB_CSS}</style>${plate}` }).replace('<html lang="en">', '<html lang="es">');
}

/** Leyenda estándar: flechas de movimiento y rayo. */
export const FAB_KEYS = {
  move: { mark: "blue", label: "Hacia dónde se mueve cada parte" },
  beam: { mark: "red", label: "Rayo o haz" },
  material: { mark: "green", label: "Material que se transforma" },
};
