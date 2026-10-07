import { useEffect, useState } from 'react'
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom'
import PokemonArtwork from './components/PokemonArtwork'
import {
  fetchPokemonCollection,
  getMockPokemon,
  type Pokemon,
} from './services/pokemonApi'
import './App.css'

type CollectionStatus = 'loading' | 'ready'
type ViewMode = 'gallery' | 'list'

function usePokemonCollection() {
  const [pokemon, setPokemon] = useState<Pokemon[]>([])
  const [status, setStatus] = useState<CollectionStatus>('loading')
  const [isUsingMockData, setIsUsingMockData] = useState(false)
  const [notice, setNotice] = useState('')
  const [progress, setProgress] = useState(0)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let isCurrent = true

    void fetchPokemonCollection((loaded, total) => {
      if (isCurrent) setProgress(Math.round((loaded / total) * 100))
    })
      .then((results) => {
        if (!isCurrent) return
        if (results.length === 0) throw new Error('The collection was empty.')
        setPokemon(results)
        setIsUsingMockData(false)
        setStatus('ready')
      })
      .catch(() => {
        if (!isCurrent) return
        setPokemon(getMockPokemon())
        setIsUsingMockData(true)
        setNotice('PokeAPI is unavailable. Showing a local field collection instead.')
        setStatus('ready')
      })

    return () => {
      isCurrent = false
    }
  }, [attempt])

  return {
    pokemon,
    status,
    isUsingMockData,
    notice,
    progress,
    retry: () => {
      setStatus('loading')
      setProgress(0)
      setNotice('')
      setAttempt((current) => current + 1)
    },
  }
}

function App() {
  const collection = usePokemonCollection()

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div className="app-shell">
        <header className="site-header">
          <Link className="brand" to="/" aria-label="Pokédex home">
            <span className="brand-mark" aria-hidden="true"><span /></span>
            <span className="brand-name">Pokédex</span>
            <span className="brand-edition">Kanto collection</span>
          </Link>
          <div className="header-meta">
            <span className={`connection-dot ${collection.isUsingMockData ? 'is-offline' : ''}`} />
            <span>{collection.isUsingMockData ? 'Offline collection' : 'Live PokéAPI data'}</span>
            <span className="header-divider" />
            <span>First 151</span>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Explorer {...collection} />} />
          <Route path="/pokemon/:name" element={<PokemonDetail {...collection} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <footer className="site-footer">
          <span>Happy exploring!</span>
          <span>Data from <a href="https://pokeapi.co/" target="_blank" rel="noreferrer">PokéAPI</a></span>
        </footer>
      </div>
    </BrowserRouter>
  )
}

interface CollectionProps {
  pokemon: Pokemon[]
  status: CollectionStatus
  isUsingMockData: boolean
  notice: string
  progress: number
  retry: () => void
}

