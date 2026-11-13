import { leadCategories } from "@/schemas/lead";

export type Role = "admin" | "editor" | "sales";

export const roleLabels: Record<Role, string> = {
  admin: "Administrador",
  editor: "Editor",
  sales: "Gerente comercial",
};

export type FieldType =
  | "text"
  | "textarea"
  | "url"
  | "number"
  | "boolean"
  | "select"
  | "relation"
  | "image"
  | "tags"
  | "json";

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  options?: { value: string; label: string }[];
  /** relation: tabela e coluna exibida. */
  relation?: { table: string; label: string };
  /** campo que só pode ser definido na criação (ex.: chave única). */
  createOnly?: boolean;
  /** slug gerado a partir de outro campo quando vazio. */
  slugFrom?: string;
};

export type Resource = {
  key: string;
  table: string;
  label: string;
  singular: string;
  roles: Role[];
  titleField: string;
  columns: { field: string; label: string; type?: "boolean" | "text" }[];
  fields: Field[];
  order: [string, boolean];
  /** campo de publicação por status ('published') ou booleano. */
  publish?: { field: string; kind: "status" | "boolean" };
  /** listas relacionadas exibidas na edição. */
  related?: { resource: string; fk: string; label: string }[];
};

const slugField: Field = { name: "slug", label: "Slug (URL)", type: "text", required: true };
const sortField: Field = { name: "sort", label: "Ordem", type: "number" };

