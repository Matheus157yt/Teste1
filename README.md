# Área de Membros - Exemplo (Node.js + Express + PostgreSQL)

Projeto exemplo de área de membros com:
- Autenticação JWT (access token + refresh token)
- Roles: admin e student
- Painel admin: CRUD de usuários, cursos, módulos + logs
- Painel student: ver cursos, módulos, marcar progresso

## Arquivos incluídos (todos na raiz)
- server.js
- auth.js
- middleware_role.js
- routes_admin.js
- routes_student.js
- db.sql
- public_login.html
- public_register.html
- public_admin.html
- public_student.html
- client.js
- styles.css
- README.md

## Requisitos
- Node.js 18+
- PostgreSQL

## Passos para rodar localmente

1. Clone o repositório ou copie os arquivos para uma pasta.
2. Instale dependências:
```bash
npm init -y
npm install express body-parser cookie-parser jsonwebtoken bcrypt pg
```

3. Configure o PostgreSQL:
- Crie um banco `membersdb` ou ajuste `DATABASE_URL` no `server.js`.
- Rode as migrations:
```bash
psql -U postgres -d membersdb -f db.sql
```
> Observação: a migration cria um usuário admin de exemplo com senha `admin123` (em produção troque).

4. Rodar o servidor:
```bash
node server.js
```

5. Acesse:
- Tela de login: `http://localhost:3000/public_login.html`
- Tela de cadastro: `http://localhost:3000/public_register.html`
- Dashboard admin (após login): `public_admin.html`
- Dashboard student (após login): `public_student.html`

## Notas de segurança
- Tokens e secrets estão diretamente no código para facilitar testes — **troque** e use variáveis de ambiente em produção.
- Em produção, armazene refresh tokens em cookie httpOnly e use HTTPS.
- Faça validações adicionais nos inputs e proteja endpoints.

## Observações
Este é um exemplo funcional e intencionalmente simples para facilitar a compreensão.
Sinta-se livre para melhorar a UI, adicionar paginação, uploads de vídeo, integração com payment gateways e outras funcionalidades.
