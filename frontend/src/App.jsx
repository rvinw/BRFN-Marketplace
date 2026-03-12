import { Routes, Route } from 'react-router-dom'

import Header from './components/layout/Header/Header'
import Footer from './components/layout/Footer/Footer'

// Pages 
import HomePage from './components/Pages/HomePage'
import ProductsPage from './components/Pages/ProductsPage'
import ProductDetailPage from './components/Pages/ProductDetailPage'
import LoginPage from './components/Pages/LoginPage'
import CustomerRegisterPage from './components/Pages/CustomerRegisterPage'
import ProducerRegisterPage from './components/Pages/ProducerRegisterPage'
import CartPage from './components/Pages/CartPage'
import CheckoutPage from './components/Pages/CheckoutPage'
import CustomerDashboardPage from './components/Pages/CustomerDashboardPage'
import ProducerDashboardPage from './components/Pages/ProducerDashboardPage'
import './App.css'

export default function App() {
  const [view, setView] = useState('home');

  return (
    <>
      <Header />
      <Routes>
        <Route path="/"                    element={<HomePage />} />
        <Route path="/products"            element={<ProductsPage />} />
        <Route path="/products/:id"        element={<ProductDetailPage />} />
        <Route path="/login"               element={<LoginPage />} />
        <Route path="/register/customer"   element={<CustomerRegisterPage />} />
        <Route path="/register/producer"   element={<ProducerRegisterPage />} />
        <Route path="/cart"                element={<CartPage />} />
        <Route path="/checkout"            element={<CheckoutPage />} />
        <Route path="/dashboard/customer"  element={<CustomerDashboardPage />} />
        <Route path="/dashboard/producer"  element={<ProducerDashboardPage />} />
      </Routes>
      <Footer />
    </>
  )
}