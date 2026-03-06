import TopBar from "./TopBar";
import NavBar from "./NavBar";
import "./header.css";

export default function Header({ onNavigate }) { // <--- Did you add this?
  return (
    <header className="site-header">
      <TopBar />
      <NavBar onNavigate={onNavigate} /> {/* <--- And this? */}
    </header>
  );
}