const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../auth');
const { ObjectId } = require('mongodb');

function ensureApiAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Não autenticado' });
}

// Atualizar perfil do usuário
router.put('/profile', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { name, email, bio, isPublic, showEmail, allowFriendRequests, showProducts } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (email) {
      // Verifica se o email já está em uso por outro usuário
      const existing = await auth.findUserByEmail(email);
      if (existing && existing._id.toString() !== userId) {
        return res.status(400).json({ message: 'E-mail já está em uso' });
      }
      updates.email = email;
    }
    if (bio !== undefined) updates.bio = bio;
    if (isPublic !== undefined) updates.isPublic = isPublic;
    if (showEmail !== undefined) updates.showEmail = showEmail;
    if (allowFriendRequests !== undefined) updates.allowFriendRequests = allowFriendRequests;
    if (showProducts !== undefined) updates.showProducts = showProducts;

    await db.updateUser(userId, updates);
    
    // Busca o usuário atualizado
    const updatedUser = await db.findUser(userId);
    const safeUser = {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      profile: updatedUser.profile,
      bio: updatedUser.bio,
      isPublic: updatedUser.isPublic,
      showEmail: updatedUser.showEmail,
      allowFriendRequests: updatedUser.allowFriendRequests,
      showProducts: updatedUser.showProducts,
    };

    return res.json({ message: 'Perfil atualizado', user: safeUser });
  } catch (err) {
    console.error('Erro ao atualizar perfil:', err);
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

module.exports = router;

