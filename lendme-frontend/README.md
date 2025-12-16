# LendMe - Frontend

Aplicação React para a rede social LendMe, onde usuários podem trocar produtos entre amigos.

## Funcionalidades

- ✅ Autenticação de usuários
- ✅ Sistema de convites (como Orkut)
- ✅ Interface responsiva otimizada para mobile
- ✅ Dashboard com estatísticas
- 🔄 Gerenciamento de amigos
- 🔄 Sistema de trocas de produtos
- 🔄 Perfil do usuário

## Tecnologias

- **React 19** - Framework principal
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Estilização responsiva
- **React Router** - Roteamento
- **Axios** - Cliente HTTP
- **Lucide React** - Ícones

## Como executar

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Configurar variáveis de ambiente:**
   ```bash
   cp .env.example .env
   # Edite o .env com suas configurações
   ```

3. **Executar em modo desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Acessar a aplicação:**
   - Abra http://localhost:5173 no navegador

## Estrutura do Projeto

```
src/
├── components/        # Componentes reutilizáveis
│   ├── ProtectedRoute.jsx
│   └── AdminRoute.jsx
├── contexts/          # Context API
│   └── AuthContext.jsx
├── pages/            # Páginas da aplicação
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── Invite.jsx
│   └── ...
├── services/         # Serviços de API
│   └── authService.js
└── utils/            # Utilitários
```

## Funcionalidades Implementadas

### Autenticação
- Login com nome de usuário e senha
- Sistema de convites para novos cadastros
- Proteção de rotas autenticadas
- Logout seguro

### Interface Mobile-First
- Design responsivo com Tailwind CSS
- Otimizado para dispositivos móveis
- Navegação intuitiva
- Componentes touch-friendly

### Sistema de Convites
- Geração de códigos de convite
- Validação de convites
- Cadastro apenas com convite válido
- Admin pode criar usuários sem convite

## Próximos Passos

1. Implementar backend completo
2. Sistema de gerenciamento de amigos
3. Funcionalidades de troca de produtos
4. Sistema de produtos disponíveis para troca
5. Notificações em tempo real
6. Upload de imagens
7. Chat entre usuários