export type Department = {
  slug: string;
  name: string;
  /** Categoria usada em portfólio e orçamento. */
  category: string;
  tagline: string;
  summary: string;
  services: string[];
  benefits: { title: string; text: string }[];
  faq: { q: string; a: string }[];
};

export const departments: Department[] = [
  {
    slug: "design-branding",
    name: "Design & Branding",
    category: "Branding",
    tagline: "Marcas visualmente fortes e comunicação de alto impacto.",
    summary:
      "Marcas visualmente fortes e comunicação de alto impacto, do logotipo à direção de arte.",
    services: [
      "Criação de logotipos",
      "Identidade visual",
      "Manual de marca",
      "Rebranding",
      "Design gráfico",
      "Flyers profissionais",
      "Artes para Instagram",
      "Campanhas promocionais",
      "Banners",
      "Cartazes",
      "Materiais publicitários",
      "Design para impressão",
      "Mockups",
      "Artes para DTF",
      "Identidade visual para eventos",
      "Identidade para marcas e estabelecimentos",
      "Direção de arte",
    ],
    benefits: [
      {
        title: "Identidade coerente",
        text: "Todos os pontos de contato falam a mesma língua visual.",
      },
      {
        title: "Do digital ao impresso",
        text: "Materiais pensados para tela, gráfica, DTF e ponto de venda.",
      },
      {
        title: "Direção de arte",
        text: "Decisões visuais com critério, não apenas arte bonita.",
      },
    ],
    faq: [
      {
        q: "Vocês criam a marca do zero e também refazem marcas existentes?",
        a: "Sim. Atendemos tanto a criação de identidade quanto o rebranding de marcas que já existem.",
      },
    ],
  },
  {
    slug: "motion-design-animacao",
    name: "Motion Design & Animação",
    category: "Motion",
    tagline: "Movimento, ritmo e identidade com acabamento profissional.",
    summary: "Aberturas, vinhetas, intros e animações com ritmo e identidade próprios.",
    services: [
      "Motion graphics",
      "Animação de logotipos",
      "Aberturas cinematográficas",
      "Intros para eventos",
      "Vinhetas",
      "Animação de identidade visual",
      "Animação de textos",
      "Conteúdos para telões",
      "Animações promocionais",
      "Vídeos comerciais",
      "Animações para redes sociais",
      "Composições visuais",
    ],
    benefits: [
      {
        title: "Ritmo e impacto",
        text: "Animações construídas para prender atenção desde o primeiro segundo.",
      },
      {
        title: "Marca em movimento",
        text: "Sua identidade visual ganha vida em vários formatos.",
      },
      {
        title: "Formatos sob medida",
        text: "Redes sociais, telões, eventos ou TV: o formato certo para cada uso.",
      },
    ],
    faq: [
      {
        q: "Posso receber a animação em formatos diferentes?",
        a: "Sim. Combinamos no briefing onde o material será exibido para entregar no formato adequado.",
      },
    ],
  },
  {
    slug: "audiovisual-producao",
    name: "Audiovisual & Produção",
    category: "Audiovisual",
    tagline: "Da criação à finalização, tudo no mesmo laboratório.",
    summary: "Da captação à pós-produção: criamos e finalizamos vídeos, campanhas e conteúdos.",
    services: [
      "Produção audiovisual",
      "Filmagem",
      "Edição de vídeos",
      "Vídeos promocionais",
      "Vídeos institucionais",
      "Conteúdo para redes sociais",
      "Produção de videoclipes",
      "Captação de eventos",
      "Pós-produção",
      "Edição de áudio",
      "Produção de chamadas",
      "Produção de campanhas em vídeo",
      "Conteúdo publicitário",
    ],
    benefits: [
      {
        title: "Ponta a ponta",
        text: "Captação, edição, áudio e finalização sob a mesma direção.",
      },
      {
        title: "Linguagem comercial",
        text: "Vídeos pensados para comunicar e vender, não só para ficar bonitos.",
      },
      {
        title: "Cobertura de eventos",
        text: "Captação e entrega de conteúdo para divulgação e memória do evento.",
      },
    ],
    faq: [
      {
        q: "Vocês fazem só a edição de material que eu já gravei?",
        a: "Sim. Podemos entrar apenas na edição e pós-produção ou cuidar do projeto completo.",
      },
    ],
  },
  {
    slug: "led-visual-experiencias",
    name: "LED Visual & Experiências",
    category: "LED Visual",
    tagline: "Palcos e ambientes transformados em experiências visuais marcantes.",
    summary:
      "Loops, telões, visualizers e conteúdo para VJ que transformam palcos em experiências.",
    services: [
      "Criação de loops para painéis LED",
      "Conteúdos visuais para telões",
      "Motion para eventos",
      "Animações para palco",
      "Visualizers musicais",
      "Conteúdo para VJ",
      "Composições visuais",
      "Identidade visual para cenários",
      "Conteúdos para aparelhagens",
      "Elementos gráficos para grandes eventos",
      "Animações para shows",
      "Conteúdo visual sincronizado com apresentações",
    ],
    benefits: [
      {
        title: "Feito para o palco",
        text: "Conteúdo pensado para a escala, a luz e a distância do público.",
      },
      {
        title: "Identidade de cenário",
        text: "Visuais que reforçam a personalidade do artista, da festa ou da marca.",
      },
      {
        title: "Sincronia",
        text: "Composições alinhadas ao som e à apresentação.",
      },
    ],
    faq: [
      {
        q: "Preciso informar a resolução do painel?",
        a: "Sim. As dimensões e o formato do painel ou telão definem como o conteúdo é produzido.",
      },
    ],
  },
  {
    slug: "eventos-experiencias",
    name: "Eventos & Experiências",
    category: "Eventos",
    tagline: "De eventos populares a grandes produções.",
    summary: "Identidade, divulgação e comunicação visual para eventos de qualquer porte.",
    services: [
      "Identidade visual de eventos",
      "Campanhas de divulgação",
      "Flyers e materiais promocionais",
      "Motion de divulgação",
      "Vídeos de abertura",
      "Comunicação visual",
      "Conteúdos para painéis",
      "Conceitos visuais para festas",
      "Direção de arte",
      "Produção de materiais digitais",
      "Experiências audiovisuais",
    ],
    benefits: [
      {
        title: "Conceito visual único",
        text: "Cada evento ganha uma identidade própria, do convite ao palco.",
      },
      {
        title: "Divulgação completa",
        text: "Arte estática, motion e vídeo para a campanha inteira.",
      },
      {
        title: "Qualquer porte",
        text: "Atendemos eventos populares e produções de grande escala.",
      },
    ],
    faq: [
      {
        q: "Vocês trabalham com prazos curtos de evento?",
        a: "Informe a data do evento no orçamento. Avaliamos a viabilidade e combinamos o cronograma.",
      },
    ],
  },
  {
    slug: "marketing-comunicacao",
    name: "Marketing & Comunicação",
    category: "Marketing",
    tagline: "Comunicação transformada em oportunidades comerciais.",
    summary: "Estratégia, campanhas e criativos que transformam comunicação em oportunidade.",
    services: [
      "Estratégia de comunicação",
      "Campanhas promocionais",
      "Conteúdo para redes sociais",
      "Criativos publicitários",
      "Planejamento de campanhas",
      "Identidade de campanhas",
      "Comunicação para lançamentos",
      "Conteúdo comercial",
      "Materiais para vendas",
      "Estratégias de presença digital",
    ],
    benefits: [
      {
        title: "Foco comercial",
        text: "Cada peça tem um objetivo claro dentro da campanha.",
      },
      {
        title: "Criação e estratégia juntas",
        text: "O mesmo time que planeja também produz os criativos.",
      },
      {
        title: "Presença consistente",
        text: "Conteúdo alinhado entre redes, anúncios e materiais de venda.",
      },
    ],
    faq: [
      {
        q: "Vocês gerenciam anúncios e redes sociais?",
        a: "Nosso foco é estratégia, planejamento e criação de conteúdo. Detalhamos o escopo no orçamento.",
      },
    ],
  },
  {
    slug: "tecnologia-desenvolvimento",
    name: "Tecnologia & Desenvolvimento Digital",
    category: "Tecnologia",
    tagline: "O laboratório de inovação do Marques Lab.",
    summary: "Sistemas, aplicativos, automações e IA aplicada à criação.",
    services: [
      "Desenvolvimento de sistemas",
      "Aplicativos",
      "Plataformas digitais",
      "Sistemas de gestão",
      "Automação de processos",
      "Ferramentas para produção criativa",
      "Soluções para eventos",
      "Interfaces e dashboards",
      "Desenvolvimento de produtos digitais",
      "Inteligência artificial aplicada à criação",
      "Integrações e APIs",
    ],
    benefits: [
      {
        title: "Software sob medida",
        text: "Soluções desenhadas para o fluxo real do seu negócio.",
      },
      {
        title: "Criatividade + código",
        text: "Interfaces cuidadas e tecnologia na mesma equipe.",
      },
      {
        title: "Produtos próprios",
        text: "Experiência de quem também desenvolve as próprias ferramentas.",
      },
    ],
    faq: [
      {
        q: "Vocês desenvolvem sistemas sob encomenda?",
        a: "Sim. Conte o problema que quer resolver no orçamento e avaliamos o melhor caminho.",
      },
    ],
  },
];

export const sharedFaq = [
  {
    q: "Como funciona o orçamento?",
    a: "Você descreve o projeto no formulário, recebe um número de protocolo e continuamos a conversa pelo WhatsApp.",
  },
  {
    q: "Preciso criar conta para pedir um orçamento?",
    a: "Não. Basta preencher o formulário.",
  },
];

export const getDepartment = (slug: string) => departments.find((d) => d.slug === slug);
