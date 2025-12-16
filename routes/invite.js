const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');
const sendMail = require('../mail');

// Middleware simples para APIs autenticadas
function ensureApiAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Não autenticado' });
}

// Gerar código de convite (com ou sem e-mail)
router.post('/invite/generate', ensureApiAuthenticated, async (req, res) => {
  try {
    const { email } = req.body;
    const code = crypto.randomBytes(6).toString('hex'); // código curto
    const fromUserId = req.user._id.toString();

    const inviteData = {
      code,
      fromUserId,
    };

    // Se tiver e-mail, adiciona e envia por e-mail
    if (email) {
      inviteData.toEmail = email;
      
      await db.createInvite(inviteData);

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5178';
      const inviteLink = `${frontendUrl}/invite/${code}`;

      await sendMail(
        email,
        'Convite para LendMe',
        `
          Olá!<br/>
          Você recebeu um convite para participar da LendMe, uma rede social de trocas de produtos.<br/><br/>
          Use o código abaixo para se cadastrar (válido para um único uso):<br/>
          <strong>${code}</strong><br/><br/>
          Ou clique no link:<br/>
          <a href="${inviteLink}">${inviteLink}</a><br/><br/>
          Att.<br/>
          Equipe LendMe
        `
      );

      return res.json({ code, inviteLink });
    } else {
      // Sem e-mail, apenas cria o código
      await db.createInvite(inviteData);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5178';
      const inviteLink = `${frontendUrl}/invite/${code}`;
      
      return res.json({ code, inviteLink });
    }
  } catch (err) {
    console.error('Erro ao gerar convite:', err);
    return res.status(500).json({ message: 'Erro ao gerar convite' });
  }
});

// Verificar código de convite
router.get('/invite/verify/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const invite = await db.findInviteByCode(code);

    if (!invite) {
      return res.status(404).json({ valid: false, message: 'Convite não encontrado' });
    }

    if (invite.used) {
      return res.status(400).json({ valid: false, message: 'Convite já utilizado' });
    }

    return res.json({
      valid: true,
      invite: {
        code: invite.code,
        fromUserId: invite.fromUserId,
        toEmail: invite.toEmail,
        createdAt: invite.createdAt,
      },
    });
  } catch (err) {
    console.error('Erro ao verificar convite:', err);
    return res.status(500).json({ message: 'Erro ao verificar convite' });
  }
});

// Listar convites do usuário autenticado
router.get('/invite/my-invites', ensureApiAuthenticated, async (req, res) => {
  try {
    const fromUserId = req.user._id.toString();
    const invites = await db.findInvitesByUser(fromUserId);

    return res.json(invites);
  } catch (err) {
    console.error('Erro ao listar convites:', err);
    return res.status(500).json({ message: 'Erro ao listar convites' });
  }
});

module.exports = router;



