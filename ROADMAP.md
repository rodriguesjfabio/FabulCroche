# Roadmap do site estático de crochet

## Objetivo
Criar um site estático para mostrar trabalhos de crochet, com design inspirado na paleta de cores existente em `images/Códigos Hex.txt`. O site deve ter:

- Navegação clara e responsiva
- Seção de portfólio com imagens e descrição dos trabalhos
- Área para comentários reais em cada imagem (inicialmente local, com caminho para persistência real)
- Seção de contato
- Deploy futuro no Cloudflare Pages

## Ferramentas e abordagem

- Usar um gerador de site estático leve: Vite com template vanilla
- HTML/CSS/JavaScript moderno
- Pastas principais:
  - `index.html`
  - `src/styles/main.css`
  - `src/scripts/main.js`
  - `src/data/portfolio.js`
  - `public/images/` para logos e fotos do portfólio
- Opção futura: `wrangler.toml` e Cloudflare Workers/KV para comentários persistentes

## Paleta de cores

- `#33205A` — roxo escuro para fundo e sombras
- `#5233A3` — roxo principal para blocos
- `#6D43B8` — roxo claro para destaques
- `#F98EA9` — rosa principal para acentos
- `#F7B8BD` — rosa claro para brilhos
- `#A3566C` — rosa escuro para sombras
- `#49AEEF` — azul para botões e elementos de ação
- `#2D78C8` — azul escuro para detalhes
- `#BC9699` — bege para detalhes suaves
- `#FDFCFC` — branco para texto e destaques

## Estrutura do site

1. Header e Navbar
   - Logo
   - Links âncora: Home, Portfólio, Sobre, Contato
   - Menu hamburger em mobile

2. Hero
   - Nome/brand do site
   - Slogan curto e convite para ver trabalhos
   - CTA para portfólio ou contato

3. Seção de Portfólio
   - Galeria de cards com imagem, título e descrição
   - Modal ou painel de detalhes para ver cada trabalho
   - Área de comentários por imagem
     - MVP: comentários armazenados no navegador via `localStorage`
     - Futuro: comentários reais em backend com Cloudflare Workers/KV ou serviço de terceiros
   - Filtros básicos por categoria/técnica (opcional)

4. Seção Sobre
   - Texto sobre a autora do crochet e o propósito dos trabalhos
   - Valores, estilo e inspiração

5. Seção Contato
   - Formulário com nome, email, mensagem
   - Alternativa `mailto:` ou integração simples com Cloudflare Forms
   - Links para redes sociais ou WhatsApp

6. Footer
   - Direitos autorais
   - Contato rápido
   - Links para redes sociais

## Comentários reais

- Ideal: conectar um backend simples para salvar comentários
- Estratégia inicial:
  - Implementar interface de comentário funcional no frontend
  - Permitir enviar e exibir comentários localmente
- Evolução:
  - Criar Cloudflare Worker com KV para armazenar comentários
  - Configurar endpoint `/comments` para receber e listar comentários
  - Adicionar validação básica e proteção anti-spam leve

## Deploy e domínio

- Primeiro: montar e testar em `localhost`
- Depois: deploy no Cloudflare Pages
- Domínio próprio pode ser adicionado mais tarde

## Etapas gerais de implementação

1. Criar estrutura de pastas e projeto estático
2. Definir layout e navegação em `index.html`
3. Implementar estilo base e variáveis no CSS
4. Desenvolver galeria e modal de portfólio
5. Construir área de comentários local
6. Adicionar seção de contato e rodapé
7. Testar responsividade e acessibilidade
8. Preparar deploy no Cloudflare

## Próximos passos

- Confirmar o uso de um site estático simples
- Criar a estrutura de pastas inicial
- Popular o site com imagens e textos de exemplo
- Validar localmente antes de avançar para deploy
