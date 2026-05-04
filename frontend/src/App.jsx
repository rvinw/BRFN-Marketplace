import React from 'react';
import { Routes, Route } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { PostcodeProvider } from './context/PostcodeContext';
import ProtectedRoute from './components/routing/ProtectedRoute';

import Header from './components/layout/Header/Header';
import Footer from './components/layout/Footer/Footer';

import HomePage from './components/Pages/HomePage';
import ProductsPage from './components/Pages/ProductsPage';
import ProductDetailPage from './components/Pages/ProductDetailPage';
import LoginPage from './components/Pages/LoginPage';
import CustomerRegisterPage from './components/Pages/CustomerRegisterPage';
import ProducerRegisterPage from './components/Pages/ProducerRegisterPage';
import CartPage from './components/Pages/CartPage';
import CheckoutPage from './components/Pages/CheckoutPage';
import CustomerDashboardPage from './components/Pages/CustomerDashboardPage';
import ProducerDashboardPage from './components/Pages/ProducerDashboardPage';
import AdminDashboardPage from './components/Pages/AdminDashboardPage';
import ProducerMapPage from './components/Pages/ProducerMapPage';
import './App.css';

export default function App() {
  return (
    <AuthProvider>
    <PostcodeProvider>
    <CartProvider>
      <Header />
      <Routes>
        {/* Public routes — anyone can access */}
        <Route path="/"                   element={<HomePage />} />
        <Route path="/products"           element={<ProductsPage />} />
        <Route path="/products/:id"       element={<ProductDetailPage />} />
        <Route path="/login"              element={<LoginPage />} />
        <Route path="/register/customer"  element={<CustomerRegisterPage />} />
        <Route path="/register/producer"  element={<ProducerRegisterPage />} />
        <Route path="/cart"               element={<CartPage />} />

        {/* Protected: any logged-in user */}
        <Route path="/checkout" element={
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        } />

        {/* Protected: customers and admins only */}
        <Route path="/dashboard/customer" element={
          <ProtectedRoute allowedRoles={['customer', 'admin']}>
            <CustomerDashboardPage />
          </ProtectedRoute>
        } />

        {/* Protected: producers and admins only */}
        <Route path="/dashboard/producer" element={
          <ProtectedRoute allowedRoles={['producer', 'admin']}>
            <ProducerDashboardPage />
          </ProtectedRoute>
        } />

        {/* Protected: admins only */}
        <Route path="/dashboard/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        } />

        {/* Public: producer map */}
        <Route path="/map" element={<ProducerMapPage />} />
      </Routes>
      <Footer />
    </CartProvider>
    </PostcodeProvider>
    </AuthProvider>
  );
}