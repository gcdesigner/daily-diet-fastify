# Daily Diet - Desafio

Este projeto tem como objetivo criar a estrutura de backend de uma aplicação de gerenciamento de Dietas, utilizando as stack abaixo:

```
- Nodejs
- Fastify
- Drizzle ORM
- Zod
- SQLite3
- Vitest
```

## Como rodar o projeto

1. Instalar deps: `npm install`
2. Iniciar banco de dados: `npm run db:push`
3. Rodar projeto: `npm run dev`

O projeto vai rodar na porta: `:3333`

## Como rodar os testes

Para rodar os testes, primeiro é necessário rodar:

```js
npm run db:generate
```

Depois basta rodar:

```
npm run test
```
