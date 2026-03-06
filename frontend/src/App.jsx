import { useState } from 'react'
import './App.css'
import Header from "./components/layout/Header/Header";
import AddProductForm from "./components/AddProductForm"; 

export default function App() {
  const [view, setView] = useState('home');

  return (
    <>
      <Header onNavigate={setView} />
      
      <main style={{ padding: 20 }}>
        {view === 'add' && <AddProductForm />}

        {view === 'home' && (
          <div className="dashboard-content">
            <h1>Products</h1>
            <p></p>
          </div>
        )}

        {view === 'orders' && (
          <div className="dashboard-content">
            <h1>Incoming Orders</h1>
            <p></p>
          </div>
        )}

        {view === 'history' && (
          <div className="dashboard-content">
            <h1>Previous Orders</h1>
            <p></p>
          </div>
        )}

        {view === 'payout' && (
          <div className="dashboard-content">
            <h1>Weekly Payout</h1>
            <p></p>
          </div>
        )}

        {view === 'community' && (
          <div className="dashboard-content">
            <h1>Community Engagement</h1>
            <p></p>
          </div>
        )}
      </main>
    </>
  );
}