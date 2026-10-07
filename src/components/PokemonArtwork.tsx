import { useState } from 'react'
import type { Pokemon } from '../services/pokemonApi'

interface PokemonArtworkProps {
  pokemon: Pokemon
}

function PokemonArtwork({ pokemon }: PokemonArtworkProps) {
  const [failedSource, setFailedSource] = useState('')
  const hasImageError = failedSource === pokemon.sprite

  if (!pokemon.sprite || hasImageError) {
    return (
      <div className="artwork-fallback" role="img" aria-label={`Artwork unavailable for ${pokemon.name}`}>
        <span>{String(pokemon.id).padStart(3, '0')}</span>
        <small>NO IMAGE</small>
      </div>
    )
  }

  return (
    <img
      src={pokemon.sprite}
      alt={pokemon.name}
      loading="lazy"
      decoding="async"
      onError={() => setFailedSource(pokemon.sprite)}
    />
  )
}

export default PokemonArtwork