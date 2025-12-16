const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../auth');
const { ObjectId } = require('mongodb');
const multer = require('multer');
const path = require('path');

function ensureApiAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Não autenticado' });
}

// Configuração do multer para upload de foto de perfil
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Apenas imagens são permitidas'));
  }
});

// Atualizar perfil do usuário
router.put('/profile', ensureApiAuthenticated, upload.single('profilePic'), async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { name, email, bio, isPublic, showEmail, allowFriendRequests, showProducts } = req.body;

    const updates = {};
    if (name !== undefined && name !== null) {
      if (!name.trim()) {
        return res.status(400).json({ message: 'O nome não pode estar vazio' });
      }
      updates.name = name.trim();
    }
    if (email !== undefined && email !== null) {
      if (!email.trim()) {
        return res.status(400).json({ message: 'O e-mail não pode estar vazio' });
      }
      // Verifica se o email já está em uso por outro usuário
      const existing = await auth.findUserByEmail(email.trim());
      if (existing && existing._id.toString() !== userId) {
        return res.status(400).json({ message: 'E-mail já está em uso' });
      }
      updates.email = email.trim();
    }
    if (bio !== undefined) {
      updates.bio = bio ? bio.trim() : '';
    }
    // Trata isPublic que pode vir como string do FormData
    if (isPublic !== undefined) {
      // Se vier como string 'true' ou 'false', converte para boolean
      if (typeof isPublic === 'string') {
        updates.isPublic = isPublic === 'true' || isPublic === '1';
      } else {
        updates.isPublic = Boolean(isPublic);
      }
    }
    if (showEmail !== undefined) updates.showEmail = showEmail;
    if (allowFriendRequests !== undefined) updates.allowFriendRequests = allowFriendRequests;
    if (showProducts !== undefined) updates.showProducts = showProducts;
    
    // Se uma nova foto foi enviada
    if (req.file) {
      updates.profilePic = `/uploads/${req.file.filename}`;
    }

    await db.updateUser(userId, updates);
    
    // Busca o usuário atualizado
    const updatedUser = await db.findUser(userId);
    const safeUser = {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      profile: updatedUser.profile,
      bio: updatedUser.bio,
      profilePic: updatedUser.profilePic,
      isPublic: updatedUser.isPublic,
      showEmail: updatedUser.showEmail,
      allowFriendRequests: updatedUser.allowFriendRequests,
      showProducts: updatedUser.showProducts,
    };

    return res.json({ message: 'Perfil atualizado', user: safeUser });
  } catch (err) {
    console.error('Erro ao atualizar perfil:', err);
    if (err.message === 'Apenas imagens são permitidas') {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Erro ao atualizar perfil' });
  }
});

// Mudar senha
router.put('/profile/password', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Senha atual e nova senha são obrigatórias' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'A nova senha deve ter pelo menos 6 caracteres' });
    }

    // Busca o usuário para verificar a senha atual
    const user = await db.findUser(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Verifica a senha atual usando bcrypt
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Senha atual incorreta' });
    }

    // Atualiza a senha (o db.updateUser já faz o hash)
    await db.updateUser(userId, { password: newPassword });

    return res.json({ message: 'Senha alterada com sucesso' });
  } catch (err) {
    console.error('Erro ao alterar senha:', err);
    return res.status(500).json({ message: 'Erro ao alterar senha' });
  }
});