export const resources: Resource[] = [
  {
    key: "projetos",
    table: "projects",
    label: "Projetos",
    singular: "projeto",
    roles: ["admin", "editor"],
    titleField: "title",
    columns: [
      { field: "title", label: "Título" },
      { field: "status", label: "Status" },
      { field: "featured", label: "Destaque", type: "boolean" },
      { field: "sort", label: "Ordem" },
    ],
    fields: [
      { name: "title", label: "Título", type: "text", required: true },
      { ...slugField, slugFrom: "title" },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "draft", label: "Rascunho" },
          { value: "published", label: "Publicado" },
        ],
      },
      {
        name: "category_id",
        label: "Categoria",
        type: "relation",
        relation: { table: "categories", label: "name" },
      },
      {
        name: "client_id",
        label: "Cliente (interno)",
        type: "relation",
        relation: { table: "client_options", label: "name" },
      },
      {
        name: "client_name",
        label: "Nome do cliente exibido",
        type: "text",
        help: "Só aparece no site se “Exibir cliente” estiver marcado e o cliente tiver autorizado.",
      },
      { name: "show_client", label: "Exibir cliente (autorizado)", type: "boolean" },
      { name: "description", label: "Descrição", type: "textarea" },
      { name: "process", label: "Processo criativo", type: "textarea" },
      { name: "result", label: "Resultado", type: "textarea" },
      { name: "cover_url", label: "Capa", type: "image" },
      { name: "video_url", label: "Vídeo (URL)", type: "url" },
      { name: "featured", label: "Destaque na Home", type: "boolean" },
      sortField,
      { name: "seo_title", label: "SEO: título", type: "text" },
      { name: "seo_description", label: "SEO: descrição", type: "textarea" },
    ],
    order: ["sort", true],
    publish: { field: "status", kind: "status" },
    related: [{ resource: "midias-projeto", fk: "project_id", label: "Imagens e vídeos" }],
  },
  {
    key: "midias-projeto",
    table: "project_media",
    label: "Mídias de projetos",
    singular: "mídia",
    roles: ["admin", "editor"],
    titleField: "caption",
    columns: [
      { field: "kind", label: "Tipo" },
      { field: "caption", label: "Legenda" },
      { field: "sort", label: "Ordem" },
    ],
    fields: [
      {
        name: "project_id",
        label: "Projeto",
        type: "relation",
        required: true,
        relation: { table: "projects", label: "title" },
      },
      {
        name: "kind",
        label: "Tipo",
        type: "select",
        options: [
          { value: "image", label: "Imagem" },
          { value: "video", label: "Vídeo" },
        ],
      },
      { name: "url", label: "Arquivo", type: "image", required: true },
      { name: "caption", label: "Legenda", type: "text" },
      sortField,
    ],
    order: ["sort", true],
  },
  {
    key: "servicos",
    table: "services",
    label: "Departamentos",
    singular: "departamento",
    roles: ["admin", "editor"],
    titleField: "name",
    columns: [
      { field: "name", label: "Nome" },
      { field: "category", label: "Categoria" },
      { field: "active", label: "Ativo", type: "boolean" },
      { field: "sort", label: "Ordem" },
    ],
    fields: [
      { name: "name", label: "Nome", type: "text", required: true },
      { ...slugField, slugFrom: "name" },
      {
        name: "category",
        label: "Categoria de orçamento/portfólio",
        type: "select",
        required: true,
        options: leadCategories.map((c) => ({ value: c, label: c })),
      },
      { name: "tagline", label: "Chamada curta", type: "text" },
      { name: "summary", label: "Resumo", type: "textarea" },
      { name: "banner_url", label: "Banner", type: "image" },
      {
        name: "benefits",
        label: "Benefícios (JSON)",
        type: "json",
        help: 'Lista de objetos: [{"title":"…","text":"…"}]',
      },
      {
        name: "faq",
        label: "Perguntas frequentes (JSON)",
        type: "json",
        help: 'Lista de objetos: [{"q":"…","a":"…"}]',
      },
      sortField,
      { name: "active", label: "Ativo", type: "boolean" },
    ],
    order: ["sort", true],
    related: [{ resource: "itens-servico", fk: "service_id", label: "Serviços oferecidos" }],
  },
  {
    key: "itens-servico",
    table: "service_items",
    label: "Itens de serviço",
    singular: "item",
    roles: ["admin", "editor"],
    titleField: "title",
    columns: [
      { field: "title", label: "Serviço" },
      { field: "sort", label: "Ordem" },
    ],
    fields: [
      {
        name: "service_id",
        label: "Departamento",
        type: "relation",
        required: true,
        relation: { table: "services", label: "name" },
      },
      { name: "title", label: "Título", type: "text", required: true },
      sortField,
    ],
    order: ["sort", true],
  },
  {
    key: "produtos",
    table: "products",
    label: "Produtos digitais",
    singular: "produto",
    roles: ["admin", "editor"],
    titleField: "name",
    columns: [
      { field: "name", label: "Nome" },
      { field: "status", label: "Status" },
      { field: "published", label: "Publicado", type: "boolean" },
    ],
    fields: [
      { name: "name", label: "Nome", type: "text", required: true },
      { ...slugField, slugFrom: "name" },
      {
        name: "status",
        label: "Status do produto",
        type: "select",
        options: [
          { value: "em_desenvolvimento", label: "Em desenvolvimento" },
          { value: "em_testes", label: "Em testes" },
          { value: "disponivel", label: "Disponível" },
          { value: "em_evolucao", label: "Em evolução" },
          { value: "experimental", label: "Experimental" },
        ],
      },
      { name: "summary", label: "Resumo", type: "textarea" },
      { name: "description", label: "Descrição", type: "textarea" },
      { name: "features", label: "Funcionalidades", type: "tags", help: "Uma por linha." },
      { name: "cover_url", label: "Capa", type: "image" },
      sortField,
      { name: "published", label: "Publicado", type: "boolean" },
    ],
    order: ["sort", true],
    publish: { field: "published", kind: "boolean" },
    related: [{ resource: "midias-produto", fk: "product_id", label: "Imagens e demonstrações" }],
  },
  {
    key: "midias-produto",
    table: "product_media",
    label: "Mídias de produtos",
    singular: "mídia",
    roles: ["admin", "editor"],
    titleField: "caption",
    columns: [
      { field: "kind", label: "Tipo" },
      { field: "caption", label: "Legenda" },
      { field: "sort", label: "Ordem" },
    ],
    fields: [
      {
        name: "product_id",
        label: "Produto",
        type: "relation",
        required: true,
        relation: { table: "products", label: "name" },
      },
      {
        name: "kind",
        label: "Tipo",
        type: "select",
        options: [
          { value: "image", label: "Imagem" },
          { value: "video", label: "Vídeo" },
        ],
      },
      { name: "url", label: "Arquivo", type: "image", required: true },
      { name: "caption", label: "Legenda", type: "text" },
      sortField,
    ],
    order: ["sort", true],
  },
  {
    key: "banners",
    table: "banners",
    label: "Banners",
    singular: "banner",
    roles: ["admin", "editor"],
    titleField: "key",
    columns: [
      { field: "key", label: "Chave" },
      { field: "title", label: "Título" },
      { field: "active", label: "Ativo", type: "boolean" },
    ],
    fields: [
      {
        name: "key",
        label: "Chave",
        type: "text",
        required: true,
        createOnly: true,
        help: "O banner principal da Home usa a chave “hero”.",
      },
      { name: "title", label: "Título", type: "text" },
      { name: "subtitle", label: "Subtítulo", type: "textarea" },
      { name: "cta_label", label: "Botão principal: texto", type: "text" },
      { name: "cta_url", label: "Botão principal: link", type: "text" },
      { name: "cta2_label", label: "Botão secundário: texto", type: "text" },
      { name: "cta2_url", label: "Botão secundário: link", type: "text" },
      { name: "image_url", label: "Imagem", type: "image" },
      { name: "video_url", label: "Vídeo (URL)", type: "url" },
      { name: "active", label: "Ativo", type: "boolean" },
    ],
    order: ["key", true],
  },
  {
    key: "artigos",
    table: "articles",
    label: "Conteúdo (artigos e páginas)",
    singular: "conteúdo",
    roles: ["admin", "editor"],
    titleField: "title",
    columns: [
      { field: "title", label: "Título" },
      { field: "kind", label: "Tipo" },
      { field: "status", label: "Status" },
    ],
    fields: [
      { name: "title", label: "Título", type: "text", required: true },
      { ...slugField, slugFrom: "title" },
      {
        name: "kind",
        label: "Tipo",
        type: "select",
        options: [
          { value: "article", label: "Artigo" },
          { value: "page", label: "Página institucional" },
        ],
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "draft", label: "Rascunho" },
          { value: "published", label: "Publicado" },
        ],
      },
      { name: "excerpt", label: "Resumo", type: "textarea" },
      {
        name: "body",
        label: "Texto",
        type: "textarea",
        help: "Texto simples. Separe parágrafos com uma linha em branco.",
      },
      { name: "cover_url", label: "Capa", type: "image" },
      { name: "seo_title", label: "SEO: título", type: "text" },
      { name: "seo_description", label: "SEO: descrição", type: "textarea" },
    ],
    order: ["created_at", false],
    publish: { field: "status", kind: "status" },
  },
  {
    key: "categorias",
    table: "categories",
    label: "Categorias do portfólio",
    singular: "categoria",
    roles: ["admin", "editor"],
    titleField: "name",
    columns: [
      { field: "name", label: "Nome" },
      { field: "active", label: "Ativa", type: "boolean" },
      { field: "sort", label: "Ordem" },
    ],
    fields: [
      { name: "name", label: "Nome", type: "text", required: true },
      { ...slugField, slugFrom: "name" },
      sortField,
      { name: "active", label: "Ativa", type: "boolean" },
    ],
    order: ["sort", true],
  },
  {
    key: "clientes",
    table: "clients",
    label: "Clientes",
    singular: "cliente",
    roles: ["admin", "sales"],
    titleField: "name",
    columns: [
      { field: "name", label: "Nome" },
      { field: "company", label: "Empresa" },
      { field: "email", label: "E-mail" },
    ],
    fields: [
      { name: "name", label: "Nome", type: "text", required: true },
      { name: "company", label: "Empresa", type: "text" },
      { name: "email", label: "E-mail", type: "text" },
      { name: "phone", label: "Telefone / WhatsApp", type: "text" },
      { name: "notes", label: "Observações", type: "textarea" },
    ],
    order: ["name", true],
  },
];

