const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db');
const { ObjectId } = require('mongodb');
const fs = require('fs');

function ensureApiAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Não autenticado' });
}

// Configuração do multer para upload de mídia (imagens e vídeos)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const prefix = file.mimetype.startsWith('video/') ? 'video-' : 'post-';
    cb(null, prefix + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 100 * 1024 * 1024 // 100MB para vídeos
  },
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
    const allowedVideoTypes = /mp4|webm|ogg|mov/;
    const extname = path.extname(file.originalname).toLowerCase().replace('.', '');
    const isImage = file.mimetype.startsWith('image/') && allowedImageTypes.test(extname);
    const isVideo = file.mimetype.startsWith('video/') && allowedVideoTypes.test(extname);
    
    if (isImage || isVideo) {
      return cb(null, true);
    }
    cb(new Error('Apenas imagens e vídeos são permitidos'));
  }
});

// A validação de duração do vídeo é feita no frontend antes do upload

// Criar post
router.post('/posts', ensureApiAuthenticated, upload.single('media'), async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { caption, type } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Arquivo de mídia é obrigatório' });
    }

    const fileType = type || (req.file.mimetype.startsWith('video/') ? 'video' : 'image');
    
    // A validação de duração do vídeo é feita no frontend antes do upload
    // Aqui apenas aceitamos o arquivo se passou pela validação

    // Calcula data de expiração (30 dias)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const post = await db.createPost({
      userId,
      mediaUrl: `/uploads/${req.file.filename}`,
      mediaType: fileType,
      caption: caption || '',
      expiresAt,
    });

    return res.json({ message: 'Post criado com sucesso', post });
  } catch (err) {
    // Remove arquivo em caso de erro
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Erro ao criar post:', err);
    return res.status(500).json({ message: 'Erro ao criar post' });
  }
});

// Listar posts (feed)
router.get('/posts', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    
    // Busca posts de amigos e do próprio usuário
    const friends = await db.getFriends(userId);
    const friendIds = friends.map(f => {
      const fid = f._id;
      return fid?.toString ? fid.toString() : fid;
    });
    
    // Inclui o próprio usuário
    friendIds.push(userId);
    
    // Busca posts não expirados
    const posts = await db.getPosts(friendIds);
    
    // Filtra posts expirados e remove do banco
    const now = new Date();
    const validPosts = [];
    
    for (const post of posts) {
      if (post.expiresAt && new Date(post.expiresAt) < now) {
        // Post expirado - remove do banco e arquivo
        await db.deletePost(post._id);
        if (post.mediaUrl && fs.existsSync(path.join(__dirname, '..', post.mediaUrl))) {
          fs.unlinkSync(path.join(__dirname, '..', post.mediaUrl));
        }
      } else {
        validPosts.push(post);
      }
    }
    
    // Aplica a mesma lógica de randomização do feed de produtos
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Separa posts novos (últimas 24h) dos mais antigos
    const newPosts = [];
    const oldPosts = [];
    
    validPosts.forEach(post => {
      const postDate = new Date(post.createdAt || 0);
      if (postDate >= oneDayAgo) {
        newPosts.push(post);
      } else {
        oldPosts.push(post);
      }
    });
    
    // Função auxiliar para randomizar array usando Fisher-Yates shuffle
    const shuffleArray = (arr) => {
      if (arr.length <= 1) return arr;
      const shuffled = [...arr];
      
      // Primeiro shuffle - Fisher-Yates (de trás para frente)
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      // Segundo shuffle para garantir melhor distribuição
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      // Terceiro shuffle usando uma abordagem diferente (de frente para trás)
      for (let i = 0; i < shuffled.length - 1; i++) {
        const j = Math.floor(Math.random() * (shuffled.length - i)) + i;
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      return shuffled;
    };
    
    let feedPosts = [];
    
    // Se há posts novos E antigos: novos primeiro (ordenados por data), depois antigos (randomizados)
    if (newPosts.length > 0 && oldPosts.length > 0) {
      // Ordena posts novos por data (mais recente primeiro)
      newPosts.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      
      // Randomiza posts antigos
      const shuffledOldPosts = shuffleArray(oldPosts);
      
      feedPosts = [...newPosts, ...shuffledOldPosts];
    }
    // Se TODOS são novos: randomiza todos (mas mantém prioridade para os mais recentes)
    else if (newPosts.length > 0 && oldPosts.length === 0) {
      // Ordena primeiro por data para dar prioridade aos mais recentes
      newPosts.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      
      // Se há mais de 1 post, randomiza mantendo uma tendência de prioridade para os mais recentes
      if (newPosts.length > 1) {
        // Pega os 3 mais recentes e randomiza o resto
        const topRecent = newPosts.slice(0, Math.min(3, newPosts.length));
        const rest = newPosts.slice(Math.min(3, newPosts.length));
        
        // Randomiza o resto
        const shuffledRest = shuffleArray(rest);
        
        // Combina: top recentes primeiro, depois o resto randomizado
        feedPosts = [...topRecent, ...shuffledRest];
        
        // Randomiza a ordem final também para garantir variação
        feedPosts = shuffleArray(feedPosts);
      } else {
        feedPosts = newPosts;
      }
    }
    // Se TODOS são antigos: randomiza todos
    else if (oldPosts.length > 0 && newPosts.length === 0) {
      feedPosts = shuffleArray(oldPosts);
    }
    // Caso vazio
    else {
      feedPosts = [];
    }
    
    // Adiciona headers para evitar cache
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    return res.json(feedPosts);
  } catch (err) {
    console.error('Erro ao listar posts:', err);
    return res.status(500).json({ message: 'Erro ao listar posts' });
  }
});

