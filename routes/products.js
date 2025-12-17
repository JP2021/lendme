const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db');
const { ObjectId } = require('mongodb');

function ensureApiAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Não autenticado' });
}

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
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

// Criar produto
router.post('/products', ensureApiAuthenticated, upload.array('images', 5), async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { name, description, category, condition, type } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Nome do produto é obrigatório' });
    }

    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    const productResult = await db.createProduct({
      userId,
      name,
      description: description || '',
      category: category || 'Outros',
      condition: condition || 'good',
      type: type || 'trade', // 'trade', 'donation', 'loan'
      images,
    });

    // Busca o produto criado com informações do usuário
    const createdProduct = await db.getProduct(productResult.insertedId.toString());

    return res.json({ message: 'Produto criado', product: createdProduct });
  } catch (err) {
    console.error('Erro ao criar produto:', err);
    return res.status(500).json({ message: 'Erro ao criar produto' });
  }
});

// Listar produtos (feed)
router.get('/products', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { category, search, limit } = req.query;

    const filters = {};
    if (category) filters.category = category;
    if (search) filters.search = search;
    if (limit) filters.limit = parseInt(limit);

    // Busca produtos de amigos
    const friends = await db.getFriends(userId);
    const friendIds = friends.map(f => {
      const fid = f._id;
      return fid?.toString ? fid.toString() : fid;
    });
    
    // Busca todos os produtos disponíveis
    const allProducts = await db.getProducts(null, filters);
    console.log(`[Feed] Total de produtos no banco: ${allProducts.length}`);
    
    // Busca trocas aceitas para excluir produtos envolvidos (mas não os trocados)
    const allTrades = await db.getTrades(userId);
    const acceptedTrades = allTrades.filter(t => t.status === 'accepted');
    const productIdsInAcceptedTrades = new Set();
    acceptedTrades.forEach(t => {
      if (t.fromProductId) productIdsInAcceptedTrades.add(t.fromProductId.toString());
      if (t.toProductId) productIdsInAcceptedTrades.add(t.toProductId.toString());
    });
    console.log(`[Feed] Produtos em trocas aceitas: ${productIdsInAcceptedTrades.size}`);
    
    // Filtra produtos: próprios produtos, produtos de amigos ou usuários públicos
    // Por padrão, mostra TODOS os produtos públicos para permitir interação
    // EXCETO produtos que estão em trocas aceitas (status: available apenas)
    // INCLUI produtos trocados (status: traded) para mostrar histórico
    const userIdStr = userId.toString();
    
    const visibleProducts = allProducts.filter(p => {
      if (!p || !p.userId) {
        console.log('[Feed] Produto sem userId:', p?._id);
        return false;
      }
      
      const productUserId = p.userId?.toString ? p.userId.toString() : String(p.userId);
      const productId = p._id?.toString ? p._id.toString() : String(p._id);
      
      // INCLUI produtos trocados, doados, doação aceita ou emprestados (devem aparecer no feed com status especial)
      if (p.status === 'traded' || p.status === 'donated' || p.status === 'donation_accepted' || p.status === 'loan_accepted' || p.status === 'loaned') {
        return true;
      }
      
      // Exclui produtos que estão em trocas aceitas (mas não os trocados)
      if (productIdsInAcceptedTrades.has(productId) && p.status === 'available') {
        return false;
      }
      
      // Inclui produtos do próprio usuário (mesmo que estejam em trocas aceitas, para ver histórico)
      if (productUserId === userIdStr) {
        return true;
      }
      
      // Inclui produtos de amigos
      const isFriend = friendIds.some(fidStr => {
        const fidStrNormalized = typeof fidStr === 'string' ? fidStr : (fidStr?.toString ? fidStr.toString() : String(fidStr));
        return fidStrNormalized === productUserId;
      });
      if (isFriend) {
        return true;
      }
      
      // Inclui produtos de usuários públicos
      // Por padrão, assume que usuários são públicos (compatibilidade)
      // Isso permite que novos usuários vejam produtos e possam interagir
      const productUser = p.user;
      if (productUser) {
        // Se isPublic é true ou não está definido, mostra o produto
        if (productUser.isPublic !== false) {
          return true;
        }
      } else {
        // Se não conseguiu buscar o usuário, assume público para não bloquear
        // Isso garante que produtos apareçam mesmo se houver problema na busca do usuário
        console.log(`[Feed] Produto ${p._id} sem user, assumindo público`);
        return true;
      }
      
      return false;
    });

    // Busca pedidos de empréstimo para incluir no feed (todos os pedidos pendentes sem lenderId)
    const loanRequests = await db.getLoanRequests(userId, 'feed');
    const loanFeedItems = loanRequests.map(loan => ({
      _id: loan._id,
      type: 'loan_request',
      name: `${loan.requester?.name || 'Usuário'} precisa de ${loan.itemName || 'um item'}`,
      description: `Pedido de empréstimo`,
      userId: loan.requesterId,
      user: loan.requester,
      status: 'pending',
      createdAt: loan.createdAt,
      loan: loan,
    }));

    // Combina produtos e pedidos de empréstimo
    const allFeedItems = [...visibleProducts, ...loanFeedItems];
    
    // Define o limite de tempo para considerar um post como "novo" (24 horas)
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    console.log(`[Feed] Data atual: ${now.toISOString()}, 24h atrás: ${oneDayAgo.toISOString()}`);
    
    // Separa posts novos (últimas 24h) dos mais antigos
    const newPosts = [];
    const oldPosts = [];
    
    allFeedItems.forEach(item => {
      const itemDate = new Date(item.createdAt || 0);
      if (itemDate >= oneDayAgo) {
        newPosts.push(item);
      } else {
        oldPosts.push(item);
      }
    });
    
    console.log(`[Feed] Separação: ${newPosts.length} novos, ${oldPosts.length} antigos`);
    
    // Função auxiliar para randomizar array usando Fisher-Yates shuffle
    const shuffleArray = (arr) => {
      if (arr.length <= 1) return arr;
      const shuffled = [...arr]; // Cria cópia para não modificar o original
      
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
    
    let feedItems = [];
    
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
      console.log(`[Feed] Randomizando ${oldPosts.length} posts antigos...`);
      
      feedItems = [...newPosts, ...shuffledOldPosts];
    }
    // Se TODOS são novos: randomiza todos (mas mantém prioridade para os mais recentes)
    else if (newPosts.length > 0 && oldPosts.length === 0) {
      console.log(`[Feed] Todos os posts são novos (${newPosts.length}). Randomizando todos...`);
      
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
        feedItems = [...topRecent, ...shuffledRest];
        
        // Randomiza a ordem final também para garantir variação
        feedItems = shuffleArray(feedItems);
      } else {
        feedItems = newPosts;
      }
    }
    // Se TODOS são antigos: randomiza todos
    else if (oldPosts.length > 0 && newPosts.length === 0) {
      console.log(`[Feed] Todos os posts são antigos (${oldPosts.length}). Randomizando todos...`);
      feedItems = shuffleArray(oldPosts);
    }
    // Caso vazio
    else {
      feedItems = [];
    }
    
    console.log(`[Feed] Ordem final: ${newPosts.length} novos + ${oldPosts.length} antigos (randomizados)`);
    if (oldPosts.length > 0) {
      const firstThreeIds = oldPosts.slice(0, 3).map(p => p._id || p.name || 'sem-id');
      console.log(`[Feed] Primeiros 3 posts antigos (após randomização):`, firstThreeIds);
    }

    console.log(`[Feed] Produtos visíveis: ${visibleProducts.length} de ${allProducts.length} para usuário ${userIdStr}`);
    console.log(`[Feed] Pedidos de empréstimo: ${loanFeedItems.length}`);
    console.log(`[Feed] Amigos: ${friendIds.length}`);
    console.log(`[Feed] Posts novos (últimas 24h): ${newPosts.length}, Posts antigos (randomizados): ${oldPosts.length}`);
    
    // Adiciona headers para evitar cache
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    return res.json(feedItems);
  } catch (err) {
    console.error('Erro ao listar produtos:', err);
    return res.status(500).json({ message: 'Erro ao listar produtos' });
  }
});

