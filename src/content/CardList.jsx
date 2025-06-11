import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import './css/CardList.css'

function CardList() {
   const [search, setSearch] = useState('')
   const [filtered, setFiltered] = useState([])
   const [pokemonList, setPokemonList] = useState([])
   const [evolutionSteps, setEvolutionSteps] = useState({})
   const [disabledCards, setDisabledCards] = useState([]) // 비활성화 카드 id 배열
   const [checked, setChecked] = useState({}) // 체크박스 상태
   const clickTimer = useRef(null)

   // 포켓몬 리스트 불러오기 (1~5세대 555마리)
   useEffect(() => {
      const fetchPokemons = async () => {
         const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=555')
         const data = await res.json()
         // 포켓몬 상세 정보
         const details = await Promise.all(
            data.results.map(async (pokemon) => {
               const pokeRes = await fetch(pokemon.url)
               const pokeData = await pokeRes.json()
               // 한글 이름 추출
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

   const handleAdd = useCallback(() => {
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
   }, [pokemonList, search, filtered])

   // 체크박스 상태 변경
   const handleCheck = useCallback((id) => {
      setChecked((prev) => {
         const checkedNow = !prev[id]
         setDisabledCards((prevDisabled) => (checkedNow ? [...prevDisabled, id] : prevDisabled.filter((d) => d !== id)))
         return {
            ...prev,
            [id]: checkedNow,
         }
      })
   }, [])

   // 체크된 카드 삭제
   const handleDeleteChecked = useCallback(() => {
      const idsToDelete = Object.keys(checked)
         .filter((id) => checked[id])
         .map(Number)
      setFiltered((prev) => prev.filter((pokemon) => !idsToDelete.includes(pokemon.id)))
      setEvolutionSteps((prev) => {
         const copy = { ...prev }
         idsToDelete.forEach((id) => delete copy[id])
         return copy
      })
      setChecked((prev) => {
         const copy = { ...prev }
         idsToDelete.forEach((id) => delete copy[id])
         return copy
      })
      setDisabledCards((prev) => prev.filter((id) => !idsToDelete.includes(id)))
   }, [checked])

   // 진화
   const handleCardClick = useCallback(
      async (pokemon) => {
         if (checked[pokemon.id]) return
         if (disabledCards.includes(pokemon.id)) return

         if (clickTimer.current) clearTimeout(clickTimer.current)
         clickTimer.current = setTimeout(async () => {
            let evoData = evolutionSteps[pokemon.id]
            if (!evoData) {
               const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemon.id}`)
               const speciesData = await speciesRes.json()
               const evoUrl = speciesData.evolution_chain.url
               const evoRes = await fetch(evoUrl)
               const evoChainData = await evoRes.json()
               let evo = evoChainData.chain
               const evoNames = []
               // 진화 시 한글이름 설정
               while (evo) {
                  evoNames.push(evo.species.name)
                  evo = evo.evolves_to && evo.evolves_to[0]
               }
               const evoInfos = await Promise.all(
                  evoNames.map(async (name) => {
                     const pokeRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`)
                     const pokeData = await pokeRes.json()
                     const speciesRes = await fetch(pokeData.species.url)
                     const speciesData = await speciesRes.json()
                     const koreanNameObj = speciesData.names.find((n) => n.language.name === 'ko')
                     return {
                        id: pokeData.id,
                        name: pokeData.name,
                        koreanName: koreanNameObj ? koreanNameObj.name : pokeData.name,
                        image: pokeData.sprites.front_default,
                     }
                  })
               )
               evoData = { step: 0, chain: evoInfos }
            }
            let nextStep = evoData.step + 1
            if (nextStep >= evoData.chain.length) nextStep = 0
            setEvolutionSteps((prev) => ({
               ...prev,
               [pokemon.id]: { ...evoData, step: nextStep },
            }))
         }, 250)
      },
      [checked, disabledCards, evolutionSteps]
   )

   // 카드 더블클릭 시 비활성화/활성화 토글
   const handleDisable = useCallback((id) => {
      if (clickTimer.current) {
         clearTimeout(clickTimer.current)
         clickTimer.current = null
      }
      setDisabledCards((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]))
   }, [])

   const renderedList = useMemo(
      () =>
         filtered.map((pokemon) => {
            const evo = evolutionSteps[pokemon.id]
            const show = evo ? evo.chain[evo.step] : pokemon
            const isDisabled = disabledCards.includes(pokemon.id)
            return (
               <li
                  key={pokemon.id}
                  className="pokemon-item"
                  draggable={false}
                  onClick={() => handleCardClick(pokemon)}
                  onDoubleClick={() => handleDisable(pokemon.id)}
                  style={{
                     userSelect: 'none',
                     cursor: isDisabled ? 'not-allowed' : 'pointer',
                     opacity: isDisabled ? 0.5 : 1,
                     filter: isDisabled ? 'grayscale(100%)' : 'none',
                  }}
               >
                  <input type="checkbox" checked={!!checked[pokemon.id]} onChange={() => handleCheck(pokemon.id)} onClick={(e) => e.stopPropagation()} style={{ marginBottom: 8 }} />
                  <span className="pokemon-id">No.{show.id.toString().padStart(4, '0')}</span>
                  <img src={show.image} alt={show.koreanName} className="pokemon-img" draggable={false} />
                  <div className="pokemon-name">{show.koreanName}</div>
               </li>
            )
         }),
      [filtered, evolutionSteps, disabledCards, checked, handleCardClick, handleDisable, handleCheck]
   )

   return (
      <>
         <div className="wapper">
            <div className="input-box">
               <span className="icon-search">
                  <img src="https://www.pokemonkorea.co.kr/img/icon/icon_ball_b.png" alt="logo" />
               </span>
               <input
                  type="text"
                  placeholder="추가할 포켓몬을 입력하세요."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                     if (e.key === 'Enter') handleAdd()
                  }}
               />
               <button onClick={handleAdd}>추가</button>
               <button onClick={handleDeleteChecked}>삭제</button>
            </div>
            <div className="card-list">
               <ul className="pokemon-list">{renderedList}</ul>
            </div>
         </div>
      </>
   )
}

export default CardList
