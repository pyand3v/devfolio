import { Resvg } from "@resvg/resvg-js"
import fs from "node:fs"
import path from "node:path"
import satori from "satori"

// The light "graph paper" palette from src/styles/globals.css
const colors = {
  paper: "#f7f5ef",
  grid: "#e1e7f0",
  ink: "#1d2a44",
  muted: "#5b6478",
  accent: "#2f5bd3",
  annot: "#b83a35",
  code: "#0d1117",
  codeFg: "#e6edf3",
  prompt: "#3fb950",
}

const fontFile = (pkg: string, file: string) =>
  path.join(process.cwd(), "node_modules", "@fontsource", pkg, "files", file)

// Every image in a build uses the same fonts, so they're read once
let fonts: Parameters<typeof satori>[1]["fonts"] | undefined
const loadFonts = () =>
  (fonts ??= [
    {
      name: "Fraunces",
      data: fs.readFileSync(fontFile("fraunces", "fraunces-latin-500-normal.woff")),
      weight: 500,
      style: "normal",
    },
    {
      name: "JetBrains Mono",
      data: fs.readFileSync(fontFile("jetbrains-mono", "jetbrains-mono-latin-400-normal.woff")),
      weight: 400,
      style: "normal",
    },
    {
      name: "Caveat",
      data: fs.readFileSync(fontFile("caveat", "caveat-latin-500-normal.woff")),
      weight: 500,
      style: "normal",
    },
  ])

// The hand-drawn underline, as an image so satori draws it like the site does
const scribble = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 14"><path d="M2 9C40 3 90 13 198 5" fill="none" stroke="${colors.accent}" stroke-width="3.5" stroke-linecap="round"/></svg>`
)}`

type Node = { type: string; props: Record<string, unknown> }
const el = (
  type: string,
  style: Record<string, unknown>,
  children?: unknown,
  extra = {}
): Node => ({
  type,
  props: { style: { display: "flex", ...style }, children, ...extra },
})

export async function createOgImage(title: string, subtitle: string) {
  const dot = (background: string) =>
    el("div", { width: "14px", height: "14px", borderRadius: "999px", background })
  const element = el(
    "div",
    {
      width: "1200px",
      height: "630px",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "64px 72px",
      background: colors.paper,
      backgroundImage: `linear-gradient(${colors.grid} 2px, transparent 2px), linear-gradient(90deg, ${colors.grid} 2px, transparent 2px)`,
      backgroundSize: "40px 40px",
      color: colors.ink,
      fontFamily: "Fraunces",
    },
    [
      el("div", { alignItems: "center", justifyContent: "space-between" }, [
        el("div", { alignItems: "baseline", gap: "6px" }, [
          el(
            "span",
            { fontFamily: "JetBrains Mono", fontSize: "30px", color: colors.accent },
            "~/"
          ),
          el("span", { fontFamily: "Caveat", fontSize: "58px", lineHeight: 1 }, "daniel"),
        ]),
        el(
          "div",
          {
            fontFamily: "JetBrains Mono",
            fontSize: "24px",
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: colors.accent,
          },
          subtitle
        ),
      ]),
      el("div", { flexDirection: "column", gap: "18px" }, [
        el("div", { fontSize: "76px", lineHeight: 1.08, maxWidth: "1020px" }, title),
        el("img", { width: "380px", height: "26px" }, undefined, {
          src: scribble,
          width: 380,
          height: 26,
        }),
      ]),
      el(
        "div",
        {
          alignItems: "center",
          gap: "12px",
          alignSelf: "flex-start",
          padding: "18px 26px",
          borderRadius: "12px",
          background: colors.code,
          color: colors.codeFg,
          fontFamily: "JetBrains Mono",
          fontSize: "26px",
          boxShadow: `6px 6px 0 ${colors.grid}`,
        },
        [
          dot("#f85149"),
          dot("#e3b341"),
          dot(colors.prompt),
          el("span", { marginLeft: "12px", color: colors.prompt }, "$"),
          el("span", {}, "open pyan.dev"),
        ]
      ),
    ]
  )
  const svg = await satori(element as unknown as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts: loadFonts(),
  })
  // satori already turns the text into paths, so resvg needs no fonts. Loading the system's (its default)
  // took ~350 ms per image, nearly all of the render time.
  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
    font: { loadSystemFonts: false },
  })
    .render()
    .asPng()
  return new Response(Uint8Array.from(png).buffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
