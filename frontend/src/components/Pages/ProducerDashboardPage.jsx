import { useState } from 'react';
import AddProductForm from "../sections/AddProductForm";
import CommunityEngagement from "../sections/CommunityEngagement";

export default function ProducerDashboardPage() {
  const [view, setView] = useState('home');

  const menuItems = [
    { id: 'home', label: 'My Products' },
    { id: 'add', label: 'Add Product' },
    { id: 'orders', label: 'Incoming Orders' },
    { id: 'history', label: 'Previous Orders' },
    { id: 'payout', label: 'Weekly Payout' },
    { id: 'community', label: 'Community Engagement' },
  ];

  const brfnGreen = "#a3e635";

  return (
    <div className="main-container">
      {/* SECONDARY NAV */}
      <nav className="dashboard-nav" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '10px', 
        padding: '1.5rem', 
        borderBottom: '1px solid #eee',
        backgroundColor: '#fff'
      }}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            style={{
              padding: '10px 18px',
              cursor: 'pointer',
              borderRadius: '8px',
              border: `2px solid ${brfnGreen}`,
              fontSize: '0.9rem',
              fontWeight: 'bold',
              transition: '0.2s',
              backgroundColor: view === item.id ? brfnGreen : 'transparent',
              color: 'black',
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* CONTENT AREA */}
      <main className="content-area" style={{ padding: '2rem' }}>
        
        {/* 1. MY PRODUCTS (HOME) */}
        {view === 'home' && (
          <div className="card">
            <h1 className="page-title">My Product Inventory</h1>
            <p className="read-the-docs">Current listings will appear here shortly.</p>
            {/* Future: <ProductList /> */}
          </div>
        )}

        {/* 2. ADD PRODUCT */}
        {view === 'add' && (
          <div className="form-container">
            <h1 style={{ color: brfnGreen }}>Add New Product</h1>
            <div style={{ color: '#333' }}> 
              <AddProductForm onNavigate={setView} />
            </div>
          </div>
        )}

        {/* 3. INCOMING ORDERS */}
        {view === 'orders' && (
          <div className="card">
            <h1 className="page-title">Incoming Orders</h1>
            <p>New orders that need to be fulfilled will show up here.</p>
          </div>
        )}

        {/* 4. PREVIOUS ORDERS (HISTORY) */}
        {view === 'history' && (
          <div className="card">
            <h1 className="page-title">Order History</h1>
            <p>View your completed sales and past transactions.</p>
          </div>
        )}

        {/* 5. WEEKLY PAYOUT */}
        {view === 'payout' && (
          <div className="card">
            <h1 className="page-title">Weekly Payout</h1>
            <p>Track your earnings and upcoming transfers.</p>
          </div>
        )}

        {/* 6. COMMUNITY ENGAGEMENT */}
        {view === 'community' && (
          <div className="community-view-wrapper">
             <CommunityEngagement />
          </div>
        )}

      </main>
    </div>
  );
}