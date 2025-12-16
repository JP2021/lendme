import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Invite from './pages/Invite'
import Profile from './pages/Profile'
import Friends from './pages/Friends'
import Trades from './pages/Lendings'
import Explore from './pages/Explore'
import AddProduct from './pages/AddProduct'
import Settings from './pages/Settings'
import ForgotPassword from './pages/ForgotPassword'
import Invites from './pages/Invites'
import EditProfile from './pages/EditProfile'
import EditProduct from './pages/EditProduct'
import SelectProductForTrade from './pages/SelectProductForTrade'
import TradeDetails from './pages/TradeDetails'
import PrivacySettings from './pages/PrivacySettings'
import ChangePassword from './pages/ChangePassword'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-lendme-dark text-gray-100">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot" element={<ForgotPassword />} />
            <Route path="/invite/:inviteCode" element={<Invite />} />
            <Route
              path="/explore"
              element={
                <ProtectedRoute>
                  <Explore />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-product"
              element={
                <ProtectedRoute>
                  <AddProduct />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/privacy"
              element={
                <ProtectedRoute>
                  <PrivacySettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/password"
              element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invites"
              element={
                <ProtectedRoute>
                  <Invites />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/edit"
              element={
                <ProtectedRoute>
                  <EditProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products/:productId/edit"
              element={
                <ProtectedRoute>
                  <EditProduct />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trade/:productId/select"
              element={
                <ProtectedRoute>
                  <SelectProductForTrade />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trades/:tradeId"
              element={
                <ProtectedRoute>
                  <TradeDetails />
                </ProtectedRoute>
              }
            />

            {/* Rotas protegidas */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/friends"
              element={
                <ProtectedRoute>
                  <Friends />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trades"
              element={
                <ProtectedRoute>
                  <Trades />
                </ProtectedRoute>
              }
            />

            {/* Rotas apenas para admin */}
            <Route
              path="/admin/*"
              element={
                <AdminRoute>
                  <div>Admin Panel</div>
                </AdminRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
