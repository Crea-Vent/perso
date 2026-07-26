import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { BudgetPage } from './pages/BudgetPage'
import { SubscriptionsPage } from './pages/SubscriptionsPage'
import { InvestmentsPage } from './pages/InvestmentsPage'
import { SavingsPage } from './pages/SavingsPage'
import { PendingIncomePage } from './pages/PendingIncomePage'
import { CategoriesPage } from './pages/CategoriesPage'

function App() {
  return (
    <BrowserRouter basename="/perso">
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/budget" element={<BudgetPage />} />
            <Route path="/abonnements" element={<SubscriptionsPage />} />
            <Route path="/investissements" element={<InvestmentsPage />} />
            <Route path="/epargne" element={<SavingsPage />} />
            <Route path="/a-venir" element={<PendingIncomePage />} />
            <Route path="/categories" element={<CategoriesPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
