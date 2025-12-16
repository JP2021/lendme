const { ObjectId, MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");

const PAGE_SIZE = 20;

let connection = null;

async function connect() {
    if (connection) return connection;

    const client = new MongoClient(process.env.MONGODB_CONNECTION);

    try {
        await client.connect();
        connection = client.db(process.env.MONGODB_DATABASE);
        console.log("Connected to MongoDB!");
    } catch (err) {
        console.error("Error connecting to MongoDB:", err);
        connection = null;
    }

    return connection;
}

// Funções relacionadas aos clientes (customers)

async function countCustomers() {
    const conn = await connect();
    return conn.collection("customers").countDocuments();
}

async function findCustomers(page = 1) {
    const totalSkip = (page - 1) * PAGE_SIZE;
    const conn = await connect();
    return conn
        .collection("customers")
        .find({})
        .skip(totalSkip)
        .limit(PAGE_SIZE)
        .toArray();
}

async function findCustomer(id) {
    const objectId = ObjectId.createFromHexString(id);
    const conn = await connect();
    return conn.collection("customers").findOne({ _id: objectId });
}

async function insertCustomer(customer) {
    const conn = await connect();
    return conn.collection("customers").insertOne(customer);
}

async function updateCustomer(id, customer) {
    const objectId = ObjectId.createFromHexString(id);
    const conn = await connect();
    return conn.collection("customers").updateOne({ _id: objectId }, { $set: customer });
}

async function deleteCustomer(id) {
    const objectId = ObjectId.createFromHexString(id);
    const conn = await connect();
    return conn.collection("customers").deleteOne({ _id: objectId });
}

async function searchCustomersByName(name) {
    const conn = await connect();
    return conn
        .collection("customers")
        .find({ name: new RegExp(name, 'i') })
        .toArray();
}

// Funções relacionadas aos pedidos (os)

async function countOs() {
    const conn = await connect();
    return conn.collection("os").countDocuments();
}

async function findOss(page = 1) {
    const totalSkip = (page - 1) * PAGE_SIZE;
    const conn = await connect();
    return conn
        .collection("os")
        .find({})
        .skip(totalSkip)
        .limit(PAGE_SIZE)
        .toArray();
}

async function findOs(id) {
    const objectId = ObjectId.createFromHexString(id);
    const conn = await connect();
    return conn.collection("os").findOne({ _id: objectId });
}

async function insertOs(os) {
    const conn = await connect();
    return conn.collection("os").insertOne(os);
}

async function updateOs(id, os) {
    const objectId = ObjectId.createFromHexString(id);
    const conn = await connect();
    return conn.collection("os").updateOne({ _id: objectId }, { $set: os });
}

async function deleteOs(id) {
    const objectId = ObjectId.createFromHexString(id);
    const conn = await connect();
    return conn.collection("os").deleteOne({ _id: objectId });
}
async function searchOSByName(name) {
    const conn = await connect();
    return conn
        .collection("os")
        .find({ name: new RegExp(name, 'i') })
        .toArray();
}
// Funções relacionadas aos usuários (users)

async function countUsers() {
    const conn = await connect();
    return conn.collection("users").countDocuments();
}

async function findUsers(page = 1) {
    const totalSkip = (page - 1) * PAGE_SIZE;
    const conn = await connect();
    return conn
        .collection("users")
        .find({})
        .skip(totalSkip)
        .limit(PAGE_SIZE)
        .toArray();
}

async function findUser(id) {
    const objectId = ObjectId.createFromHexString(id);
    const conn = await connect();
    return conn.collection("users").findOne({ _id: objectId });
}

async function insertUser(user) {
    user.password = bcrypt.hashSync(user.password, 12);
    const conn = await connect();
    return conn.collection("users").insertOne(user);
}

async function updateUser(id, user) {
    if (user.password)
        user.password = bcrypt.hashSync(user.password, 12);

    const objectId = ObjectId.createFromHexString(id);
    const conn = await connect();
    return conn.collection("users").updateOne({ _id: objectId }, { $set: user });
}

async function deleteUser(id) {
    const objectId = ObjectId.createFromHexString(id);
    const conn = await connect();
    return conn.collection("users").deleteOne({ _id: objectId });
}

// Exemplo de funções no db

async function insertAutoText(autoText) {
    const connection = await connect();
    return connection.collection("autotexts").insertOne(autoText);
  }
  
  async function updateAutoText(id, autoText, userId) {
    const connection = await connect();
    return connection.collection("autotexts").updateOne(
      { _id: new ObjectId(id), userId: userId },
      { $set: autoText }
    );
  }
  
  async function deleteAutoText(id, userId) {
    const connection = await connect();
    return connection.collection("autotexts").deleteOne({ _id: new ObjectId(id), userId: userId });
  }
  async function findAutoTextsByUserId(userId) {
    const connection = await connect();
    return connection.collection("autotexts").find({ userId: userId }).toArray();
}

async function findAutoTextById(id, userId) {
    try {
        console.log(`Buscando auto texto pelo ID: ${id}, userId: ${userId}`); // Log para depuração

        // Valida se o ID é uma string válida de 24 caracteres hexadecimais
        if (!id || typeof id !== 'string' || id.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(id)) {
            throw new Error('ID inválido');
        }

        // Conecta ao banco de dados
        const connection = await connect();

        // Converte o ID para ObjectId
        const objectId = new ObjectId(id);

        // Busca o auto texto pelo ID e pelo ID do usuário
        const autoText = await connection.collection('autotexts').findOne({
            _id: objectId,
            userId: userId
        });

        console.log('Auto texto encontrado:', autoText); // Log para depuração
        return autoText;
    } catch (error) {
        console.error('Erro na função findAutoTextById:', error); // Log para depuração
        throw error;
    }
}

async function findAutoTextByName(name, userId) {
    try {
        const db = await connect(); // Conecta ao banco de dados
        const autoText = await db.collection('autotexts').findOne({
            name: { $regex: new RegExp(`^${name}$`, 'i') }, // Busca insensível a maiúsculas/minúsculas
            userId: userId // Garante que o auto texto pertence ao usuário
        });
        return autoText;
    } catch (error) {
        console.error('Erro na função findAutoTextByName:', error);
        throw error;
    }
}

// ======= Funções relacionadas a convites (invites) =======

async function createInvite(invite) {
    const conn = await connect();
    return conn.collection("invites").insertOne({
        ...invite,
        createdAt: new Date(),
        used: false,
    });
}

async function findInviteByCode(code) {
    const conn = await connect();
    return conn.collection("invites").findOne({ code });
}

async function markInviteUsed(code, usedByUserId) {
    const conn = await connect();
    return conn.collection("invites").updateOne(
        { code },
        { $set: { used: true, usedAt: new Date(), usedByUserId } }
    );
}

async function findInvitesByUser(fromUserId) {
    const conn = await connect();
    return conn
        .collection("invites")
        .find({ fromUserId })
        .sort({ createdAt: -1 })
        .toArray();
}

// ======= Funções relacionadas a amigos (friends) =======

async function addFriendRelation(userId1, userId2) {
    const conn = await connect();
    const users = conn.collection("users");

    const id1 = ObjectId.createFromHexString(userId1.toString());
    const id2 = ObjectId.createFromHexString(userId2.toString());

    console.log('[DEBUG addFriendRelation] Adicionando amizade:', {
        userId1: userId1.toString(),
        userId2: userId2.toString(),
        id1: id1.toString(),
        id2: id2.toString()
    });

    // Adiciona id2 ao array de amigos de id1
    const result1 = await users.updateOne(
        { _id: id1 },
        { $addToSet: { friends: id2 } }
    );
    console.log('[DEBUG addFriendRelation] Resultado update1:', {
        matched: result1.matchedCount,
        modified: result1.modifiedCount
    });

    // Adiciona id1 ao array de amigos de id2
    const result2 = await users.updateOne(
        { _id: id2 },
        { $addToSet: { friends: id1 } }
    );
    console.log('[DEBUG addFriendRelation] Resultado update2:', {
        matched: result2.matchedCount,
        modified: result2.modifiedCount
    });

    // Verifica se foi adicionado corretamente
    const user1 = await users.findOne({ _id: id1 });
    const user2 = await users.findOne({ _id: id2 });
    
    console.log('[DEBUG addFriendRelation] Verificação final:', {
        user1Friends: user1?.friends?.length || 0,
        user2Friends: user2?.friends?.length || 0,
        user1HasId2: user1?.friends?.some(f => f.toString() === id2.toString()),
        user2HasId1: user2?.friends?.some(f => f.toString() === id1.toString())
    });
}

async function getFriends(userId) {
    const conn = await connect();
    const id = ObjectId.createFromHexString(userId.toString());
    const user = await conn.collection("users").findOne({ _id: id });
    
    if (!user) {
        console.log(`[DEBUG getFriends] Usuário não encontrado: ${userId}`);
        return [];
    }
    
    if (!user.friends || user.friends.length === 0) {
        console.log(`[DEBUG getFriends] Usuário ${userId} não tem amigos no array friends`);
        return [];
    }
    
    console.log(`[DEBUG getFriends] Usuário ${userId} tem ${user.friends.length} amigos no array`);
    
    // Converte os IDs do array friends para ObjectId se necessário
    const friendIds = user.friends.map(friendId => {
        if (friendId instanceof ObjectId) {
            return friendId;
        }
        return ObjectId.createFromHexString(friendId.toString());
    });
    
    const friends = await conn
        .collection("users")
        .find({ _id: { $in: friendIds } })
        .project({ password: 0 })
        .toArray();
    
    console.log(`[DEBUG getFriends] Encontrados ${friends.length} amigos no banco`);
    
    // Normaliza os IDs para string e garante que todos os campos necessários estejam presentes
    const normalizedFriends = friends.map(friend => {
        const normalizedId = friend._id?.toString() || friend._id;
        console.log(`[DEBUG getFriends] Normalizando amigo:`, {
            originalId: friend._id,
            normalizedId: normalizedId,
            name: friend.name
        });
        return {
            ...friend,
            _id: normalizedId
        };
    });
    
    console.log(`[DEBUG getFriends] IDs normalizados:`, normalizedFriends.map(f => f._id));
    
    return normalizedFriends;
}

// ======= Funções relacionadas a solicitações de amizade (friendRequests) =======

async function createFriendRequest(fromUserId, toUserId) {
    const conn = await connect();
    return conn.collection("friendRequests").insertOne({
        fromUserId: ObjectId.createFromHexString(fromUserId.toString()),
        toUserId: ObjectId.createFromHexString(toUserId.toString()),
        status: 'pending',
        createdAt: new Date(),
    });
}

async function findFriendRequest(fromUserId, toUserId) {
    const conn = await connect();
    return conn.collection("friendRequests").findOne({
        $or: [
            { fromUserId: ObjectId.createFromHexString(fromUserId.toString()), toUserId: ObjectId.createFromHexString(toUserId.toString()) },
            { fromUserId: ObjectId.createFromHexString(toUserId.toString()), toUserId: ObjectId.createFromHexString(fromUserId.toString()) }
        ]
    });
}

async function getFriendRequests(userId, type = 'received') {
    const conn = await connect();
    const id = ObjectId.createFromHexString(userId.toString());
    
    // Query correta: para 'received', busca onde toUserId é o usuário atual
    // Para 'sent', busca onde fromUserId é o usuário atual
    const query = type === 'received' 
        ? { toUserId: id, status: 'pending' }
        : { fromUserId: id, status: 'pending' };
    
    console.log(`[DEBUG DB] getFriendRequests - userId: ${userId}, type: ${type}, query:`, JSON.stringify(query));
    
    const requests = await conn.collection("friendRequests")
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();
    
    console.log(`[DEBUG DB] Encontradas ${requests.length} solicitações`);
    
    // Popula informações dos usuários
    // Para 'received': mostra quem enviou (fromUserId)
    // Para 'sent': mostra quem recebeu (toUserId)
    const userIds = requests.map(r => {
        if (type === 'received') {
            // Solicitações recebidas: queremos o usuário que enviou (fromUserId)
            return r.fromUserId;
        } else {
            // Solicitações enviadas: queremos o usuário que recebeu (toUserId)
            return r.toUserId;
        }
    });
    
    // Remove duplicatas e nulls
    const uniqueUserIds = [...new Set(userIds.filter(id => id))];
    
    const users = uniqueUserIds.length > 0 
        ? await conn.collection("users")
            .find({ _id: { $in: uniqueUserIds } })
            .project({ password: 0 })
            .toArray()
        : [];
    
    const userMap = new Map(users.map(u => [u._id.toString(), u]));
    
    const result = requests.map(req => {
        const user = type === 'received' 
            ? userMap.get(req.fromUserId?.toString()) 
            : userMap.get(req.toUserId?.toString());
        
        const reqResult = {
            ...req,
            fromUserId: req.fromUserId?.toString(),
            toUserId: req.toUserId?.toString(),
            fromUser: type === 'sent' ? user : undefined,
            toUser: type === 'received' ? user : undefined,
            user: user // Mantém compatibilidade com código existente
        };
        
        console.log(`[DEBUG DB] Solicitação processada:`, {
            _id: reqResult._id?.toString(),
            fromUserId: reqResult.fromUserId,
            toUserId: reqResult.toUserId,
            type: type,
            hasUser: !!user
        });
        
        return reqResult;
    });
    
    return result;
}

async function acceptFriendRequest(requestId, fromUserId, toUserId) {
    const conn = await connect();
    
    console.log('[DEBUG acceptFriendRequest] Aceitando solicitação:', {
        requestId,
        fromUserId,
        toUserId
    });
    
    // Atualiza status da solicitação
    const updateResult = await conn.collection("friendRequests").updateOne(
        { _id: ObjectId.createFromHexString(requestId.toString()) },
        { $set: { status: 'accepted', acceptedAt: new Date() } }
    );
    
    console.log('[DEBUG acceptFriendRequest] Solicitação atualizada:', updateResult.modifiedCount);
    
    // Cria relação de amizade mútua
    await addFriendRelation(fromUserId, toUserId);
    
    // Verifica se a amizade foi criada
    const user1 = await conn.collection("users").findOne({ _id: ObjectId.createFromHexString(fromUserId.toString()) });
    const user2 = await conn.collection("users").findOne({ _id: ObjectId.createFromHexString(toUserId.toString()) });
    
    console.log('[DEBUG acceptFriendRequest] Verificação pós-adição:', {
        user1Friends: user1?.friends?.length || 0,
        user2Friends: user2?.friends?.length || 0
    });
}

async function rejectFriendRequest(requestId) {
    const conn = await connect();
    return conn.collection("friendRequests").updateOne(
        { _id: ObjectId.createFromHexString(requestId.toString()) },
        { $set: { status: 'rejected', rejectedAt: new Date() } }
    );
}

async function removeFriend(userId1, userId2) {
    const conn = await connect();
    const users = conn.collection("users");
    
    const id1 = ObjectId.createFromHexString(userId1.toString());
    const id2 = ObjectId.createFromHexString(userId2.toString());
    
    await users.updateOne({ _id: id1 }, { $pull: { friends: id2 } });
    await users.updateOne({ _id: id2 }, { $pull: { friends: id1 } });
}

// ======= Funções relacionadas a produtos (products) =======

async function createProduct(product) {
    const conn = await connect();
    return conn.collection("products").insertOne({
        ...product,
        userId: ObjectId.createFromHexString(product.userId.toString()),
        createdAt: new Date(),
        status: 'available',
        type: product.type || 'trade', // 'trade', 'donation', 'loan'
    });
}

async function getProducts(userId = null, filters = {}) {
    const conn = await connect();
    
    // Constrói a query base
    const query = {};
    
    // Se tem userId, filtra por userId E status (available, traded, donated, donation_accepted, loaned)
    if (userId) {
        query.userId = ObjectId.createFromHexString(userId.toString());
        query.$or = [
            { status: 'available' },
            { status: 'traded' },
            { status: 'donated' },
            { status: 'donation_accepted' },
            { status: 'loaned' }
        ];
    } else {
        // Se não tem userId, busca todos os produtos disponíveis, trocados, doados ou emprestados
        query.$or = [
            { status: 'available' },
            { status: 'traded' },
            { status: 'donated' },
            { status: 'donation_accepted' },
            { status: 'loaned' }
        ];
    }
    
    if (filters.category) {
        query.category = filters.category;
    }
    
    if (filters.search) {
        // Combina busca de texto com status e userId
        const searchQuery = {
            $or: [
                { name: new RegExp(filters.search, 'i') },
                { description: new RegExp(filters.search, 'i') }
            ]
        };
        
        // Se já tem $or para status, usa $and para combinar
        if (query.$or) {
            query.$and = [
                { $or: query.$or },
                searchQuery
            ];
            delete query.$or;
        } else {
            Object.assign(query, searchQuery);
        }
    }
    
    console.log(`[getProducts] Query:`, JSON.stringify(query, null, 2));
    
    const products = await conn.collection("products")
        .find(query)
        .sort({ createdAt: -1 })
        .limit(filters.limit || 50)
        .toArray();
    
    console.log(`[getProducts] Encontrados ${products.length} produtos para userId: ${userId || 'todos'}`);
    
    // Popula informações dos usuários
    const userIds = [...new Set(products.map(p => p.userId.toString()))];
    const users = await conn.collection("users")
        .find({ _id: { $in: userIds.map(id => ObjectId.createFromHexString(id)) } })
        .project({ password: 0 })
        .toArray();
    
    const userMap = new Map(users.map(u => [u._id.toString(), {
        ...u,
        _id: u._id?.toString() || u._id
    }]));
    
    return products.map(product => {
        const user = userMap.get(product.userId.toString());
        return {
            ...product,
            user: user ? {
                ...user,
                _id: user._id?.toString() || user._id
            } : null
        };
    });
}

async function getProduct(productId) {
    const conn = await connect();
    const product = await conn.collection("products").findOne({
        _id: ObjectId.createFromHexString(productId.toString())
    });
    
    if (!product) return null;
    
    const user = await conn.collection("users").findOne(
        { _id: product.userId },
        { projection: { password: 0 } }
    );
    
    return {
        ...product,
        user: user ? {
            ...user,
            _id: user._id?.toString() || user._id
        } : null
    };
}

async function updateProduct(productId, userId, updates) {
    const conn = await connect();
    return conn.collection("products").updateOne(
        { _id: ObjectId.createFromHexString(productId.toString()), userId: ObjectId.createFromHexString(userId.toString()) },
        { $set: { ...updates, updatedAt: new Date() } }
    );
}

async function deleteProduct(productId, userId) {
    const conn = await connect();
    return conn.collection("products").deleteOne({
        _id: ObjectId.createFromHexString(productId.toString()),
        userId: ObjectId.createFromHexString(userId.toString())
    });
}

// ======= Funções relacionadas a trocas (trades) =======

async function createTrade(trade) {
    const conn = await connect();
    return conn.collection("trades").insertOne({
        ...trade,
        fromUserId: ObjectId.createFromHexString(trade.fromUserId.toString()),
        toUserId: ObjectId.createFromHexString(trade.toUserId.toString()),
        fromProductId: ObjectId.createFromHexString(trade.fromProductId.toString()),
        toProductId: ObjectId.createFromHexString(trade.toProductId.toString()),
        status: 'pending',
        createdAt: new Date(),
    });
}

async function getTrades(userId) {
    const conn = await connect();
    const id = ObjectId.createFromHexString(userId.toString());
    
    const trades = await conn.collection("trades")
        .find({
            $or: [
                { fromUserId: id },
                { toUserId: id }
            ]
        })
        .sort({ createdAt: -1 })
        .toArray();
    
    // Popula produtos e usuários
    const productIds = [...new Set([...trades.map(t => t.fromProductId), ...trades.map(t => t.toProductId)])];
    const userIds = [...new Set([...trades.map(t => t.fromUserId), ...trades.map(t => t.toUserId)])];
    
    const products = await conn.collection("products")
        .find({ _id: { $in: productIds } })
        .toArray();
    
    const users = await conn.collection("users")
        .find({ _id: { $in: userIds } })
        .project({ password: 0 })
        .toArray();
    
    const productMap = new Map(products.map(p => [p._id.toString(), p]));
    const userMap = new Map(users.map(u => [u._id.toString(), u]));
    
    return trades.map(trade => ({
        ...trade,
        _id: trade._id?.toString(),
        fromUserId: trade.fromUserId?.toString(),
        toUserId: trade.toUserId?.toString(),
        fromProductId: trade.fromProductId?.toString(),
        toProductId: trade.toProductId?.toString(),
        fromProduct: productMap.get(trade.fromProductId.toString()),
        toProduct: productMap.get(trade.toProductId.toString()),
        fromUser: userMap.get(trade.fromUserId.toString()),
        toUser: userMap.get(trade.toUserId.toString()),
    }));
}

async function getTradeById(tradeId) {
    const conn = await connect();
    const trade = await conn.collection("trades").findOne({
        _id: ObjectId.createFromHexString(tradeId.toString())
    });
    
    if (!trade) return null;
    
    // Popula produtos e usuários
    const fromProduct = await conn.collection("products").findOne({ _id: trade.fromProductId });
    const toProduct = await conn.collection("products").findOne({ _id: trade.toProductId });
    const fromUser = await conn.collection("users").findOne({ _id: trade.fromUserId }, { projection: { password: 0 } });
    const toUser = await conn.collection("users").findOne({ _id: trade.toUserId }, { projection: { password: 0 } });
    
    return {
        ...trade,
        _id: trade._id?.toString(),
        fromUserId: trade.fromUserId?.toString(),
        toUserId: trade.toUserId?.toString(),
        fromProductId: trade.fromProductId?.toString(),
        toProductId: trade.toProductId?.toString(),
        fromProduct,
        toProduct,
        fromUser,
        toUser,
    };
}

// Funções de mensagens de troca
async function createTradeMessage(messageData) {
    const conn = await connect();
    const result = await conn.collection("tradeMessages").insertOne({
        tradeId: ObjectId.createFromHexString(messageData.tradeId.toString()),
        userId: ObjectId.createFromHexString(messageData.userId.toString()),
        message: messageData.message,
        createdAt: new Date(),
    });
    
    // Busca a mensagem criada com informações do usuário
    const message = await conn.collection("tradeMessages").findOne({ _id: result.insertedId });
    const user = await conn.collection("users").findOne({ _id: message.userId }, { projection: { password: 0 } });
    
    return {
        ...message,
        _id: message._id?.toString(),
        tradeId: message.tradeId?.toString(),
        userId: message.userId?.toString(),
        user,
    };
}

async function getTradeMessages(tradeId) {
    const conn = await connect();
    const messages = await conn.collection("tradeMessages")
        .find({ tradeId: ObjectId.createFromHexString(tradeId.toString()) })
        .sort({ createdAt: 1 })
        .toArray();
    
    // Popula informações dos usuários
    const userIds = [...new Set(messages.map(m => m.userId))];
    const users = await conn.collection("users")
        .find({ _id: { $in: userIds } })
        .project({ password: 0 })
        .toArray();
    
    const userMap = new Map(users.map(u => [u._id.toString(), u]));
    
    return messages.map(msg => ({
        ...msg,
        _id: msg._id?.toString(),
        tradeId: msg.tradeId?.toString(),
        userId: msg.userId?.toString(),
        user: userMap.get(msg.userId.toString()),
    }));
}

async function updateTradeStatus(tradeId, userId, status) {
    const conn = await connect();
    return conn.collection("trades").updateOne(
        { 
            _id: ObjectId.createFromHexString(tradeId.toString()),
            $or: [
                { fromUserId: ObjectId.createFromHexString(userId.toString()) },
                { toUserId: ObjectId.createFromHexString(userId.toString()) }
            ]
        },
        { $set: { status, updatedAt: new Date() } }
    );
}

// ======= Funções para buscar usuários públicos =======

async function searchPublicUsers(query, excludeUserId) {
    const conn = await connect();
    const excludeId = excludeUserId ? ObjectId.createFromHexString(excludeUserId.toString()) : null;
    
    const searchQuery = {
        $or: [
            { name: new RegExp(query, 'i') },
            { email: new RegExp(query, 'i') }
        ]
    };
    
    // Inclui usuários públicos ou sem o campo isPublic (compatibilidade)
    searchQuery.$or = [
        { name: new RegExp(query, 'i') },
        { email: new RegExp(query, 'i') }
    ];
    
    if (excludeId) {
        searchQuery._id = { $ne: excludeId };
    }
    
    return conn.collection("users")
        .find(searchQuery)
        .project({ password: 0 })
        .limit(20)
        .toArray();
}

// ======= Funções relacionadas a notificações (notifications) =======

async function createNotification(notification) {
    const conn = await connect();
    return conn.collection("notifications").insertOne({
        ...notification,
        userId: ObjectId.createFromHexString(notification.userId.toString()),
        read: false,
        createdAt: new Date(),
    });
}

async function getNotifications(userId) {
    const conn = await connect();
    const id = ObjectId.createFromHexString(userId.toString());
    
    const notifications = await conn.collection("notifications")
        .find({ userId: id })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray();
    
    // Popula informações dos usuários relacionados se houver
    const userIds = notifications
        .map(n => n.fromUserId || n.relatedUserId)
        .filter(id => id);
    
    if (userIds.length > 0) {
        const users = await conn.collection("users")
            .find({ _id: { $in: userIds.map(id => ObjectId.createFromHexString(id.toString())) } })
            .project({ password: 0 })
            .toArray();
        
        const userMap = new Map(users.map(u => [u._id.toString(), u]));
        
        return notifications.map(notif => ({
            ...notif,
            _id: notif._id?.toString(),
            userId: notif.userId?.toString(),
            fromUserId: notif.fromUserId?.toString(),
            fromUser: notif.fromUserId ? userMap.get(notif.fromUserId.toString()) : null,
        }));
    }
    
    return notifications.map(notif => ({
        ...notif,
        _id: notif._id?.toString(),
        userId: notif.userId?.toString(),
        fromUserId: notif.fromUserId?.toString(),
    }));
}

async function markNotificationAsRead(notificationId, userId) {
    const conn = await connect();
    return conn.collection("notifications").updateOne(
        { 
            _id: ObjectId.createFromHexString(notificationId.toString()),
            userId: ObjectId.createFromHexString(userId.toString())
        },
        { $set: { read: true, readAt: new Date() } }
    );
}

async function markAllNotificationsAsRead(userId) {
    const conn = await connect();
    return conn.collection("notifications").updateMany(
        { 
            userId: ObjectId.createFromHexString(userId.toString()),
            read: false
        },
        { $set: { read: true, readAt: new Date() } }
    );
}

async function getUnreadNotificationCount(userId) {
    const conn = await connect();
    const id = ObjectId.createFromHexString(userId.toString());
    return conn.collection("notifications").countDocuments({ userId: id, read: false });
}

// ======= Funções relacionadas a doações (donations) =======

async function createDonationRequest(donation) {
    const conn = await connect();
    return conn.collection("donations").insertOne({
        ...donation,
        productId: ObjectId.createFromHexString(donation.productId.toString()),
        fromUserId: ObjectId.createFromHexString(donation.fromUserId.toString()),
        toUserId: ObjectId.createFromHexString(donation.toUserId.toString()),
        status: 'pending',
        createdAt: new Date(),
    });
}

async function getDonationRequests(userId, type = 'received') {
    const conn = await connect();
    const id = ObjectId.createFromHexString(userId.toString());
    
    // Para 'received': busca doações onde o usuário é o dono (toUserId)
    // Inclui pendentes, aceitas e confirmadas para mostrar histórico completo
    // Para 'sent': busca doações onde o usuário solicitou (fromUserId)
    // Inclui todas as doações (pendentes, aceitas, confirmadas)
    const query = type === 'received' 
        ? { 
            toUserId: id, 
            // Inclui todos os status para mostrar histórico completo das doações feitas
            status: { $in: ['pending', 'accepted', 'confirmed', 'rejected'] }
          }
        : { 
            fromUserId: id,
            // Para sent, inclui todas as doações (pendentes, aceitas, confirmadas)
            // para que o receptor possa ver e confirmar
          };
    
    console.log(`[DEBUG DB] getDonationRequests - userId: ${userId}, type: ${type}, query:`, JSON.stringify(query));
    
    const donations = await conn.collection("donations")
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();
    
    console.log(`[DEBUG DB] Encontradas ${donations.length} doações`);
    
    // Popula produtos e usuários
    const productIds = [...new Set(donations.map(d => d.productId))];
    const userIds = [...new Set([
        ...donations.map(d => d.fromUserId),
        ...donations.map(d => d.toUserId)
    ])];
    
    const products = await conn.collection("products")
        .find({ _id: { $in: productIds } })
        .toArray();
    
    const users = await conn.collection("users")
        .find({ _id: { $in: userIds } })
        .project({ password: 0 })
        .toArray();
    
    const productMap = new Map(products.map(p => [p._id.toString(), p]));
    const userMap = new Map(users.map(u => [u._id.toString(), u]));
    
    return donations.map(donation => ({
        ...donation,
        _id: donation._id?.toString(),
        productId: donation.productId?.toString(),
        fromUserId: donation.fromUserId?.toString(),
        toUserId: donation.toUserId?.toString(),
        product: productMap.get(donation.productId.toString()),
        fromUser: userMap.get(donation.fromUserId.toString()),
        toUser: userMap.get(donation.toUserId.toString()),
    }));
}

async function getDonationRequestCount(productId) {
    const conn = await connect();
    const id = ObjectId.createFromHexString(productId.toString());
    return conn.collection("donations").countDocuments({ 
        productId: id, 
        status: 'pending' 
    });
}

async function getDonationById(donationId) {
    const conn = await connect();
    const donation = await conn.collection("donations").findOne({
        _id: ObjectId.createFromHexString(donationId.toString())
    });
    
    if (!donation) return null;
    
    // Popula produto e usuários
    const product = await conn.collection("products").findOne({ _id: donation.productId });
    const fromUser = await conn.collection("users").findOne({ _id: donation.fromUserId }, { projection: { password: 0 } });
    const toUser = await conn.collection("users").findOne({ _id: donation.toUserId }, { projection: { password: 0 } });
    
    return {
        ...donation,
        _id: donation._id?.toString(),
        productId: donation.productId?.toString(),
        fromUserId: donation.fromUserId?.toString(),
        toUserId: donation.toUserId?.toString(),
        product,
        fromUser,
        toUser,
    };
}

async function acceptDonation(donationId, userId) {
    const conn = await connect();
    const id = ObjectId.createFromHexString(donationId.toString());
    
    // Atualiza a doação aceita (status: accepted, não donated ainda)
    const donation = await conn.collection("donations").findOne({ _id: id });
    if (!donation) return null;
    
    await conn.collection("donations").updateOne(
        { _id: id },
        { $set: { status: 'accepted', acceptedAt: new Date() } }
    );
    
    // Rejeita todas as outras solicitações pendentes para o mesmo produto
    await conn.collection("donations").updateMany(
        { 
            productId: donation.productId,
            _id: { $ne: id },
            status: 'pending'
        },
        { $set: { status: 'rejected', rejectedAt: new Date() } }
    );
    
    // Atualiza o produto para status "accepted" (aguardando confirmação de recebimento)
    await conn.collection("products").updateOne(
        { _id: donation.productId },
        { 
            $set: { 
                status: 'donation_accepted',
                donationAcceptedTo: donation.fromUserId,
                donationAcceptedAt: new Date(),
                updatedAt: new Date()
            } 
        }
    );
    
    return donation;
}

async function confirmDonationReceived(donationId, userId) {
    const conn = await connect();
    const id = ObjectId.createFromHexString(donationId.toString());
    
    // Busca a doação
    const donation = await conn.collection("donations").findOne({ _id: id });
    if (!donation) return null;
    
    // Verifica se o usuário é quem recebeu a doação (fromUserId)
    const donationFromUserId = donation.fromUserId?.toString ? donation.fromUserId.toString() : String(donation.fromUserId);
    if (donationFromUserId !== userId) {
        throw new Error('Apenas o receptor da doação pode confirmar o recebimento');
    }
    
    // Atualiza status da doação para "confirmed"
    await conn.collection("donations").updateOne(
        { _id: id },
        { $set: { status: 'confirmed', confirmedAt: new Date() } }
    );
    
    // Busca informações do usuário que recebeu a doação
    const donatedToUser = await conn.collection("users").findOne(
        { _id: donation.fromUserId },
        { projection: { password: 0 } }
    );
    
    // Atualiza o produto para status "donated"
    await conn.collection("products").updateOne(
        { _id: donation.productId },
        { 
            $set: { 
                status: 'donated',
                donatedTo: donation.fromUserId,
                donatedToUserName: donatedToUser?.name || 'Usuário',
                donatedAt: new Date(),
                updatedAt: new Date()
            } 
        }
    );
    
    return donation;
}

// Funções de mensagens de doação
async function createDonationMessage(messageData) {
    const conn = await connect();
    const result = await conn.collection("donationMessages").insertOne({
        donationId: ObjectId.createFromHexString(messageData.donationId.toString()),
        userId: ObjectId.createFromHexString(messageData.userId.toString()),
        message: messageData.message,
        createdAt: new Date(),
    });
    
    // Busca a mensagem criada com informações do usuário
    const message = await conn.collection("donationMessages").findOne({ _id: result.insertedId });
    const user = await conn.collection("users").findOne({ _id: message.userId }, { projection: { password: 0 } });
    
    return {
        ...message,
        _id: message._id?.toString(),
        donationId: message.donationId?.toString(),
        userId: message.userId?.toString(),
        user,
    };
}

async function getDonationMessages(donationId) {
    const conn = await connect();
    const messages = await conn.collection("donationMessages")
        .find({ donationId: ObjectId.createFromHexString(donationId.toString()) })
        .sort({ createdAt: 1 })
        .toArray();
    
    // Popula informações dos usuários
    const userIds = [...new Set(messages.map(m => m.userId))];
    const users = await conn.collection("users")
        .find({ _id: { $in: userIds } })
        .project({ password: 0 })
        .toArray();
    
    const userMap = new Map(users.map(u => [u._id.toString(), u]));
    
    return messages.map(msg => ({
        ...msg,
        _id: msg._id?.toString(),
        donationId: msg.donationId?.toString(),
        userId: msg.userId?.toString(),
        user: userMap.get(msg.userId.toString()),
    }));
}

// ======= Funções relacionadas a empréstimos (loans) =======

async function createLoanRequest(loan) {
    const conn = await connect();
    return conn.collection("loans").insertOne({
        ...loan,
        requesterId: ObjectId.createFromHexString(loan.requesterId.toString()),
        lenderId: loan.lenderId ? ObjectId.createFromHexString(loan.lenderId.toString()) : null,
        productId: loan.productId ? ObjectId.createFromHexString(loan.productId.toString()) : null,
        status: 'pending',
        requesterConfirmed: false,
        lenderConfirmed: false,
        createdAt: new Date(),
    });
}

async function getLoanRequests(userId, type = 'received') {
    const conn = await connect();
    const id = ObjectId.createFromHexString(userId.toString());
    
    // Para 'received': empréstimos onde o usuário é o emprestador (lenderId = userId) - FEZ/EMPRESTOU
    // Para 'sent': empréstimos onde o usuário é o solicitante (requesterId = userId) - RECEBEU
    // Para o feed: todos os pedidos pendentes sem lenderId
    let query;
    if (type === 'sent') {
        // Empréstimos que o usuário solicitou (ele vai receber)
        query = { requesterId: id };
    } else if (type === 'all' || type === 'feed') {
        // Para o feed, busca todos os pedidos pendentes sem lenderId
        query = { status: 'pending', lenderId: null };
    } else {
        // 'received' - empréstimos onde o usuário é o emprestador (ele emprestou)
        query = { lenderId: id };
    }
    
    const loans = await conn.collection("loans")
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();
    
    // Popula produtos e usuários
    const productIds = loans.map(l => l.productId).filter(id => id);
    const userIds = [...new Set([
        ...loans.map(l => l.requesterId),
        ...loans.map(l => l.lenderId).filter(id => id)
    ])];
    
    const products = productIds.length > 0 
        ? await conn.collection("products")
            .find({ _id: { $in: productIds } })
            .toArray()
        : [];
    
    const users = await conn.collection("users")
        .find({ _id: { $in: userIds } })
        .project({ password: 0 })
        .toArray();
    
    const productMap = new Map(products.map(p => [p._id.toString(), p]));
    const userMap = new Map(users.map(u => [u._id.toString(), u]));
    
    return loans.map(loan => ({
        ...loan,
        _id: loan._id?.toString(),
        requesterId: loan.requesterId?.toString(),
        lenderId: loan.lenderId?.toString(),
        productId: loan.productId?.toString(),
        product: loan.productId ? productMap.get(loan.productId.toString()) : null,
        requester: userMap.get(loan.requesterId.toString()),
        lender: loan.lenderId ? userMap.get(loan.lenderId.toString()) : null,
    }));
}

async function createLoanOffer(loanId, lenderId, productId) {
    const conn = await connect();
    const id = ObjectId.createFromHexString(loanId.toString());
    
    return conn.collection("loans").updateOne(
        { _id: id },
        { 
            $set: { 
                lenderId: ObjectId.createFromHexString(lenderId.toString()),
                productId: ObjectId.createFromHexString(productId.toString()),
                status: 'offered',
                updatedAt: new Date()
            } 
        }
    );
}

async function updateLoanStatus(loanId, status) {
    const conn = await connect();
    const id = ObjectId.createFromHexString(loanId.toString());
    
    return conn.collection("loans").updateOne(
        { _id: id },
        { $set: { status, updatedAt: new Date() } }
    );
}

async function getLoanById(loanId) {
    const conn = await connect();
    const id = ObjectId.createFromHexString(loanId.toString());
    
    const loan = await conn.collection("loans").findOne({ _id: id });
    if (!loan) return null;
    
    // Popula produto e usuários
    const product = loan.productId 
        ? await conn.collection("products").findOne({ _id: loan.productId })
        : null;
    
    const requester = await conn.collection("users").findOne(
        { _id: loan.requesterId },
        { projection: { password: 0 } }
    );
    
    const lender = loan.lenderId 
        ? await conn.collection("users").findOne(
            { _id: loan.lenderId },
            { projection: { password: 0 } }
          )
        : null;
    
    return {
        ...loan,
        _id: loan._id?.toString(),
        requesterId: loan.requesterId?.toString(),
        lenderId: loan.lenderId?.toString(),
        productId: loan.productId?.toString(),
        product,
        requester,
        lender,
    };
}

async function cancelLoanRequest(loanId, userId) {
    const conn = await connect();
    const id = ObjectId.createFromHexString(loanId.toString());
    
    const loan = await conn.collection("loans").findOne({ _id: id });
    if (!loan) return null;
    
    // Verifica se o usuário é o solicitante
    const loanRequesterId = loan.requesterId?.toString ? loan.requesterId.toString() : String(loan.requesterId);
    if (loanRequesterId !== userId) {
        throw new Error('Apenas o solicitante pode cancelar o pedido');
    }
    
    // Só pode cancelar se ainda estiver pendente ou oferecido
    if (loan.status !== 'pending' && loan.status !== 'offered') {
        throw new Error('Não é possível cancelar um empréstimo que já foi aceito');
    }
    
    await conn.collection("loans").updateOne(
        { _id: id },
        { $set: { status: 'cancelled', cancelledAt: new Date(), updatedAt: new Date() } }
    );
    
    return loan;
}

async function acceptLoan(loanId, userId) {
    const conn = await connect();
    const id = ObjectId.createFromHexString(loanId.toString());
    
    const loan = await conn.collection("loans").findOne({ _id: id });
    if (!loan) return null;
    
    // Verifica se o usuário é o solicitante
    const loanRequesterId = loan.requesterId?.toString ? loan.requesterId.toString() : String(loan.requesterId);
    if (loanRequesterId !== userId) {
        throw new Error('Apenas o solicitante pode aceitar a oferta');
    }
    
    // Verifica se há uma oferta (lenderId e productId)
    if (!loan.lenderId || !loan.productId) {
        throw new Error('Não há oferta para aceitar');
    }
    
    // Atualiza status para accepted
    await conn.collection("loans").updateOne(
        { _id: id },
        { $set: { status: 'accepted', acceptedAt: new Date(), updatedAt: new Date() } }
    );
    
    // Atualiza o produto para status "loan_accepted"
    await conn.collection("products").updateOne(
        { _id: loan.productId },
        { 
            $set: { 
                status: 'loan_accepted',
                loanAcceptedTo: loan.requesterId,
                loanAcceptedAt: new Date(),
                updatedAt: new Date()
            } 
        }
    );
    
    return loan;
}

async function confirmLoanReceived(loanId, userId) {
    const conn = await connect();
    const id = ObjectId.createFromHexString(loanId.toString());
    
    const loan = await conn.collection("loans").findOne({ _id: id });
    if (!loan) return null;
    
    // Verifica se o usuário é o solicitante (quem recebeu o empréstimo)
    const loanRequesterId = loan.requesterId?.toString ? loan.requesterId.toString() : String(loan.requesterId);
    if (loanRequesterId !== userId) {
        throw new Error('Apenas quem recebeu o empréstimo pode confirmar o recebimento');
    }
    
    // Verifica se o empréstimo está aceito
    if (loan.status !== 'accepted') {
        throw new Error('O empréstimo precisa estar aceito para confirmar o recebimento');
    }
    
    // Atualiza status para confirmed
    await conn.collection("loans").updateOne(
        { _id: id },
        { $set: { status: 'confirmed', confirmedAt: new Date(), updatedAt: new Date() } }
    );
    
    // Busca informações do usuário que recebeu o empréstimo
    const loanedToUser = await conn.collection("users").findOne(
        { _id: loan.requesterId },
        { projection: { password: 0 } }
    );
    
    // Atualiza o produto para status "loaned"
    if (loan.productId) {
        await conn.collection("products").updateOne(
            { _id: loan.productId },
            { 
                $set: { 
                    status: 'loaned',
                    loanedTo: loan.requesterId,
                    loanedToUserName: loanedToUser?.name || 'Usuário',
                    loanedAt: new Date(),
                    updatedAt: new Date()
                } 
            }
        );
    }
    
    return loan;
}

async function confirmLoan(loanId, userId, userType) {
    const conn = await connect();
    const id = ObjectId.createFromHexString(loanId.toString());
    
    const loan = await conn.collection("loans").findOne({ _id: id });
    if (!loan) return null;
    
    const update = {};
    if (userType === 'requester') {
        update.requesterConfirmed = true;
    } else if (userType === 'lender') {
        update.lenderConfirmed = true;
    }
    
    // Se ambos confirmaram, marca como confirmado
    const requesterConfirmed = userType === 'requester' ? true : loan.requesterConfirmed;
    const lenderConfirmed = userType === 'lender' ? true : loan.lenderConfirmed;
    
    if (requesterConfirmed && lenderConfirmed) {
        update.status = 'confirmed';
        update.confirmedAt = new Date();
        
        // Atualiza o produto se houver
        if (loan.productId) {
            // Busca informações do usuário que recebeu o empréstimo
            const loanedToUser = await conn.collection("users").findOne(
                { _id: loan.requesterId },
                { projection: { password: 0 } }
            );
            
            await conn.collection("products").updateOne(
                { _id: loan.productId },
                { 
                    $set: { 
                        status: 'loaned',
                        loanedTo: loan.requesterId,
                        loanedToUserName: loanedToUser?.name || 'Usuário',
                        loanedAt: new Date(),
                        updatedAt: new Date()
                    } 
                }
            );
        }
    }
    
    await conn.collection("loans").updateOne(
        { _id: id },
        { $set: { ...update, updatedAt: new Date() } }
    );
    
    return loan;
}

// Funções de mensagens de empréstimo
async function createLoanMessage(messageData) {
    const conn = await connect();
    const result = await conn.collection("loanMessages").insertOne({
        loanId: ObjectId.createFromHexString(messageData.loanId.toString()),
        userId: ObjectId.createFromHexString(messageData.userId.toString()),
        message: messageData.message,
        createdAt: new Date(),
    });
    
    // Busca a mensagem criada com informações do usuário
    const message = await conn.collection("loanMessages").findOne({ _id: result.insertedId });
    const user = await conn.collection("users").findOne({ _id: message.userId }, { projection: { password: 0 } });
    
    return {
        ...message,
        _id: message._id?.toString(),
        loanId: message.loanId?.toString(),
        userId: message.userId?.toString(),
        user,
    };
}

async function getLoanMessages(loanId) {
    const conn = await connect();
    const messages = await conn.collection("loanMessages")
        .find({ loanId: ObjectId.createFromHexString(loanId.toString()) })
        .sort({ createdAt: 1 })
        .toArray();
    
    // Popula informações dos usuários
    const userIds = [...new Set(messages.map(m => m.userId))];
    const users = userIds.length > 0
        ? await conn.collection("users")
            .find({ _id: { $in: userIds } })
            .project({ password: 0 })
            .toArray()
        : [];
    
    const userMap = new Map(users.map(u => [u._id.toString(), u]));
    
    return messages.map(msg => ({
        ...msg,
        _id: msg._id?.toString(),
        loanId: msg.loanId?.toString(),
        userId: msg.userId?.toString(),
        user: userMap.get(msg.userId.toString()),
    }));
}

// Funções de conversas diretas entre usuários
async function createConversation(user1Id, user2Id) {
    const conn = await connect();
    // Garante que user1Id < user2Id para evitar duplicatas
    const ids = [user1Id.toString(), user2Id.toString()].sort();
    
    // Verifica se já existe
    const existing = await conn.collection("conversations").findOne({
        user1Id: ObjectId.createFromHexString(ids[0]),
        user2Id: ObjectId.createFromHexString(ids[1])
    });
    
    if (existing) {
        return {
            ...existing,
            _id: existing._id?.toString(),
            user1Id: existing.user1Id?.toString(),
            user2Id: existing.user2Id?.toString(),
        };
    }
    
    const result = await conn.collection("conversations").insertOne({
        user1Id: ObjectId.createFromHexString(ids[0]),
        user2Id: ObjectId.createFromHexString(ids[1]),
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    
    const conversation = await conn.collection("conversations").findOne({ _id: result.insertedId });
    
    // Popula usuários
    const user1 = await conn.collection("users").findOne({ _id: conversation.user1Id }, { projection: { password: 0 } });
    const user2 = await conn.collection("users").findOne({ _id: conversation.user2Id }, { projection: { password: 0 } });
    
    return {
        ...conversation,
        _id: conversation._id?.toString(),
        user1Id: conversation.user1Id?.toString(),
        user2Id: conversation.user2Id?.toString(),
        user1,
        user2,
    };
}

async function getConversation(user1Id, user2Id) {
    const conn = await connect();
    const ids = [user1Id.toString(), user2Id.toString()].sort();
    
    const conversation = await conn.collection("conversations").findOne({
        user1Id: ObjectId.createFromHexString(ids[0]),
        user2Id: ObjectId.createFromHexString(ids[1])
    });
    
    if (!conversation) return null;
    
    // Popula usuários
    const user1 = await conn.collection("users").findOne({ _id: conversation.user1Id }, { projection: { password: 0 } });
    const user2 = await conn.collection("users").findOne({ _id: conversation.user2Id }, { projection: { password: 0 } });
    
    return {
        ...conversation,
        _id: conversation._id?.toString(),
        user1Id: conversation.user1Id?.toString(),
        user2Id: conversation.user2Id?.toString(),
        user1,
        user2,
    };
}

async function getConversationById(conversationId) {
    const conn = await connect();
    const conversation = await conn.collection("conversations").findOne({
        _id: ObjectId.createFromHexString(conversationId.toString())
    });
    
    if (!conversation) return null;
    
    // Popula usuários
    const user1 = await conn.collection("users").findOne({ _id: conversation.user1Id }, { projection: { password: 0 } });
    const user2 = await conn.collection("users").findOne({ _id: conversation.user2Id }, { projection: { password: 0 } });
    
    return {
        ...conversation,
        _id: conversation._id?.toString(),
        user1Id: conversation.user1Id?.toString(),
        user2Id: conversation.user2Id?.toString(),
        user1,
        user2,
    };
}

async function getUserConversations(userId) {
    const conn = await connect();
    const id = ObjectId.createFromHexString(userId.toString());
    
    const conversations = await conn.collection("conversations")
        .find({
            $or: [
                { user1Id: id },
                { user2Id: id }
            ]
        })
        .sort({ updatedAt: -1 })
        .toArray();
    
    // Popula usuários e última mensagem
    const userIds = [...new Set([
        ...conversations.map(c => c.user1Id),
        ...conversations.map(c => c.user2Id)
    ])];
    
    const users = await conn.collection("users")
        .find({ _id: { $in: userIds } })
        .project({ password: 0 })
        .toArray();
    
    const userMap = new Map(users.map(u => [u._id.toString(), u]));
    
    // Busca última mensagem de cada conversa
    const conversationIds = conversations.map(c => c._id);
    const lastMessages = await conn.collection("conversationMessages")
        .aggregate([
            { $match: { conversationId: { $in: conversationIds } } },
            { $sort: { createdAt: -1 } },
            { $group: {
                _id: "$conversationId",
                lastMessage: { $first: "$$ROOT" }
            }}
        ])
        .toArray();
    
    const lastMessageMap = new Map(lastMessages.map(m => [m._id.toString(), m.lastMessage]));
    
    return conversations.map(conv => {
        const otherUserId = conv.user1Id.toString() === userId 
            ? conv.user2Id.toString() 
            : conv.user1Id.toString();
        const otherUser = userMap.get(otherUserId);
        const lastMessage = lastMessageMap.get(conv._id.toString());
        
        return {
            ...conv,
            _id: conv._id?.toString(),
            user1Id: conv.user1Id?.toString(),
            user2Id: conv.user2Id?.toString(),
            user1: userMap.get(conv.user1Id.toString()),
            user2: userMap.get(conv.user2Id.toString()),
            otherUser,
            lastMessage: lastMessage ? {
                ...lastMessage,
                _id: lastMessage._id?.toString(),
                conversationId: lastMessage.conversationId?.toString(),
                userId: lastMessage.userId?.toString(),
                user: userMap.get(lastMessage.userId.toString()),
            } : null,
        };
    });
}

async function createConversationMessage(messageData) {
    const conn = await connect();
    const result = await conn.collection("conversationMessages").insertOne({
        conversationId: ObjectId.createFromHexString(messageData.conversationId.toString()),
        userId: ObjectId.createFromHexString(messageData.userId.toString()),
        message: messageData.message,
        createdAt: new Date(),
    });
    
    // Atualiza updatedAt da conversa
    await conn.collection("conversations").updateOne(
        { _id: ObjectId.createFromHexString(messageData.conversationId.toString()) },
        { $set: { updatedAt: new Date() } }
    );
    
    // Busca a mensagem criada com informações do usuário
    const message = await conn.collection("conversationMessages").findOne({ _id: result.insertedId });
    const user = await conn.collection("users").findOne({ _id: message.userId }, { projection: { password: 0 } });
    
    return {
        ...message,
        _id: message._id?.toString(),
        conversationId: message.conversationId?.toString(),
        userId: message.userId?.toString(),
        user,
    };
}

async function getConversationMessages(conversationId) {
    const conn = await connect();
    const messages = await conn.collection("conversationMessages")
        .find({ conversationId: ObjectId.createFromHexString(conversationId.toString()) })
        .sort({ createdAt: 1 })
        .toArray();
    
    // Popula informações dos usuários
    const userIds = [...new Set(messages.map(m => m.userId))];
    const users = userIds.length > 0
        ? await conn.collection("users")
            .find({ _id: { $in: userIds } })
            .project({ password: 0 })
            .toArray()
        : [];
    
    const userMap = new Map(users.map(u => [u._id.toString(), u]));
    
    return messages.map(msg => ({
        ...msg,
        _id: msg._id?.toString(),
        conversationId: msg.conversationId?.toString(),
        userId: msg.userId?.toString(),
        user: userMap.get(msg.userId.toString()),
    }));
}

module.exports = {
    PAGE_SIZE,
    connect,
    // Funções relacionadas aos clientes
    countCustomers,
    findCustomers,
    findCustomer,
    insertCustomer,
    updateCustomer,
    deleteCustomer,
    searchCustomersByName,
    // Funções relacionadas aos pedidos
    countOs,
    findOss,
    findOs,
    insertOs,
    updateOs,
    deleteOs,
    searchOSByName,
    // Funções relacionadas aos usuários
    countUsers,
    findUsers,
    findUser,
    insertUser,
    updateUser,
    deleteUser,
    insertAutoText,
    updateAutoText,
    deleteAutoText,
    findAutoTextById,
    findAutoTextsByUserId,
    findAutoTextByName,
    // Convites
    createInvite,
    findInviteByCode,
    markInviteUsed,
    findInvitesByUser,
    // Amigos
    addFriendRelation,
    getFriends,
    removeFriend,
    // Solicitações de amizade
    createFriendRequest,
    findFriendRequest,
    getFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    // Produtos
    createProduct,
    getProducts,
    getProduct,
    updateProduct,
    deleteProduct,
    // Trocas
    createTrade,
    getTrades,
    getTradeById,
    updateTradeStatus,
    createTradeMessage,
    getTradeMessages,
    // Busca
    searchPublicUsers,
    // Notificações
    createNotification,
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getUnreadNotificationCount,
    // Doações
    createDonationRequest,
    getDonationRequests,
    getDonationRequestCount,
    getDonationById,
    acceptDonation,
    confirmDonationReceived,
    createDonationMessage,
    getDonationMessages,
    // Empréstimos
    createLoanRequest,
    getLoanRequests,
    getLoanById,
    createLoanOffer,
    acceptLoan,
    confirmLoanReceived,
    cancelLoanRequest,
    confirmLoan,
    createLoanMessage,
    getLoanMessages,
    // Conversas
    createConversation,
    getConversation,
    getConversationById,
    getUserConversations,
    createConversationMessage,
    getConversationMessages,
};
