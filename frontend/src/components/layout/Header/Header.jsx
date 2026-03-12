import TopBar from './TopBar'
import NavBar from './NavBar'
import './header.css'

export default function Header() {
  return (
    <header className="header">
      <TopBar />
      <NavBar />
    </header>
  )
}