const express = require('express');
const router = express.Router();
const db = require('../db');

function ensureApiAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Não autenticado' });
}

// Listar notificações do usuário
router.get('/notifications', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const notifications = await db.getNotifications(userId);
    return res.json(notifications);
  } catch (err) {
    console.error('Erro ao listar notificações:', err);
    return res.status(500).json({ message: 'Erro ao listar notificações' });
  }
});

// Marcar notificação como lida
router.post('/notifications/:notificationId/read', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { notificationId } = req.params;
    await db.markNotificationAsRead(notificationId, userId);
    return res.json({ message: 'Notificação marcada como lida' });
  } catch (err) {
    console.error('Erro ao marcar notificação como lida:', err);
    return res.status(500).json({ message: 'Erro ao marcar notificação como lida' });
  }
});

// Marcar todas as notificações como lidas
router.post('/notifications/read-all', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    await db.markAllNotificationsAsRead(userId);
    return res.json({ message: 'Todas as notificações marcadas como lidas' });
  } catch (err) {
    console.error('Erro ao marcar todas as notificações como lidas:', err);
    return res.status(500).json({ message: 'Erro ao marcar todas as notificações como lidas' });
  }
});

// Contar notificações não lidas
router.get('/notifications/unread-count', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const count = await db.getUnreadNotificationCount(userId);
    return res.json({ count });
  } catch (err) {
    console.error('Erro ao contar notificações não lidas:', err);
    return res.status(500).json({ message: 'Erro ao contar notificações não lidas' });
  }
});

module.exports = router;




