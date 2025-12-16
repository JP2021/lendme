const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../auth');

// Registro via convite
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, inviteCode } = req.body;

    if (!name || !email || !password || !inviteCode) {
      return res.status(400).json({ message: 'Nome, email, senha e código de convite são obrigatórios' });
    }

    // Verifica se email já existe
    const existingEmail = await auth.findUserByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ message: 'E-mail já cadastrado' });
    }

    // Verifica se nome de usuário já existe
    const existingName = await auth.findUserByName(name);
    if (existingName) {
      return res.status(400).json({ message: 'Nome de usuário já está em uso' });
    }

    const invite = await db.findInviteByCode(inviteCode);
    if (!invite) {
      return res.status(404).json({ message: 'Convite não encontrado' });
    }
    if (invite.used) {
      return res.status(400).json({ message: 'Convite já utilizado' });
    }

    const inviterId = invite.fromUserId.toString();

    // Cria usuário com referência ao convidador e perfil público
    const userData = {
      name,
      email,
      password,
      profile: 1, // usuário comum
      invitedBy: inviterId,
      isPublic: true,
      friends: [],
    };

    const result = await db.insertUser(userData);
    const newUserId = result.insertedId.toString();

    // Cria relação de amizade mútua
    await db.addFriendRelation(inviterId, newUserId);

    // Marca convite como usado
    await db.markInviteUsed(inviteCode, newUserId);

    const safeUser = {
      _id: newUserId,
      name,
      email,
      profile: userData.profile,
    };

    return res.status(201).json({ user: safeUser });
  } catch (err) {
    console.error('Erro em /api/register:', err);
    return res.status(500).json({ message: 'Erro ao realizar cadastro' });
  }
});

module.exports = router;


