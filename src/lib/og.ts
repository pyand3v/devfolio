import { Resvg } from "@resvg/resvg-js"
import fs from "node:fs"
import path from "node:path"
import satori from "satori"

const themes: Record<string, { accent: string; soft: string }> = {
  blue: { accent: "#2563eb", soft: "#dbeafe" },
  purple: { accent: "#9333ea", soft: "#f3e8ff" },
  green: { accent: "#16a34a", soft: "#dcfce7" },
  orange: { accent: "#ea580c", soft: "#ffedd5" },
  rose: { accent: "#e11d48", soft: "#ffe4e6" },
  teal: { accent: "#0d9488", soft: "#ccfbf1" },
  indigo: { accent: "#4f46e5", soft: "#e0e7ff" },
  amber: { accent: "#d97706", soft: "#fef3c7" },
  cyan: { accent: "#0891b2", soft: "#cffafe" },
  violet: { accent: "#7c3aed", soft: "#ede9fe" },
  pink: { accent: "#db2777", soft: "#fce7f3" },
  lime: { accent: "#65a30d", soft: "#ecfccb" },
}

// Every image in a build uses the same font, so it's read once
let font: Buffer | undefined
const loadFont = () =>
  (font ??= fs.readFileSync(
    path.join(
      process.cwd(),
      "node_modules",
      "@fontsource",
      "gabarito",
      "files",
      "gabarito-latin-400-normal.woff"
    )
  ))

export async function createOgImage(title: string, subtitle: string, theme = "blue") {
  const colors = themes[theme] ?? themes.blue
  const element = {
    type: "div",
    props: {
      style: {
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "70px",
        background: "#fafafa",
        color: "#171717",
        fontFamily: "Gabarito",
        backgroundImage: `radial-gradient(${colors.soft} 1px, transparent 1px)`,
        backgroundSize: "30px 30px",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "18px",
              color: colors.accent,
              fontSize: "28px",
              fontWeight: 700,
            },
            children: [
              // Drawn rather than typed: the Latin subset of Gabarito has no "●" (U+25CF) glyph
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    width: "18px",
                    height: "18px",
                    borderRadius: "999px",
                    background: colors.accent,
                  },
                  children: [],
                },
              },
              subtitle,
            ],
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              fontSize: "72px",
              lineHeight: 1.1,
              fontWeight: 800,
              maxWidth: "1000px",
            },
            children: title,
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              height: "14px",
              width: "100%",
              borderRadius: "999px",
              background: colors.accent,
            },
            children: [],
          },
        },
      ],
    },
  }
  const svg = await satori(element as unknown as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts: [{ name: "Gabarito", data: loadFont(), weight: 400, style: "normal" }],
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
