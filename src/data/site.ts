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
  title: "Daniel Benitez | Forward Deployed Engineer",
  description:
    "Forward Deployed Engineer building thoughtful web, desktop, systems, and platform products.",
  keywords: [
    "Forward Deployed Engineer",
    "Platform Engineering",
    "Astro",
    "TypeScript",
    "Tauri",
    "Rust",
    "Go",
    "Infrastructure",
    "Portfolio",
  ],
  author: { name: "Daniel Benitez", url: "https://www.pyan.dev" },
  siteUrl: import.meta.env.PUBLIC_SITE_URL ?? "https://www.pyan.dev",
  social: { twitter: "@pyandev" },
  ogImage: null as string | null,
}