// Marcar post como visto
router.post('/posts/:postId/view', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { postId } = req.params;
    
    await db.markPostAsSeen(postId, userId);
    
    return res.json({ message: 'Post marcado como visto' });
  } catch (err) {
    console.error('Erro ao marcar post como visto:', err);
    return res.status(500).json({ message: 'Erro ao marcar post como visto' });
  }
});

// Deletar post
router.delete('/posts/:postId', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { postId } = req.params;
    
    const post = await db.getPost(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post não encontrado' });
    }
    
    if (post.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Você não tem permissão para deletar este post' });
    }
    
    // Remove arquivo
    if (post.mediaUrl && fs.existsSync(path.join(__dirname, '..', post.mediaUrl))) {
      fs.unlinkSync(path.join(__dirname, '..', post.mediaUrl));
    }
    
    await db.deletePost(postId);
    
    return res.json({ message: 'Post deletado com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar post:', err);
    return res.status(500).json({ message: 'Erro ao deletar post' });
  }
});

// Curtir/descurtir post
router.post('/posts/:postId/like', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { postId } = req.params;
    
    const result = await db.togglePostLike(postId, userId);
    if (!result) {
      return res.status(404).json({ message: 'Post não encontrado' });
    }
    
    return res.json(result);
  } catch (err) {
    console.error('Erro ao curtir post:', err);
    return res.status(500).json({ message: 'Erro ao curtir post' });
  }
});

// Criar comentário em post
router.post('/posts/:postId/comments', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { postId } = req.params;
    const { text } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Texto do comentário é obrigatório' });
    }
    
    const post = await db.getPost(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post não encontrado' });
    }
    
    const comment = await db.createPostComment({
      postId,
      userId,
      text: text.trim(),
    });
    
    return res.json(comment);
  } catch (err) {
    console.error('Erro ao criar comentário:', err);
    return res.status(500).json({ message: 'Erro ao criar comentário' });
  }
});

// Listar comentários de um post
router.get('/posts/:postId/comments', ensureApiAuthenticated, async (req, res) => {
  try {
    const { postId } = req.params;
    
    const post = await db.getPost(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post não encontrado' });
    }
    
    const comments = await db.getPostComments(postId);
    
    return res.json(comments);
  } catch (err) {
    console.error('Erro ao listar comentários:', err);
    return res.status(500).json({ message: 'Erro ao listar comentários' });
  }
});

module.exports = router;

