import { useState } from 'react'
import { Navbar } from './components/Navbar.jsx'
import { HomePage } from './pages/HomePage.jsx'
import './styles/tokens.css'

export default function App() {
  const [lang, setLang] = useState('no')
  const toggleLang = () => setLang(l => l === 'no' ? 'en' : 'no')

  return (
    <>
      <Navbar lang={lang} onLangToggle={toggleLang} />
      <HomePage lang={lang} />
    </>
  )
}
