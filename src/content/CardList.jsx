import { useState, useEffect } from 'react'
import { MdSearch } from 'react-icons/md'
import './css/CardList.css'

function CardList() {
   const [search, setSearch] = useState('')
   const [filtered, setFiltered] = useState([])
   const [pokemonList, setPokemonList] = useState([])

   // 포켓몬 리스트 불러오기 (처음 30마리 예시)
   useEffect(() => {
      const fetchPokemons = async () => {
         const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=151')
         const data = await res.json()
         // 각 포켓몬의 상세 정보(이름, 이미지, 한글명) 가져오기
         const details = await Promise.all(
            data.results.map(async (pokemon) => {
               const pokeRes = await fetch(pokemon.url)
               const pokeData = await pokeRes.json()
               // species에서 한글명 가져오기
               const speciesRes = await fetch(pokeData.species.url)
               const speciesData = await speciesRes.json()
               const koreanNameObj = speciesData.names.find((n) => n.language.name === 'ko')
               return {
                  id: pokeData.id,
                  name: pokeData.name,
                  koreanName: koreanNameObj ? koreanNameObj.name : pokeData.name,
                  image: pokeData.sprites.front_default,
                  // 타입
                  types: pokeData.types.map((type) => type.type.name),
               }
            })
         )
         setPokemonList(details)
      }
      fetchPokemons()
   }, [])

   const handleAdd = () => {
      const found = pokemonList.find((pokemon) => pokemon.koreanName.replace(/\s/g, '') === search.trim().replace(/\s/g, ''))
      if (found) {
         if (filtered.some((p) => p.id === found.id)) {
            alert('이미 존재하는 포켓몬입니다.')
         } else {
            setFiltered([...filtered, found])
            alert('포켓몬이 추가되었습니다.')
         }
      } else {
         alert('포켓몬을 찾을 수 없습니다.')
      }
      setSearch('')
   }

   const handleReset = () => {
      setSearch('')
      setFiltered([])
      alert('초기화되었습니다.')
   }

   return (
      <>
         <div className="wapper">
            <div className="input-box">
               <span className="icon-search">
                  <img src="https://www.pokemonkorea.co.kr/img/icon/icon_ball_b.png" />
               </span>
               <input type="text" placeholder="추가할 포켓몬을 입력하세요." value={search} onChange={(e) => setSearch(e.target.value)} />
               <button onClick={handleAdd}>추가</button>
            </div>
            <div className="card-list">
               <ul className="pokemon-list">
                  {filtered.map((pokemon) => (
                     <li key={pokemon.id} className="pokemon-item">
                        <span className="pokemon-id">No.{pokemon.id.toString().padStart(4, '0')}</span>
                        <img src={pokemon.image} alt={pokemon.name} className="pokemon-img" />
                        <div className="pokemon-name">{pokemon.koreanName}</div>
                        <div>{pokemon.type}</div>
                     </li>
                  ))}
               </ul>
            </div>
         </div>
      </>
   )
}

export default CardList
