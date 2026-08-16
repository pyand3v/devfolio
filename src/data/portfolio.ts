export const homeIntroConfig = {
  name: "Daniel Benitez",
  shortName: "Daniel",
  introParagraphs: [
    "I'm a Forward Deployed Engineer from Paraguay, building thoughtful web, desktop, and infrastructure products. I turn complex customer problems into reliable, useful systems by working closely with the people who depend on them.",
    "My current interests span Zig, Rust, Go, Astro, Tauri, and Electron, alongside the platform tooling that keeps products healthy: Docker, Linux, Terraform, Kubernetes, Grafana, and Prometheus.",
  ],
  facts: [
    { icon: "lucide:briefcase-business", label: "Forward Deployed Engineer" },
    { icon: "lucide:map-pin", label: "Paraguay" },
    { icon: "lucide:layers-3", label: "Web, desktop & systems" },
    { icon: "lucide:terminal", label: "Zig, Rust & Go" },
    { icon: "lucide:monitor-smartphone", label: "Astro, Tauri & Electron" },
    { icon: "lucide:container", label: "Docker & Kubernetes" },
    { icon: "lucide:network", label: "Platform engineering" },
    { icon: "lucide:chart-no-axes-combined", label: "Observability" },
  ],
  workItemsToShow: 3,
  projectsToShow: 4,
  blogPostsToShow: 3,
}

export const paginationConfig = {
  blogPostsPerPage: 5,
  workItemsPerPage: 6,
  projectsPerPage: 6,
}

export const footerConfig = {
  copyrightName: "Daniel Benitez",
  showVersionAndAttribution: false,
  socialLinks: [
    { label: "GitHub", href: "https://github.com/pyand3v", icon: "fa6-brands:github" },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/pyandev/",
      icon: "fa6-brands:linkedin",
    },
    { label: "X", href: "https://twitter.com/pyandev", icon: "fa6-brands:x-twitter" },
  ],
}

export const navItems = [
  { name: "Home", path: "/" },
  { name: "Work", path: "/work" },
  { name: "Projects", path: "/projects" },
  { name: "Blog", path: "/blog" },
]
