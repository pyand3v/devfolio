export type Theme =
  | "blue"
  | "purple"
  | "green"
  | "orange"
  | "rose"
  | "teal"
  | "indigo"
  | "amber"
  | "cyan"
  | "violet"
  | "pink"
  | "lime"

export const siteMetadata = {
  theme: "blue" as Theme,
  title: "Daniel Benitez | Product Engineer",
  description:
    "Product Engineer building useful, polished software from customer insight to reliable release.",
  keywords: [
    "Product Engineer",
    "Product Development",
    "User Experience",
    "Astro",
    "TypeScript",
    "Tauri",
    "Rust",
    "Go",
    "Frontend Engineering",
    "Portfolio",
  ],
  author: { name: "Daniel Benitez", url: "https://www.pyan.dev" },
  siteUrl: import.meta.env.PUBLIC_SITE_URL ?? "https://www.pyan.dev",
  social: { twitter: "@pyandev" },
  ogImage: null as string | null,
}
