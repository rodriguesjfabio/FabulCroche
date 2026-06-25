# Git + GitHub + VS Code — Guia Rápido

## Primeira configuração (uma única vez por projeto)

### Inicializar o Git

```bash
git init
```

### Adicionar todos os arquivos

```bash
git add .
```

### Criar o primeiro commit

```bash
git commit -m "Primeiro commit"
```

### Conectar ao repositório do GitHub

```bash
git remote add origin https://github.com/USUARIO/REPOSITORIO.git
```

### Renomear a branch para `main`

```bash
git branch -M main
```

### Enviar para o GitHub

```bash
git push -u origin main
```

---

# Fluxo diário

## Verificar alterações

```bash
git status
```

## Adicionar alterações

```bash
git add .
```

ou

```bash
git add nome_do_arquivo
```

## Criar um commit

```bash
git commit -m "Descrição da alteração"
```

Exemplos:

* Corrige bug no login
* Adiciona catálogo de produtos
* Atualiza layout da página inicial

## Enviar para o GitHub

```bash
git push
```

---

# Comandos úteis

## Ver histórico

```bash
git log --oneline
```

## Ver diferenças antes do commit

```bash
git diff
```

## Baixar alterações do GitHub

```bash
git pull
```

## Ver branch atual

```bash
git branch
```

## Ver repositório remoto

```bash
git remote -v
```

---

# Fluxo recomendado

Sempre que terminar uma funcionalidade:

```bash
git status
git add .
git commit -m "Descrição da alteração"
git push
```

---

# Boas práticas

* Faça commits pequenos e frequentes.
* Escreva mensagens claras.
* Evite mensagens como "update" ou "alterações".
* Sempre execute `git pull` antes de começar a trabalhar em outro computador.
* Faça `git push` ao terminar uma funcionalidade importante para manter o GitHub atualizado.

---

# Estrutura mental

```
Modificar arquivos
        ↓
git status
        ↓
git add .
        ↓
git commit -m "Descrição"
        ↓
git push
```
