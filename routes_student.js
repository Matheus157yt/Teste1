/*
Rotas do painel student:
- Listar cursos
- Listar módulos de um curso
- Marcar progresso do aluno (concluir)
*/
const express = require('express');

module.exports = (pool) => {
  const router = express.Router();

  router.get('/courses', async (req, res) => {
    try {
      const client = await pool.connect();
      const courses = await client.query('SELECT * FROM courses ORDER BY id');
      client.release();
      res.json({ courses: courses.rows });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Erro no servidor' }); }
  });

  router.get('/courses/:courseId/modules', async (req, res) => {
    try {
      const courseId = req.params.courseId;
      const client = await pool.connect();
      const modules = await client.query('SELECT * FROM modules WHERE course_id=$1 ORDER BY position', [courseId]);
      // buscar progresso do usuário
      const progress = await client.query('SELECT module_id FROM progress WHERE user_id=$1 AND course_id=$2', [req.user.id, courseId]);
      const done = progress.rows.map(r => r.module_id);
      client.release();
      res.json({ modules: modules.rows, completedModuleIds: done });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Erro no servidor' }); }
  });

  router.post('/courses/:courseId/modules/:moduleId/complete', async (req, res) => {
    try {
      const { courseId, moduleId } = req.params;
      const client = await pool.connect();
      await client.query('INSERT INTO progress (user_id, course_id, module_id, completed_at) VALUES ($1,$2,$3,NOW()) ON CONFLICT (user_id, course_id, module_id) DO NOTHING', [req.user.id, courseId, moduleId]);
      await client.query('INSERT INTO audit_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())', [req.user.id, 'complete_module', `Usuário concluiu módulo ${moduleId}`]);
      client.release();
      res.json({ ok: true });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Erro no servidor' }); }
  });

  router.post('/courses/:courseId/modules/:moduleId/uncomplete', async (req, res) => {
    try {
      const { courseId, moduleId } = req.params;
      const client = await pool.connect();
      await client.query('DELETE FROM progress WHERE user_id=$1 AND course_id=$2 AND module_id=$3', [req.user.id, courseId, moduleId]);
      await client.query('INSERT INTO audit_logs (user_id, action, details, created_at) VALUES ($1,$2,$3,NOW())', [req.user.id, 'uncomplete_module', `Usuário removeu conclusão do módulo ${moduleId}`]);
      client.release();
      res.json({ ok: true });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Erro no servidor' }); }
  });

  return router;
};
