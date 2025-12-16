const express = require('express');
const router = express.Router();
const db = require('../db');
const { ObjectId } = require('mongodb');

function ensureApiAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Não autenticado' });
}

// Lista de amigos do usuário autenticado
router.get('/friends', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    console.log('[DEBUG /friends] Buscando amigos para usuário:', userId);
    const friends = await db.getFriends(userId);
    console.log('[DEBUG /friends] Amigos encontrados:', friends.length);
    friends.forEach((f, idx) => {
      console.log(`[DEBUG /friends] Amigo ${idx + 1}:`, {
        _id: f._id?.toString(),
        name: f.name
      });
    });
    return res.json(friends);
  } catch (err) {
    console.error('Erro em /api/friends:', err);
    return res.status(500).json({ message: 'Erro ao buscar amigos' });
  }
});

// Enviar solicitação de amizade
router.post('/friends/request', ensureApiAuthenticated, async (req, res) => {
  try {
    const fromUserId = req.user._id.toString();
    const { toUserId } = req.body;

    console.log('[DEBUG sendFriendRequest] Enviando solicitação de:', fromUserId, 'para:', toUserId);

    if (!toUserId) {
      console.log('[DEBUG sendFriendRequest] Erro: toUserId não fornecido');
      return res.status(400).json({ message: 'ID do usuário é obrigatório' });
    }

    if (fromUserId === toUserId) {
      console.log('[DEBUG sendFriendRequest] Erro: tentativa de enviar para si mesmo');
      return res.status(400).json({ message: 'Não é possível enviar solicitação para si mesmo' });
    }

    // Verifica se já são amigos
    const friends = await db.getFriends(fromUserId);
    console.log('[DEBUG sendFriendRequest] Amigos do usuário:', friends.length);
    const isAlreadyFriend = friends.some(f => {
      const friendId = f._id?.toString() || f._id;
      return friendId === toUserId;
    });
    
    if (isAlreadyFriend) {
      console.log('[DEBUG sendFriendRequest] Erro: já são amigos');
      return res.status(400).json({ message: 'Vocês já são amigos' });
    }

    // Verifica se já existe solicitação pendente (em qualquer direção)
    const existingRequestSent = await db.findFriendRequest(fromUserId, toUserId);
    const existingRequestReceived = await db.findFriendRequest(toUserId, fromUserId);
    
    console.log('[DEBUG sendFriendRequest] Solicitação enviada existente:', !!existingRequestSent);
    console.log('[DEBUG sendFriendRequest] Solicitação recebida existente:', !!existingRequestReceived);
    
    if (existingRequestSent && existingRequestSent.status === 'pending') {
      console.log('[DEBUG sendFriendRequest] Erro: solicitação já enviada');
      return res.status(400).json({ message: 'Solicitação já enviada' });
    }
    
    if (existingRequestReceived && existingRequestReceived.status === 'pending') {
      console.log('[DEBUG sendFriendRequest] Erro: já existe solicitação recebida (deve aceitar ao invés de enviar)');
      return res.status(400).json({ message: 'Este usuário já enviou uma solicitação para você. Verifique suas solicitações recebidas.' });
    }

    // Cria nova solicitação
    const request = await db.createFriendRequest(fromUserId, toUserId);
    console.log('[DEBUG sendFriendRequest] Solicitação criada com sucesso');
    return res.json({ message: 'Solicitação enviada', request });
  } catch (err) {
    console.error('Erro ao enviar solicitação:', err);
    return res.status(500).json({ message: 'Erro ao enviar solicitação' });
  }
});