function Explorer({ pokemon, status, isUsingMockData, notice, progress, retry }: CollectionProps) {
  const [view, setView] = useState<ViewMode>('gallery')
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<'id' | 'name'>('id')
  const [ascending, setAscending] = useState(true)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])

  const availableTypes = Array.from(new Set(pokemon.flatMap((item) => item.types))).sort()
  const normalizedQuery = query.trim().toLowerCase()
  const visiblePokemon = pokemon
    .filter((item) => item.name.includes(normalizedQuery))
    .filter((item) => selectedTypes.length === 0 || selectedTypes.some((type) => item.types.includes(type)))
    .sort((first, second) => {
      const result = sortBy === 'name'
        ? first.name.localeCompare(second.name)
        : first.id - second.id
      return ascending ? result : -result
    })

  const toggleType = (type: string) => {
    setSelectedTypes((current) => current.includes(type)
      ? current.filter((selected) => selected !== type)
      : [...current, type])
  }

  return (
    <main className="page-content">
      <section className="intro-row">
        <div>
          <p className="eyebrow"><span className="eyebrow-mark">01</span> Kanto Pokédex</p>
          <h1>Meet the Pokémon<br /><em>of Kanto!</em></h1>
        </div>
        <p className="intro-note">The first 151 are here.<br />Search by name or pick a type to explore.</p>
      </section>

      {notice && (
        <div className="notice-banner" role="status">
          <span>{notice}</span>
          <button type="button" onClick={retry}>Try again <span aria-hidden="true">↗</span></button>
        </div>
      )}

      {status === 'loading' ? (
        <section className="loading-panel" aria-live="polite">
          <div className="loading-symbol" aria-hidden="true"><span /></div>
          <p className="eyebrow">One moment!</p>
          <h2>Loading your Pokédex</h2>
          <p>We're gathering details for the Kanto Pokémon.</p>
          <progress className="collection-progress" max={100} value={progress} aria-label="Collection load progress" />
          <span className="progress-caption">{progress}% loaded</span>
        </section>
      ) : (
        <div className="catalog-layout">
          <aside className="filter-rail">
            <div className="rail-heading">
              <span className="eyebrow">Explore</span>
              <span className="rail-index">001—151</span>
            </div>
            <label className="search-label" htmlFor="pokemon-search">Search Pokémon</label>
            <div className="search-control">
              <span aria-hidden="true">⌕</span>
              <input
                id="pokemon-search"
                type="search"
                placeholder="Try Pikachu"
                value={query}
                onChange={(event) => setQuery(event.target.value.toLowerCase())}
              />
            </div>

            <div className="filter-heading">
              <span>Choose types</span>
              {selectedTypes.length > 0 && (
                <button type="button" onClick={() => setSelectedTypes([])}>Clear</button>
              )}
            </div>
            <div className="type-filter-list">
              {availableTypes.map((type) => (
                <label className="type-option" key={type}>
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => toggleType(type)}
                  />
                  <span className={`type-dot type-${type}`} />
                  <span>{type}</span>
                  <span className="type-check" aria-hidden="true">✓</span>
                </label>
              ))}
            </div>

            <div className="rail-footnote">
              <span className="rail-rule" />
              <p>Pick more than one to see Pokémon with either type.</p>
            </div>
          </aside>

          <section className="results-area" aria-label="Pokémon collection">
            <div className="results-toolbar">
              <div className="view-switch" role="tablist" aria-label="Collection view">
                <button
                  type="button"
                  role="tab"
                  aria-selected={view === 'gallery'}
                  className={view === 'gallery' ? 'is-active' : ''}
                  onClick={() => setView('gallery')}
                >
                  <span className="grid-glyph" aria-hidden="true">▦</span> Gallery
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={view === 'list'}
                  className={view === 'list' ? 'is-active' : ''}
                  onClick={() => setView('list')}
                >
                  <span className="list-glyph" aria-hidden="true">☰</span> List
                </button>
              </div>
              <div className="sort-controls">
                <label htmlFor="sort-select">Sort by</label>
                <select id="sort-select" value={sortBy} onChange={(event) => setSortBy(event.target.value as 'id' | 'name')}>
                  <option value="id">Number</option>
                  <option value="name">Name</option>
                </select>
                <button
                  type="button"
                  className="direction-button"
                  aria-label={`Sort ${ascending ? 'descending' : 'ascending'}`}
                  title={`Sort ${ascending ? 'descending' : 'ascending'}`}
                  onClick={() => setAscending((current) => !current)}
                >
                  {ascending ? '↑' : '↓'}
                </button>
              </div>
            </div>

            <div className="results-caption">
              <span>{visiblePokemon.length} Pokémon</span>
              <span>{selectedTypes.length ? `${selectedTypes.length} type${selectedTypes.length === 1 ? '' : 's'} selected` : 'All types'}</span>
            </div>

            {visiblePokemon.length === 0 ? (
              <div className="empty-state">
                <span className="empty-number">—</span>
                <h2>No Pokémon found</h2>
                <p>Try another name or clear a type filter.</p>
                <button type="button" onClick={() => { setQuery(''); setSelectedTypes([]) }}>Clear search</button>
              </div>
            ) : view === 'gallery' ? (
              <div className="pokemon-grid">
                {visiblePokemon.map((item) => <PokemonCard pokemon={item} key={item.id} />)}
              </div>
            ) : (
              <div className="pokemon-list">
                {visiblePokemon.map((item) => <PokemonRow pokemon={item} key={item.id} />)}
              </div>
            )}

            <div className="results-footer">
              <span>{isUsingMockData ? 'Showing sample Pokémon' : 'Pokémon from PokéAPI'}</span>
              <span>Showing {visiblePokemon.length} of {pokemon.length}</span>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

function PokemonCard({ pokemon }: { pokemon: Pokemon }) {
  return (
    <Link className="pokemon-card" to={`/pokemon/${pokemon.name}`}>
      <div className="card-topline">
        <span>#{String(pokemon.id).padStart(3, '0')}</span>
        <span className="card-arrow" aria-hidden="true">↗</span>
      </div>
      <div className="card-art"><PokemonArtwork pokemon={pokemon} /></div>
      <div className="card-caption">
        <h2>{pokemon.name}</h2>
        <div className="type-tags">
          {pokemon.types.map((type) => <span className={`type-tag type-${type}`} key={type}>{type}</span>)}
        </div>
      </div>
    </Link>
  )
}

function PokemonRow({ pokemon }: { pokemon: Pokemon }) {
  return (
    <Link className="pokemon-row" to={`/pokemon/${pokemon.name}`}>
      <span className="row-number">{String(pokemon.id).padStart(3, '0')}</span>
      <span className="row-art"><PokemonArtwork pokemon={pokemon} /></span>
      <span className="row-name">{pokemon.name}</span>
      <span className="type-tags">
        {pokemon.types.map((type) => <span className={`type-tag type-${type}`} key={type}>{type}</span>)}
      </span>
      <span className="row-arrow" aria-hidden="true">↗</span>
    </Link>
  )
}

function PokemonDetail({ pokemon, status, isUsingMockData }: CollectionProps) {
  const { name = '' } = useParams()
  const navigate = useNavigate()
  const selectedPokemon = pokemon.find((item) => item.name === name)

  if (!selectedPokemon) {
    return (
      <main className="detail-page page-content">
        <Link to="/" className="back-link">← All Pokémon</Link>
        <section className="detail-message" aria-live="polite">
          <p className="eyebrow">{status === 'loading' ? 'Loading your Pokédex' : 'Pokémon not found'}</p>
          <h1>{status === 'loading' ? 'Finding this Pokémon...' : 'No record in this field guide.'}</h1>
          <p>{status === 'loading' ? 'Just a moment while the collection loads.' : 'Head back to the Pokédex and choose another Pokémon.'}</p>
        </section>
      </main>
    )
  }

  const currentIndex = pokemon.findIndex((item) => item.id === selectedPokemon.id)
  const previousPokemon = pokemon[(currentIndex - 1 + pokemon.length) % pokemon.length]
  const nextPokemon = pokemon[(currentIndex + 1) % pokemon.length]
  const displayName = selectedPokemon.name.charAt(0).toUpperCase() + selectedPokemon.name.slice(1)
  const typeDescription = selectedPokemon.types.length > 1
    ? `a Pokémon with ${selectedPokemon.types.join(' and ')} types`
    : `${/^[aeiou]/i.test(selectedPokemon.types[0]) ? 'an' : 'a'} ${selectedPokemon.types[0]}-type Pokémon`

  return (
    <main className="detail-page page-content">
      <div className="detail-topline">
        <Link to="/" className="back-link">← All Pokémon</Link>
        <span className="detail-source">{isUsingMockData ? 'Sample data' : 'Live PokéAPI data'}</span>
      </div>

      <section className="detail-hero">
        <div className="detail-art-panel">
          <div className="detail-art-index">Kanto Pokédex #{String(selectedPokemon.id).padStart(3, '0')}</div>
          <PokemonArtwork pokemon={selectedPokemon} />
          <span className="art-orbit art-orbit-one" aria-hidden="true" />
          <span className="art-orbit art-orbit-two" aria-hidden="true" />
          <span className="art-caption">Pokédex entry</span>
        </div>
        <div className="detail-copy">
          <p className="eyebrow"><span className="eyebrow-mark">#{String(selectedPokemon.id).padStart(3, '0')}</span> Kanto Pokédex</p>
          <h1>{selectedPokemon.name}</h1>
          <div className="detail-types">
            {selectedPokemon.types.map((type) => <span className={`type-tag type-${type}`} key={type}>{type}</span>)}
          </div>
          <p className="detail-deck">Meet {displayName}, {typeDescription}.</p>
          <div className="measurements">
            <div><span>Height</span><strong>{(selectedPokemon.height / 10).toFixed(1)} <small>m</small></strong></div>
            <div><span>Weight</span><strong>{(selectedPokemon.weight / 10).toFixed(1)} <small>kg</small></strong></div>
            <div><span>Pokédex no.</span><strong>#{String(selectedPokemon.id).padStart(3, '0')}</strong></div>
          </div>
        </div>
      </section>

      <section className="detail-lower">
        <div className="stats-section">
          <div className="section-heading">
            <div><p className="eyebrow">A few numbers</p><h2>Base stats</h2></div>
            <span>Out of 255</span>
          </div>
          <div className="stat-list">
            {selectedPokemon.stats.map((stat) => (
              <div className="stat-row" key={stat.name}>
                <span className="stat-name">{stat.name.replace('-', ' ')}</span>
                <progress max={255} value={stat.value} aria-label={`${stat.name} ${stat.value}`} />
                <strong>{String(stat.value).padStart(3, '0')}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="navigation-section">
          <p className="eyebrow">Keep exploring</p>
          <h2>Meet another Pokémon</h2>
          <div className="detail-navigation">
            <button type="button" onClick={() => navigate(`/pokemon/${previousPokemon.name}`)} aria-label={`Previous Pokémon: ${previousPokemon.name}`}>
              <span aria-hidden="true">←</span><span><small>Previous</small>{previousPokemon.name}</span>
            </button>
            <button type="button" onClick={() => navigate(`/pokemon/${nextPokemon.name}`)} aria-label={`Next Pokémon: ${nextPokemon.name}`}>
              <span><small>Next</small>{nextPokemon.name}</span><span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
