export const locales = ["en", "es", "pt-br"] as const

export type Locale = (typeof locales)[number]

export const localeOptions: Array<{ code: Locale; label: string; flag: string }> = [
  { code: "en", label: "English (US)", flag: "🇺🇸" },
  { code: "es", label: "Español (España)", flag: "🇪🇸" },
  { code: "pt-br", label: "Português (Brasil)", flag: "🇧🇷" },
]

export const copy = {
  en: {
    nav: { home: "Home", work: "Work", projects: "Projects", blog: "Blog" },
    footer: {
      description: "Forward deployed engineering for products and platforms people can depend on.",
      explore: "Explore",
      findMe: "Find me",
    },
    home: {
      eyebrow: "Independent by design · Paraguay",
      title: "Building systems\npeople can depend on.",
      headline:
        "I help teams turn messy customer and platform problems into reliable product systems.",
      primary: "Explore my work",
      availability: "Remote-first · Platform work",
      featuredLabel: "Featured work",
      featuredTitle: "Close to the problem.\nBuilt for the people using it.",
      story: "Read the work story",
      projectsLabel: "Selected builds",
      projectsTitle: "Products, platforms,\nand technical experiments.",
      allProjects: "All projects",
      notesLabel: "From the desk",
      notesTitle: "Notes on making\nreliable things.",
      readBlog: "Read the blog",
    },
    work: {
      eyebrow: "01 · Career",
      title: "Work that\nships.",
      description:
        "Selected roles building customer-facing products, platform capabilities, and reliable systems.",
    },
    projects: {
      eyebrow: "02 · Selected builds",
      title: "Things worth\ntrying.",
      description:
        "A selection of product, systems, and technical experiments built from idea to delivery.",
    },
    blog: {
      eyebrow: "03 · Notes from the desk",
      title: "Ideas in\npublic.",
      description:
        "Practical notes on systems, infrastructure, and engineering practices behind reliable products.",
    },
  },
  es: {
    nav: { home: "Inicio", work: "Trabajo", projects: "Proyectos", blog: "Blog" },
    footer: {
      description:
        "Ingeniería forward-deployed para productos y plataformas en los que las personas pueden confiar.",
      explore: "Explorar",
      findMe: "Encuéntrame",
    },
    home: {
      eyebrow: "Independiente por diseño · Paraguay",
      title: "Sistemas en los que\nlas personas confían.",
      headline:
        "Ayudo a equipos a convertir problemas complejos de clientes y plataformas en sistemas de producto confiables.",
      primary: "Explorar mi trabajo",
      availability: "Remoto primero · Trabajo de plataforma",
      featuredLabel: "Trabajo destacado",
      featuredTitle: "Cerca del problema.\nHecho para quien lo usa.",
      story: "Leer la historia",
      projectsLabel: "Proyectos seleccionados",
      projectsTitle: "Productos, plataformas\ny experimentos técnicos.",
      allProjects: "Todos los proyectos",
      notesLabel: "Desde el escritorio",
      notesTitle: "Ideas para crear\ncosas confiables.",
      readBlog: "Leer el blog",
    },
    work: {
      eyebrow: "01 · Carrera",
      title: "Trabajo que\nllega a producción.",
      description:
        "Roles seleccionados creando productos para clientes, capacidades de plataforma y sistemas confiables.",
    },
    projects: {
      eyebrow: "02 · Proyectos seleccionados",
      title: "Cosas que vale\nla pena probar.",
      description:
        "Una selección de productos, sistemas y experimentos técnicos desarrollados desde la idea hasta la entrega.",
    },
    blog: {
      eyebrow: "03 · Notas desde el escritorio",
      title: "Ideas en\npúblico.",
      description:
        "Notas prácticas sobre sistemas, infraestructura y prácticas de ingeniería detrás de productos confiables.",
    },
  },
  "pt-br": {
    nav: { home: "Início", work: "Trabalho", projects: "Projetos", blog: "Blog" },
    footer: {
      description:
        "Engenharia forward-deployed para produtos e plataformas nas quais as pessoas podem confiar.",
      explore: "Explorar",
      findMe: "Encontre-me",
    },
    home: {
      eyebrow: "Independente por design · Paraguai",
      title: "Sistemas nos quais\nas pessoas confiam.",
      headline:
        "Ajudo equipes a transformar problemas complexos de clientes e plataformas em sistemas de produto confiáveis.",
      primary: "Explorar meu trabalho",
      availability: "Remoto em primeiro lugar · Trabalho de plataforma",
      featuredLabel: "Trabalho em destaque",
      featuredTitle: "Perto do problema.\nFeito para quem usa.",
      story: "Ler a história",
      projectsLabel: "Projetos selecionados",
      projectsTitle: "Produtos, plataformas\ne experimentos técnicos.",
      allProjects: "Todos os projetos",
      notesLabel: "Da mesa de trabalho",
      notesTitle: "Ideias para criar\ncoisas confiáveis.",
      readBlog: "Ler o blog",
    },
    work: {
      eyebrow: "01 · Carreira",
      title: "Trabalho que\nchega à produção.",
      description:
        "Funções selecionadas criando produtos para clientes, recursos de plataforma e sistemas confiáveis.",
    },
    projects: {
      eyebrow: "02 · Projetos selecionados",
      title: "Coisas que vale\na pena experimentar.",
      description:
        "Uma seleção de produtos, sistemas e experimentos técnicos desenvolvidos da ideia à entrega.",
    },
    blog: {
      eyebrow: "03 · Notas da mesa",
      title: "Ideias em\npúblico.",
      description:
        "Notas práticas sobre sistemas, infraestrutura e práticas de engenharia por trás de produtos confiáveis.",
    },
  },
} as const

export const getLocaleFromPathname = (pathname: string): Locale => {
  const firstSegment = pathname.split("/").filter(Boolean)[0]
  return locales.includes(firstSegment as Locale) ? (firstSegment as Locale) : "en"
}

export const getLocalizedPath = (pathname: string, locale: Locale) => {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`
  const segments = path.split("/").filter(Boolean)
  if (locales.includes(segments[0] as Locale)) segments.shift()
  const localePrefix = locale === "en" ? "" : `/${locale}`
  return `${localePrefix}/${segments.join("/")}`.replace(/\/$/, "") || "/"
}

export const getLocaleSwitchPath = (pathname: string, locale: Locale) => {
  const segments = pathname.split("/").filter(Boolean)
  if (locales.includes(segments[0] as Locale)) segments.shift()
  const topLevel = segments[0]
  if (topLevel === "blog") return getLocalizedPath(`/${segments.join("/")}`, locale)
  const supported = topLevel === "work" || topLevel === "projects"
  return getLocalizedPath(supported ? `/${topLevel}` : "/", locale)
}
