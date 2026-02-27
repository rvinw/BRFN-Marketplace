import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Header from "./components/layout/Header/Header";

/* function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Header>Header</Header>
      
    </>
  )
}

export default App */

export default function App() {
  return (
    <>
      <Header />
      <main style={{ padding: 20 }}>
        <h1>Home Page</h1>
        <p>Carousel will go here.</p>
        <p>Categories section will go here.</p>
        <div style={{ height: 1200 }}>
          Scroll down to test sticky TopBar
        </div>
      </main>
    </>
  );
}
