import { useState } from 'react';
import './AdminDashboard.css';
import UsersPanel from '../sections/admin/UsersPanel';
import ProducersPanel from '../sections/admin/ProducersPanel';
import ProductsPanel from '../sections/admin/ProductsPanel';
import OrdersPanel from '../sections/admin/OrdersPanel';
import CategoriesPanel from '../sections/admin/CategoriesPanel';
import CommunityPostsPanel from '../sections/admin/CommunityPostsPanel';

const tabs = [
  { id: 'users',      label: 'Users' },
  { id: 'producers',  label: 'Producers' },
  { id: 'products',   label: 'Products' },
  { id: 'orders',     label: 'Orders' },
  { id: 'categories', label: 'Categories' },
  { id: 'posts',      label: 'Community Posts' },
];

export default function AdminDashboardPage() {
  const [view, setView] = useState('users');

  return (
    <div className="main-container">
      <div className="admin-header">
        <span className="admin-header-title">Admin Dashboard</span>
        <span className="admin-badge">ADMIN</span>
        <span className="admin-header-meta">Full database access</span>
      </div>

      <nav className="admin-tab-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`admin-tab-btn${view === tab.id ? ' admin-tab-btn--active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="admin-content">
        {view === 'users'      && <UsersPanel />}
        {view === 'producers'  && <ProducersPanel />}
        {view === 'products'   && <ProductsPanel />}
        {view === 'orders'     && <OrdersPanel />}
        {view === 'categories' && <CategoriesPanel />}
        {view === 'posts'      && <CommunityPostsPanel />}
      </main>
    </div>
  );
}