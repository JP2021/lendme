const USER = 1;
const ADMIN = 2;

module.exports = (req, res, next) => {
    // Verifica se é uma requisição de API
    // Rotas que começam com /api ou que aceitam JSON como preferência
    const isApiRequest = req.path.startsWith('/api') || 
                        req.originalUrl.startsWith('/api') ||
                        (req.get('accept') && req.get('accept').includes('application/json')) ||
                        req.get('content-type') === 'application/json';
    
    // Rotas de API não devem ser bloqueadas por este middleware
    // Elas têm sua própria lógica de privacidade e controle de acesso
    if (isApiRequest) {
        // Se não está autenticado, retorna erro 401
        if (!req.isAuthenticated || !req.isAuthenticated()) {
            return res.status(401).json({ message: "Autentique-se para ver esta página!" });
        }
        // Se está autenticado, permite prosseguir (a rota específica fará a verificação de privacidade)
        return next();
    }
    
    // Para rotas não-API (rotas administrativas antigas)
    if (req.isAuthenticated()) {
        const user = req.user;
        if (user) {
            const profile = parseInt(user.profile);

            const originalUrl = req.originalUrl;
            const method = req.method;

            // Apenas bloqueia rotas administrativas antigas (/users sem /api)
            // Rotas de API são tratadas acima
            if (originalUrl.startsWith("/users") && !originalUrl.startsWith("/api") && profile !== ADMIN) {
                return res.render("login", { title: "Login", message: "Autentique-se para ver esta página!" });
            }

            return next();
        }
    }

    // Se não está autenticado e não é API, renderiza página de login
    res.render("login", { title: "Login", message: "Autentique-se para ver esta página!" });
}