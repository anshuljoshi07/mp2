import axios from 'axios'

export interface PokemonStat {
  name: string
  value: number
}

export interface Pokemon {
  id: number
  name: string
  types: string[]
  sprite: string
  height: number
  weight: number
  stats: PokemonStat[]
}

interface PokemonListResponse {
  results: Array<{ name: string; url: string }>
}

interface PokemonApiResponse {
  id: number
  name: string
  height: number
  weight: number
  types: Array<{ type: { name: string } }>
  sprites: {
    other?: { 'official-artwork'?: { front_default?: string | null } }
    front_default?: string | null
  }
  stats: Array<{ base_stat: number; stat: { name: string } }>
}

const api = axios.create({ baseURL: 'https://pokeapi.co/api/v2', timeout: 15000 })
const detailRequests = new Map<number, Promise<Pokemon>>()
const artworkUrl = (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`

const mockEntries: Array<[number, string, string[]]> = [
  [1, 'bulbasaur', ['grass', 'poison']],
  [4, 'charmander', ['fire']],
  [7, 'squirtle', ['water']],
  [25, 'pikachu', ['electric']],
  [39, 'jigglypuff', ['normal', 'fairy']],
  [54, 'psyduck', ['water']],
  [58, 'growlithe', ['fire']],
  [74, 'geodude', ['rock', 'ground']],
  [94, 'gengar', ['ghost', 'poison']],
  [133, 'eevee', ['normal']],
  [143, 'snorlax', ['normal']],
  [150, 'mewtwo', ['psychic']],
]

function normalizePokemon(data: PokemonApiResponse): Pokemon {
  return {
    id: data.id,
    name: data.name,
    types: data.types.map(({ type }) => type.name),
    sprite: data.sprites.other?.['official-artwork']?.front_default ?? data.sprites.front_default ?? '',
    height: data.height,
    weight: data.weight,
    stats: data.stats.map(({ base_stat, stat }) => ({ name: stat.name, value: base_stat })),
  }
}

function fetchPokemonDetail(name: string, id: number): Promise<Pokemon> {
  const cached = detailRequests.get(id)
  if (cached) return cached

  const request = api.get<PokemonApiResponse>(`/pokemon/${name}`).then(({ data }) => normalizePokemon(data))
  detailRequests.set(id, request)
  void request.catch(() => detailRequests.delete(id))
  return request
}

function createBasicPokemon(name: string, id: number): Pokemon {
  return {
    id,
    name,
    types: ['unknown'],
    sprite: artworkUrl(id),
    height: 0,
    weight: 0,
    stats: [],
  }
}

export async function fetchPokemonCollection(onProgress?: (loaded: number, total: number) => void): Promise<Pokemon[]> {
  const { data } = await api.get<PokemonListResponse>('/pokemon?limit=151&offset=0')
  const results = new Array<Pokemon>(data.results.length)
  let nextIndex = 0
  let loaded = 0

  const worker = async () => {
    while (nextIndex < data.results.length) {
      const index = nextIndex
      nextIndex += 1
      const entry = data.results[index]
      const id = Number(entry.url.match(/\/pokemon\/(\d+)\/?$/)?.[1])

      try {
        results[index] = await fetchPokemonDetail(entry.name, id)
      } catch {
        results[index] = createBasicPokemon(entry.name, id)
      }

      loaded += 1
      onProgress?.(loaded, data.results.length)
    }
  }

  await Promise.all(Array.from({ length: Math.min(8, data.results.length) }, () => worker()))
  return results.sort((first, second) => first.id - second.id)
}

export function getMockPokemon(): Pokemon[] {
  return mockEntries.map(([id, name, types]) => ({
    id,
    name,
    types,
    sprite: artworkUrl(id),
    height: 6 + (id % 15),
    weight: 45 + (id % 180),
    stats: [
      { name: 'hp', value: 35 + (id % 60) },
      { name: 'attack', value: 40 + (id % 75) },
      { name: 'defense', value: 35 + (id % 65) },
      { name: 'special-attack', value: 45 + (id % 80) },
      { name: 'special-defense', value: 45 + (id % 70) },
      { name: 'speed', value: 30 + (id % 95) },
    ],
  }))
}