// Listar produtos do usuário
router.get('/products/my', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    // getProducts busca produtos onde userId = userId do usuário
    // Quando uma troca é concluída, os produtos trocam de dono:
    // - O produto que o usuário DEU não aparece mais (userId mudou)
    // - O produto que o usuário RECEBEU aparece (userId agora é dele)
    const products = await db.getProducts(userId);
    console.log(`[My Products] Usuário ${userId} tem ${products.length} produtos`);
    products.forEach(p => {
      console.log(`[My Products] - ${p.name} (${p._id}), status: ${p.status}, userId: ${p.userId}`);
    });
    return res.json(products);
  } catch (err) {
    console.error('Erro ao listar produtos:', err);
    return res.status(500).json({ message: 'Erro ao listar produtos' });
  }
});

// Listar produtos de um usuário específico (apenas disponíveis)
router.get('/users/:userId/products', ensureApiAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id.toString();
    
    // Verifica se o usuário existe e se o perfil é acessível
    const user = await db.findUser(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
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
    
    console.log('[DEBUG getUserProducts] Verificando amizade:', {
      currentUserId: normalizedCurrentUserId,
      targetUserId: normalizedUserId,
      friendsCount: friends.length,
      friendIds: friendIds
    });
    
    // Compara os IDs de forma mais robusta
    const isFriend = friendIds.includes(normalizedUserId);
    
    if (isFriend) {
      console.log('[DEBUG getUserProducts] ✓ Amigo encontrado!');
    } else {
      console.log('[DEBUG getUserProducts] ✗ Não é amigo');
    }
    
    const isOwnProfile = normalizedCurrentUserId === normalizedUserId;
    
    // Verifica se o usuário atual é admin (profile === 2)
    const currentUser = await db.findUser(currentUserId);
    const isAdmin = currentUser?.profile === 2;
    
    console.log('[DEBUG getUserProducts] Verificação de acesso:', {
      isPublic,
      isFriend,
      isOwnProfile,
      isAdmin,
      currentUserProfile: currentUser?.profile,
      canAccess: isPublic || isFriend || isOwnProfile || isAdmin
    });
    
    // Admin pode ver todos os produtos
    // Se não é público e não é amigo e não é o próprio perfil e não é admin, retorna erro
    if (!isPublic && !isFriend && !isOwnProfile && !isAdmin) {
      console.log('[DEBUG getUserProducts] Acesso negado - perfil privado');
      return res.status(403).json({ message: 'Este perfil é privado' });
    }
    
    console.log('[DEBUG getUserProducts] Acesso permitido');
    
    // Busca apenas produtos disponíveis do usuário
    const products = await db.getProducts(userId);
    console.log('[DEBUG getUserProducts] Produtos retornados:', products?.length || 0, 'tipo:', Array.isArray(products) ? 'array' : typeof products);
    
    // Garante que products seja um array
    const productsArray = Array.isArray(products) ? products : [];
    const availableProducts = productsArray.filter(p => p.status === 'available');
    
    console.log('[DEBUG getUserProducts] Produtos disponíveis:', availableProducts.length);
    
    return res.json(availableProducts);
  } catch (err) {
    console.error('Erro ao listar produtos do usuário:', err);
    return res.status(500).json({ message: 'Erro ao listar produtos' });
  }
});

