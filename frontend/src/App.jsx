/* App.jsx */
import { useState } from 'react'
import './App.css'
import Header from "./components/layout/Header/Header";
import AddProductForm from "./components/AddProductForm"; 

export default function App() {
  const [view, setView] = useState('home');

  return (
    <>
      {/* Pass setView to the Header */}
      <Header onNavigate={setView} />
      
      <main style={{ padding: 20 }}>
        {view === 'home' ? (
          <div>
          </div>
        ) : (
          <AddProductForm />
        )}
      </main>
    </>
  );
}