import React, { useState } from 'react';
import Header from "../components/layout/Header/Header";
import AddProductForm from "../components/AddProductForm";
import DisplayProducerProducts from "../components/DisplayProducerProducts";
import './ProducerDashboard.css';

export default function ProducerDashboard() {
  const [view, setView] = useState('home');

  return (
    <div className="producer-dashboard">
      <Header onNavigate={setView} />
      <main className="dashboard-main">
        {view === 'add' && <AddProductForm onNavigate={setView} />}
        {view === 'home' && <DisplayProducerProducts />}
        {view === 'orders' && <h1>Incoming Orders</h1>}
        {view === 'history' && <h1>Previous Orders</h1>}
        {view === 'payout' && <h1>Weekly Payout</h1>}
        {view === 'community' && <h1>Community</h1>}
      </main>
    </div>
  );
}