export const getResource = (key: string) => resources.find((r) => r.key === key);

export const leadStatuses = [
  { value: "novo", label: "Novo" },
  { value: "em_analise", label: "Em análise" },
  { value: "aguardando_informacoes", label: "Aguardando informações" },
  { value: "proposta_enviada", label: "Proposta enviada" },
  { value: "aprovado", label: "Aprovado" },
  { value: "em_producao", label: "Em produção" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
] as const;

export const leadStatusLabel = (v: string) => leadStatuses.find((s) => s.value === v)?.label ?? v;

/** Seções do menu e quem pode acessá-las. */
export const sections: { href: string; label: string; roles: Role[] }[] = [
  { href: "/admin", label: "Dashboard", roles: ["admin", "editor", "sales"] },
  { href: "/admin/orcamentos", label: "Orçamentos", roles: ["admin", "sales"] },
  { href: "/admin/clientes", label: "Clientes", roles: ["admin", "sales"] },
  { href: "/admin/projetos", label: "Projetos", roles: ["admin", "editor"] },
  { href: "/admin/servicos", label: "Departamentos", roles: ["admin", "editor"] },
  { href: "/admin/itens-servico", label: "Itens de serviço", roles: ["admin", "editor"] },
  { href: "/admin/produtos", label: "Produtos digitais", roles: ["admin", "editor"] },
  { href: "/admin/banners", label: "Banners", roles: ["admin", "editor"] },
  { href: "/admin/artigos", label: "Conteúdo", roles: ["admin", "editor"] },
  { href: "/admin/categorias", label: "Categorias", roles: ["admin", "editor"] },
  { href: "/admin/midias-projeto", label: "Mídias de projetos", roles: ["admin", "editor"] },
  { href: "/admin/midias-produto", label: "Mídias de produtos", roles: ["admin", "editor"] },
  { href: "/admin/configuracoes", label: "Configurações", roles: ["admin"] },
  { href: "/admin/usuarios", label: "Usuários", roles: ["admin"] },
];