// Buscar produto específico
router.get('/products/:productId', ensureApiAuthenticated, async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await db.getProduct(productId);
    
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    return res.json(product);
  } catch (err) {
    console.error('Erro ao buscar produto:', err);
    return res.status(500).json({ message: 'Erro ao buscar produto' });
  }
});

// Curtir / descurtir produto
router.post('/products/:productId/like', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { productId } = req.params;

    const product = await db.toggleProductLike(productId, userId);
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    return res.json({
      message: product.liked ? 'Produto curtido' : 'Curtida removida',
      liked: product.liked,
      likesCount: product.likesCount || (product.likes ? product.likes.length : 0),
      product,
    });
  } catch (err) {
    console.error('Erro ao curtir produto:', err);
    return res.status(500).json({ message: 'Erro ao curtir produto' });
  }
});

// Listar comentários do produto
router.get('/products/:productId/comments', ensureApiAuthenticated, async (req, res) => {
  try {
    const { productId } = req.params;
    const comments = await db.getProductComments(productId);
    return res.json(comments);
  } catch (err) {
    console.error('Erro ao listar comentários do produto:', err);
    return res.status(500).json({ message: 'Erro ao listar comentários do produto' });
  }
});

// Criar comentário no produto
router.post('/products/:productId/comments', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { productId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comentário não pode ser vazio' });
    }

    const comment = await db.createProductComment({
      productId,
      userId,
      text: text.trim(),
    });

    return res.status(201).json({ message: 'Comentário criado', comment });
  } catch (err) {
    console.error('Erro ao criar comentário do produto:', err);
    return res.status(500).json({ message: 'Erro ao criar comentário do produto' });
  }
});

// Atualizar produto
router.put('/products/:productId', ensureApiAuthenticated, upload.array('images', 5), async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { productId } = req.params;
    const { name, description, category, condition, existingImages, type } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (category) updates.category = category;
    if (condition) updates.condition = condition;
    if (type) updates.type = type;

    // Gerencia imagens: preserva existentes e adiciona novas
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      // Se há imagens existentes no body, preserva elas e adiciona novas
      if (existingImages) {
        try {
          const parsed = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
          updates.images = Array.isArray(parsed) ? [...parsed, ...newImages] : newImages;
        } catch {
          updates.images = newImages;
        }
      } else {
        updates.images = newImages;
      }
    } else if (existingImages) {
      // Se não há novas imagens mas há existentes, preserva as existentes
      try {
        const parsed = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
        if (Array.isArray(parsed) && parsed.length > 0) {
          updates.images = parsed;
        }
      } catch {
        // Ignora se não conseguir parsear
      }
    }

    await db.updateProduct(productId, userId, updates);
    const product = await db.getProduct(productId);
    
    return res.json({ message: 'Produto atualizado', product });
  } catch (err) {
    console.error('Erro ao atualizar produto:', err);
    return res.status(500).json({ message: 'Erro ao atualizar produto' });
  }
});

// Deletar produto
router.delete('/products/:productId', ensureApiAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { productId } = req.params;

    await db.deleteProduct(productId, userId);
    return res.json({ message: 'Produto deletado' });
  } catch (err) {
    console.error('Erro ao deletar produto:', err);
    return res.status(500).json({ message: 'Erro ao deletar produto' });
  }
});

module.exports = router;


