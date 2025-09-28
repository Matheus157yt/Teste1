/*
Rotas do painel admin:
- CRUD usuários
- CRUD cursos e módulos
- Logs de auditoria
Admin pode mudar role, bloquear/desbloquear, editar qualquer dado.
*/
const express = require('express');

module.exports = (pool) => {
  const router = express.Router();

  // --- Users CRUD ---
  router.get('/users', async (req, res) => {
    try {
      const client = await pool.connect();
      const users = await client.query('SELECT id, name, email, role, blocked, created_at FROM users ORDER BY id');
      client.release();
      res.json({ users: users.rows });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Erro no servidor' }); }
  });

  router.post('/users', async (req, res) => {
    // Criar usuário (admin cria com role opcional)
    try {
      const { name, email, password, role } = req.body;
      if (!name || !email || !password) return res.status(400).json({ error: 'Campos incompletos' });
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash(password, 10);
      const client = await pool.connect();
      const result = await client.query('INSERT INTO users (name,email,password,role,blocked,created_at) VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING id,name,email,role', [name,email,hash,role || 'student',false]);
      await client.query('INSERT INTO audit_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())', [req.user.id, 'admin_create_user', `Criou usuário ${email}`]);
      client.release();
      res.json({ user: result.rows[0] });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Erro no servidor' }); }
  });

  router.put('/users/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const { name, email, role, blocked } = req.body;
      const client = await pool.connect();
      await client.query('UPDATE users SET name=$1, email=$2, role=$3, blocked=$4 WHERE id=$5', [name,email,role,blocked,id]);
      await client.query('INSERT INTO audit_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())', [req.user.id, 'admin_edit_user', `Editou usuário ${id}`]);
      client.release();
      res.json({ ok: true });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Erro no servidor' }); }
  });

  router.delete('/users/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const client = await pool.connect();
      await client.query('DELETE FROM users WHERE id=$1', [id]);
      await client.query('INSERT INTO audit_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())', [req.user.id, 'admin_delete_user', `Deletou usuário ${id}`]);
      client.release();
      res.json({ ok: true });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Erro no servidor' }); }
  });

  // --- Cursos CRUD ---
  router.get('/courses', async (req, res) => {
    try {
      const client = await pool.connect();
      const courses = await client.query('SELECT * FROM courses ORDER BY id');
      client.release();
      res.json({ courses: courses.rows });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Erro no servidor' }); }
  });

  router.post('/courses', async (req, res) => {
    try {
      const { title, description } = req.body;
      const client = await pool.connect();
      const result = await client.query('INSERT INTO courses (title, description, created_at) VALUES ($1,$2,NOW()) RETURNING *', [title,description]);
      await client.query('INSERT INTO audit_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())', [req.user.id, 'create_course', `Criou curso ${title}`]);
      client.release();
      res.json({ course: result.rows[0] });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Erro no servidor' }); }
  });

  router.put('/courses/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const { title, description } = req.body;
      const client = await pool.connect();
      await client.query('UPDATE courses SET title=$1, description=$2 WHERE id=$3', [title,description,id]);
      await client.query('INSERT INTO audit_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())', [req.user.id, 'edit_course', `Editou curso ${id}`]);
      client.release();
      res.json({ ok: true });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Erro no servidor' }); }
  });

  router.delete('/courses/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const client = await pool.connect();
      await client.query('DELETE FROM modules WHERE course_id=$1', [id]);
      await client.query('DELETE FROM courses WHERE id=$1', [id]);
      await client.query('INSERT INTO audit_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())', [req.user.id, 'delete_course', `Deletou curso ${id}`]);
      client.release();
      res.json({ ok: true });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Erro no servidor' }); }
  });

  // --- Modules CRUD ---
  router.get('/courses/:courseId/modules', async (req, res) => {
    try {
      const courseId = req.params.courseId;
      const client = await pool.connect();
      const modules = await client.query('SELECT * FROM modules WHERE course_id=$1 ORDER BY position', [courseId]);
      client.release();
      res.json({ modules: modules.rows });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Erro no servidor' }); }
  });

  router.post('/courses/:courseId/modules', async (req, res) => {
    try {
      const courseId = req.params.courseId;
      const { title, content, position } = req.body;
      const client = await pool.connect();
      const result = await client.query('INSERT INTO modules (course_id, title, content, position, created_at) VALUES ($1,$2,$3,$4,NOW()) RETURNING *', [courseId,title,content,position || 0]);
      await client.query('INSERT INTO audit_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())', [req.user.id, 'create_module', `Criou módulo ${title}`]);
      client.release();
      res.json({ module: result.rows[0] });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Erro no servidor' }); }
  });

  router.put('/modules/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const { title, content, position } = req.body;
      const client = await pool.connect();
      await client.query('UPDATE modules SET title=$1, content=$2, position=$3 WHERE id=$4', [title,content,position,id]);
      await client.query('INSERT INTO audit_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())', [req.user.id, 'edit_module', `Editou módulo ${id}`]);
      client.release();
      res.json({ ok: true });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Erro no servidor' }); }
  });

  router.delete('/modules/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const client = await pool.connect();
      await client.query('DELETE FROM modules WHERE id=$1', [id]);
      await client.query('INSERT INTO audit_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())', [req.user.id, 'delete_module', `Deletou módulo ${id}`]);
      client.release();
      res.json({ ok: true });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Erro no servidor' }); }
  });

  // --- Audit logs ---
  router.get('/logs', async (req, res) => {
    try {
      const client = await pool.connect();
      const logs = await client.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200');
      client.release();
      res.json({ logs: logs.rows });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Erro no servidor' }); }
  });

  return router;
};
