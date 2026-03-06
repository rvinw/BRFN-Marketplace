import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

// Layout components
import Header from "./components/layout/Header/Header";

// Pages
import Login from "./pages/Login";
import RegisterCustomer from "./pages/RegisterCustomer";
import RegisterProducer from "./pages/RegisterProducer";

function Home() {
  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h2>Welcome to BRFN Marketplace</h2>
      <p>Home page coming soon...</p>
    </div>
  );
}

function ProducerDashboard() {
  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h2>Producer Dashboard</h2>
      <p>Producer dashboard coming soon...</p>
    </div>
  );
}

function App() {
  return (
    <Router>
      {/* Global Header */}
      <Header />

      {/* Page Routes */}
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register/customer" element={<RegisterCustomer />} />
        <Route path="/register/producer" element={<RegisterProducer />} />
        <Route path="/producer" element={<ProducerDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;