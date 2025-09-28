/*
Servidor principal - Node.js + Express
Stack: express, pg, bcrypt, jsonwebtoken, cookie-parser
Instruções no README.md para instalar dependências.
*/
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Carregar variáveis (em produção use .env)
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'troque_essa_chave_para_producao';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'troque_refresh_secret';
const SALT_ROUNDS = 10;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/membersdb'
});

const app = express();
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, ''))); // serve arquivos na raiz

// Funções de token
function generateAccessToken(user) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '15m' });
}
function generateRefreshToken(user) {
  return jwt.sign(user, REFRESH_SECRET, { expiresIn: '7d' });
}

// Importar módulos locais
const auth = require('./auth')(pool, bcrypt, JWT_SECRET, REFRESH_SECRET, SALT_ROUNDS, generateAccessToken, generateRefreshToken);
const middlewareRole = require('./middleware_role');
const routesAdmin = require('./routes_admin');
const routesStudent = require('./routes_student');

// Rotas de autenticação
app.post('/api/auth/register', auth.register);
app.post('/api/auth/login', auth.login);
app.post('/api/auth/refresh', auth.refresh);
app.post('/api/auth/logout', auth.logout);

// Rotas protegidas
app.use('/api/admin', auth.authenticateToken, middlewareRole('admin'), routesAdmin(pool));
app.use('/api/student', auth.authenticateToken, middlewareRole('student'), routesStudent(pool));

// Rota pública para checar saúde
app.get('/api/ping', (req, res) => res.json({ ok: true }));

// Inicia servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
