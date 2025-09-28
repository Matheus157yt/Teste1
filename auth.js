/*
Módulo de autenticação: login, cadastro, refresh token.
Exporta funções que dependem do pool (postgres) e bcrypt.
*/
module.exports = (pool, bcrypt, JWT_SECRET, REFRESH_SECRET, SALT_ROUNDS, genAccessToken, genRefreshToken) => {
  const jwt = require('jsonwebtoken');

  // Middleware para autenticar token de acesso
  function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token ausente' });
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ error: 'Token inválido' });
      req.user = user;
      next();
    });
  }

  // Registrar usuário (role: student por padrão)
  async function register(req, res) {
    try {
      const { name, email, password } = req.body;
      if (!email || !password || !name) return res.status(400).json({ error: 'Campos incompletos' });
      const client = await pool.connect();
      const existing = await client.query('SELECT id FROM users WHERE email=$1', [email]);
      if (existing.rowCount > 0) { client.release(); return res.status(409).json({ error: 'E-mail já cadastrado' }); }
      const hash = await bcrypt.hash(password, SALT_ROUNDS);
      const result = await client.query(
        'INSERT INTO users (name, email, password, role, blocked, created_at) VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING id, name, email, role',
        [name, email, hash, 'student', false]
      );
      // Log de auditoria
      await client.query('INSERT INTO audit_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())', [result.rows[0].id, 'register', `Registro de usuário ${email}`]);
      client.release();
      res.json({ ok: true, user: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro no servidor' });
    }
  }

  // Login: gera access token e refresh token
  async function login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Campos incompletos' });
      const client = await pool.connect();
      const userRes = await client.query('SELECT id, name, email, password, role, blocked FROM users WHERE email=$1', [email]);
      if (userRes.rowCount === 0) { client.release(); return res.status(401).json({ error: 'Credenciais inválidas' }); }
      const user = userRes.rows[0];
      if (user.blocked) { client.release(); return res.status(403).json({ error: 'Usuário bloqueado' }); }
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) { client.release(); return res.status(401).json({ error: 'Credenciais inválidas' }); }
      const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
      const accessToken = genAccessToken(payload);
      const refreshToken = genRefreshToken(payload);
      // Salva refresh token no DB
      await client.query('INSERT INTO refresh_tokens (user_id, token, created_at) VALUES ($1,$2,NOW())', [user.id, refreshToken]);
      await client.query('INSERT INTO audit_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())', [user.id, 'login', `Login efetuado`]);
      client.release();
      // Retorna tokens (em produção use httpOnly cookie)
      res.json({ accessToken, refreshToken, user: payload });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro no servidor' });
    }
  }

  // Refresh token
  async function refresh(req, res) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) return res.status(400).json({ error: 'Refresh token ausente' });
      const client = await pool.connect();
      const db = await client.query('SELECT id, user_id FROM refresh_tokens WHERE token=$1', [refreshToken]);
      if (db.rowCount === 0) { client.release(); return res.status(403).json({ error: 'Refresh token inválido' }); }
      jwt.verify(refreshToken, REFRESH_SECRET, (err, user) => {
        if (err) { client.release(); return res.status(403).json({ error: 'Refresh token inválido' }); }
        const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
        const accessToken = genAccessToken(payload);
        res.json({ accessToken });
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro no servidor' });
    }
  }

  // Logout - remove refresh token
  async function logout(req, res) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) return res.status(400).json({ error: 'Refresh token ausente' });
      const client = await pool.connect();
      await client.query('DELETE FROM refresh_tokens WHERE token=$1', [refreshToken]);
      await client.query('INSERT INTO audit_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())', [null, 'logout', `Logout`]);
      client.release();
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro no servidor' });
    }
  }

  return { authenticateToken, register, login, refresh, logout };
};
