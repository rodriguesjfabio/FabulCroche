# Fabul Crochet

Site estático de apresentação de trabalhos de crochet, criado com Vite.

## Como usar

1. Instalar dependências:
   ```bash
   npm install
   ```
2. Iniciar o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
3. Abrir o site em `http://localhost:4173`.

## Estrutura

- `index.html` — página principal
- `src/styles/main.css` — estilos e paleta de cores
- `src/scripts/main.js` — lógica de galeria e comentários
- `src/data/portfolio.js` — dados do portfólio
- `public/images/` — imagens e logos existentes

## Observações

- O sistema de comentários já está implementado localmente usando `localStorage`.
- Comentários reais em backend podem ser adicionados posteriormente com Cloudflare Workers ou outro serviço.