// Buscar usuário por ID
router.get('/users/:userId', ensureApiAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?._id?.toString() || req.user?._id;
    
    if (!currentUserId) {
      console.error('[DEBUG UserProfile] Usuário não autenticado!');
      return res.status(401).json({ message: 'Não autenticado' });
    }
    
    console.log('[DEBUG UserProfile] Buscando usuário:', userId);
    console.log('[DEBUG UserProfile] Usuário atual:', currentUserId);
    console.log('[DEBUG UserProfile] req.user completo:', {
      _id: req.user?._id,
      name: req.user?.name,
      isAuthenticated: req.isAuthenticated?.()
    });
    
    const user = await db.findUser(userId);
    if (!user) {
      console.log('[DEBUG UserProfile] Usuário não encontrado no banco');
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    console.log('[DEBUG UserProfile] Usuário encontrado:', {
      _id: user._id?.toString(),
      name: user.name,
      profilePic: user.profilePic,
      isPublic: user.isPublic
    });
    
    // Verifica se o usuário é público ou se são amigos
    // Por padrão, se isPublic não estiver definido, considera como público (true)
    // isPublic === false significa privado, qualquer outro valor (true, undefined, null) significa público
    const isPublic = user.isPublic !== false;
    const friends = await db.getFriends(currentUserId);
    
    // Normaliza os IDs para comparação
    const normalizedUserId = userId.toString();
    const normalizedCurrentUserId = currentUserId.toString();
    
    // Normaliza todos os IDs de amigos para comparação
    const friendIds = friends.map(f => {
      const friendId = f._id?.toString() || f._id;
      return friendId.toString();
    });
    
    console.log('[DEBUG UserProfile] Verificando amizade:', {
      currentUserId: normalizedCurrentUserId,
      targetUserId: normalizedUserId,
      friendsCount: friends.length,
      friendIds: friendIds,
      targetUserIdType: typeof normalizedUserId,
      friendIdsTypes: friendIds.map(id => typeof id)
    });
    
    // Compara os IDs de forma mais robusta
    const isFriend = friendIds.includes(normalizedUserId);
    
    if (isFriend) {
      console.log('[DEBUG UserProfile] ✓ Amigo encontrado!', {
        targetUserId: normalizedUserId,
        friendIds: friendIds
      });
    } else {
      console.log('[DEBUG UserProfile] ✗ Não é amigo', {
        targetUserId: normalizedUserId,
        friendIds: friendIds,
        match: friendIds.some(id => id === normalizedUserId)
      });
    }
    
    const isOwnProfile = normalizedCurrentUserId === normalizedUserId;
    
    // Verifica se o usuário atual é admin (profile === 2)
    const currentUser = await db.findUser(currentUserId);
    const isAdmin = currentUser?.profile === 2;
    
    console.log('[DEBUG UserProfile] Verificação de acesso:', {
      isPublic,
      isFriend,
      isOwnProfile,
      isAdmin,
      currentUserProfile: currentUser?.profile,
      canAccess: isPublic || isFriend || isOwnProfile || isAdmin
    });
    
    // Admin pode ver todos os perfis
    // Se não é público e não é amigo e não é o próprio perfil e não é admin, retorna erro
    if (!isPublic && !isFriend && !isOwnProfile && !isAdmin) {
      console.log('[DEBUG UserProfile] Acesso negado - perfil privado');
      return res.status(403).json({ message: 'Este perfil é privado' });
    }
    
    console.log('[DEBUG UserProfile] Acesso permitido');
    
    // Verifica se há solicitação de amizade pendente
    let friendRequestStatus = null;
    let friendRequestId = null;
    if (!isOwnProfile) {
      const sentRequest = await db.findFriendRequest(currentUserId, userId);
      const receivedRequest = await db.findFriendRequest(userId, currentUserId);
      
      if (sentRequest && sentRequest.status === 'pending') {
        friendRequestStatus = 'sent';
        friendRequestId = sentRequest._id?.toString();
      } else if (receivedRequest && receivedRequest.status === 'pending') {
        friendRequestStatus = 'received';
        friendRequestId = receivedRequest._id?.toString();
      }
    }
    
    const safeUser = {
      _id: user._id?.toString() || user._id,
      name: user.name,
      email: isOwnProfile || user.showEmail ? user.email : null,
      bio: user.bio || '',
      profilePic: user.profilePic || null,
      isPublic: user.isPublic !== false,
      isFriend,
      isOwnProfile,
      friendRequestStatus,
      friendRequestId,
    };
    
    console.log('[DEBUG UserProfile] Retornando usuário:', {
      _id: safeUser._id,
      name: safeUser.name,
      profilePic: safeUser.profilePic,
      isFriend: safeUser.isFriend,
      isOwnProfile: safeUser.isOwnProfile
    });
    
    return res.json(safeUser);
  } catch (err) {
    console.error('Erro ao buscar usuário:', err);
    return res.status(500).json({ message: 'Erro ao buscar usuário' });
  }
});

module.exports = router;