// Listar solicitações recebidas
router.get('/friends/requests/received', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    console.log('[DEBUG] Buscando solicitações recebidas para usuário:', userId);
    const requests = await db.getFriendRequests(userId, 'received');
    console.log('[DEBUG] Solicitações recebidas encontradas:', requests.length);
    requests.forEach((req, idx) => {
      console.log(`[DEBUG] Solicitação ${idx + 1}:`, {
        _id: req._id?.toString(),
        fromUserId: req.fromUserId?.toString(),
        toUserId: req.toUserId?.toString(),
        status: req.status
      });
    });
    return res.json(requests);
  } catch (err) {
    console.error('Erro ao buscar solicitações:', err);
    return res.status(500).json({ message: 'Erro ao buscar solicitações' });
  }
});

// Listar solicitações enviadas
router.get('/friends/requests/sent', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const requests = await db.getFriendRequests(userId, 'sent');
    return res.json(requests);
  } catch (err) {
    console.error('Erro ao buscar solicitações:', err);
    return res.status(500).json({ message: 'Erro ao buscar solicitações' });
  }
});

// Aceitar solicitação de amizade
router.post('/friends/requests/:requestId/accept', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { requestId } = req.params;

    console.log('[DEBUG acceptFriendRequest] Aceitando solicitação:', requestId, 'para usuário:', userId);

    const conn = await db.connect();
    const request = await conn.collection("friendRequests").findOne({
      _id: ObjectId.createFromHexString(requestId),
      toUserId: ObjectId.createFromHexString(userId),
      status: 'pending'
    });

    if (!request) {
      console.log('[DEBUG acceptFriendRequest] Solicitação não encontrada');
      return res.status(404).json({ message: 'Solicitação não encontrada' });
    }

    const fromUserId = request.fromUserId?.toString() || request.fromUserId;
    const toUserId = request.toUserId?.toString() || request.toUserId;

    console.log('[DEBUG acceptFriendRequest] IDs:', { fromUserId, toUserId });

    await db.acceptFriendRequest(requestId, fromUserId, toUserId);
    
    // Verifica se a amizade foi criada
    const friends = await db.getFriends(userId);
    console.log('[DEBUG acceptFriendRequest] Amigos após aceitar:', friends.length);
    
    return res.json({ message: 'Solicitação aceita' });
  } catch (err) {
    console.error('Erro ao aceitar solicitação:', err);
    return res.status(500).json({ message: 'Erro ao aceitar solicitação' });
  }
});

// Recusar solicitação de amizade
router.post('/friends/requests/:requestId/reject', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { requestId } = req.params;

    const conn = await db.connect();
    const request = await conn.collection("friendRequests").findOne({
      _id: ObjectId.createFromHexString(requestId),
      toUserId: ObjectId.createFromHexString(userId),
      status: 'pending'
    });

    if (!request) {
      return res.status(404).json({ message: 'Solicitação não encontrada' });
    }

    await db.rejectFriendRequest(requestId);
    return res.json({ message: 'Solicitação recusada' });
  } catch (err) {
    console.error('Erro ao recusar solicitação:', err);
    return res.status(500).json({ message: 'Erro ao recusar solicitação' });
  }
});

// Remover amigo
router.delete('/friends/:friendId', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { friendId } = req.params;

    await db.removeFriend(userId, friendId);
    return res.json({ message: 'Amigo removido' });
  } catch (err) {
    console.error('Erro ao remover amigo:', err);
    return res.status(500).json({ message: 'Erro ao remover amigo' });
  }
});

// Buscar usuários públicos (para explorar)
router.get('/users/search', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json([]);
    }

    // Busca usuários públicos
    const publicUsers = await db.searchPublicUsers(q, userId);
    
    // Busca amigos para verificar quais já são amigos
    const friends = await db.getFriends(userId);
    const friendIds = new Set(friends.map(f => f._id.toString()));
    
    // Adiciona flag se é amigo ou não
    const users = publicUsers.map(user => ({
      ...user,
      isFriend: friendIds.has(user._id.toString())
    }));

    return res.json(users);
  } catch (err) {
    console.error('Erro ao buscar usuários:', err);
    return res.status(500).json({ message: 'Erro ao buscar usuários' });
  }
});

module.exports = router;
