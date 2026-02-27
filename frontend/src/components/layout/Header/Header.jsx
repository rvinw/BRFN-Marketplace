import TopBar from "./TopBar";
import NavBar from "./NavBar";
import "./header.css";

export default function Header() {
    return(
        <header className="site-header">
            <TopBar></TopBar>
            <NavBar></NavBar>
        </header>

    );
}