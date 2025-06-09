import { useState } from 'react'
import './content/css/app.css'
import CardList from './content/cardList'

// 포켓몬 도감

function App() {
   const [count, setCount] = useState(0)

   return <CardList />
}

export default App
