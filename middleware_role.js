/*
Middleware para checar role do usuário.
Uso: app.use('/api/admin', authenticateToken, middlewareRole('admin'), routesAdmin)
*/
module.exports = function(requiredRole) {
  return function(req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Usuário não autenticado' });
    if (req.user.role !== requiredRole) return res.status(403).json({ error: 'Acesso negado: role insuficiente' });
    next();
  };
};
