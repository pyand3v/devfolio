export const locales = ["en", "es", "pt-br"] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = "en"

export const localeOptions: Array<{ code: Locale; label: string; flag: string }> = [
  { code: "en", label: "English (US)", flag: "🇺🇸" },
  { code: "es", label: "Español (España)", flag: "🇪🇸" },
  { code: "pt-br", label: "Português (Brasil)", flag: "🇧🇷" },
]

export const copy = {
  en: {
    nav: { home: "Home", work: "Work", projects: "Projects", blog: "Blog", byo: "BYO" },
    footer: {
      description: "Product engineering for useful software people love to use.",
      explore: "Explore",
      findMe: "Find me",
    },
    home: {
      eyebrow: "Independent by design · Paraguay",
      title: "Building products\npeople want to use.",
      headline: "I turn customer insight and business goals into useful, polished software.",
      slogan: "Software isn't made with intentions; it's made with actions.",
      primary: "View my work",
      availability: "Remote-first · Product engineering",
      featuredLabel: "Featured work",
      featuredTitle: "Close to the customer.\nBuilt for the people using it.",
      story: "Read the work story",
      projectsLabel: "Selected builds",
      projectsTitle: "Products, prototypes,\nand experiments.",
      allProjects: "All projects",
      notesLabel: "From the desk",
      notesTitle: "Notes on making\nuseful things.",
      readBlog: "Read the blog",
    },
    work: {
      eyebrow: "01 · Career",
      title: "Work that\nships.",
      description:
        "Selected roles turning customer needs and business goals into thoughtful product experiences.",
    },
    projects: {
      eyebrow: "02 · Selected builds",
      title: "Things worth\ntrying.",
      description:
        "A selection of product ideas, prototypes, and experiments taken from insight to delivery.",
    },
    blog: {
      eyebrow: "03 · Notes from the desk",
      title: "Ideas in\npublic.",
      description:
        "Practical notes on product thinking, delivery, and the engineering behind great experiences.",
    },
  },
  es: {
    nav: { home: "Inicio", work: "Trabajo", projects: "Proyectos", blog: "Blog", byo: "BYO" },
    footer: {
      description:
        "Ingeniería de producto para crear software útil que las personas disfrutan usar.",
      explore: "Explorar",
      findMe: "Encuéntrame",
    },
    home: {
      eyebrow: "Independiente por diseño · Paraguay",
      title: "Productos que las\npersonas quieren usar.",
      headline:
        "Transformo las necesidades de clientes y objetivos de negocio en software útil y cuidado.",
      slogan: "El software no se hace con intenciones, se hace con acciones.",
      primary: "Ver mi trabajo",
      availability: "Remoto primero · Ingeniería de producto",
      featuredLabel: "Trabajo destacado",
      featuredTitle: "Cerca del cliente.\nHecho para quien lo usa.",
      story: "Leer la historia",
      projectsLabel: "Proyectos seleccionados",
      projectsTitle: "Productos, prototipos\ny experimentos.",
      allProjects: "Todos los proyectos",
      notesLabel: "Desde el escritorio",
      notesTitle: "Ideas para crear\ncosas útiles.",
      readBlog: "Leer el blog",
    },
    work: {
      eyebrow: "01 · Carrera",
      title: "Trabajo que\nllega a producción.",
      description:
        "Roles seleccionados transformando necesidades de clientes y objetivos de negocio en experiencias de producto.",
    },
    projects: {
      eyebrow: "02 · Proyectos seleccionados",
      title: "Cosas que vale\nla pena probar.",
      description:
        "Una selección de ideas de producto, prototipos y experimentos llevados desde la idea hasta la entrega.",
    },
    blog: {
      eyebrow: "03 · Notas desde el escritorio",
      title: "Ideas en\npúblico.",
      description:
        "Notas prácticas sobre producto, entrega y la ingeniería detrás de grandes experiencias.",
    },
  },
  "pt-br": {
    nav: { home: "Início", work: "Trabalho", projects: "Projetos", blog: "Blog", byo: "BYO" },
    footer: {
      description: "Engenharia de produto para criar software útil que as pessoas adoram usar.",
      explore: "Explorar",
      findMe: "Encontre-me",
    },
    home: {
      eyebrow: "Independente por design · Paraguai",
      title: "Produtos que as\npessoas querem usar.",
      headline:
        "Transformo as necessidades dos clientes e os objetivos de negócio em software útil e bem acabado.",
      slogan: "Software não se faz com intenções; faz-se com ações.",
      primary: "Ver meu trabalho",
      availability: "Remoto em primeiro lugar · Engenharia de produto",
      featuredLabel: "Trabalho em destaque",
      featuredTitle: "Perto do cliente.\nFeito para quem usa.",
      story: "Ler a história",
      projectsLabel: "Projetos selecionados",
      projectsTitle: "Produtos, protótipos\ne experimentos.",
      allProjects: "Todos os projetos",
      notesLabel: "Da mesa de trabalho",
      notesTitle: "Ideias para criar\ncoisas úteis.",
      readBlog: "Ler o blog",
    },
    work: {
      eyebrow: "01 · Carreira",
      title: "Trabalho que\nchega à produção.",
      description:
        "Funções selecionadas transformando necessidades de clientes e objetivos de negócio em experiências de produto.",
    },
    projects: {
      eyebrow: "02 · Projetos selecionados",
      title: "Coisas que vale\na pena experimentar.",
      description:
        "Uma seleção de ideias de produto, protótipos e experimentos levados da ideia à entrega.",
    },
    blog: {
      eyebrow: "03 · Notas da mesa",
      title: "Ideias em\npúblico.",
      description:
        "Notas práticas sobre produto, entrega e a engenharia por trás de grandes experiências.",
    },
  },
} as const

export const getLocaleFromPathname = (pathname: string): Locale => {
  const firstSegment = pathname.split("/").filter(Boolean)[0]
  return locales.includes(firstSegment as Locale) ? (firstSegment as Locale) : "en"
}

export const getLocalizedPath = (pathname: string, _locale: Locale) => {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`
  const segments = path.split("/").filter(Boolean)
  if (locales.includes(segments[0] as Locale)) segments.shift()
  return `/${segments.join("/")}`.replace(/\/$/, "") || "/"
}

export const getLocaleSwitchPath = (pathname: string, locale: Locale) => {
  const segments = pathname.split("/").filter(Boolean)
  if (locales.includes(segments[0] as Locale)) segments.shift()
  const topLevel = segments[0]
  if (topLevel === "blog" || topLevel === "byo")
    return getLocalizedPath(`/${segments.join("/")}`, locale)
  const supported = topLevel === "work" || topLevel === "projects"
  return getLocalizedPath(supported ? `/${topLevel}` : "/", locale)
}
