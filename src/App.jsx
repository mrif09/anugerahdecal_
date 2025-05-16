import { useEffect } from "react"
import { HashRouter, Navigate, Route, Routes } from "react-router"
import Index from "./pages"
import Dashboard from "./pages/dashboard/dashboard"
import DashboardIndex from "./pages/dashboard/dashboardIndex"
import Product from "./pages/dashboard/product"
import sales from "./pages/dashboard/sales"
import Login from "./pages/login"
import useAuthStore from "./store/authStore"
import Merk from "./pages/dashboard/merk"
import Model from "./pages/dashboard/model"
import Category from "./pages/dashboard/category"
import Bahan from "./pages/dashboard/bahan"
import Laminating from "./pages/dashboard/laminating"
import Customer from "./pages/dashboard/customer"
import Transaksi from "./pages/dashboard/transaksi"

function App() {
  const { user, initializeAuth, loading } = useAuthStore()

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  const ProtectedRoute = ({ children }) => {
    if (loading) {
      return <></>
    }
    
    if (!user) {
      return <Navigate to={'/login'} />
    }

    return children
  }

  const PublicRoute = ({ children }) => {
    if (loading) {
      return <></>
    }

    if (user) {
      return <Navigate to={'/'} />
    }

    return children
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

        <Route path="/dashboard" element={<ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
        } >
          <Route index element={<DashboardIndex />} />
          <Route path="product" element={<Product />} />
          <Route path="merk" element={<Merk />} />
          <Route path="model" element={<Model />} />
          <Route path="category" element={<Category />} />
          <Route path="bahan" element={<Bahan />} />
          <Route path="laminating" element={<Laminating />} />
          <Route path="customer" element={<Customer />} />
          <Route path="transaksi" element={<Transaksi />} />
        </Route>

      </Routes>
    </HashRouter>
  )
}

export default App