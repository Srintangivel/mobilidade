// Curated real São Paulo addresses and landmarks used by the search autocomplete.

export interface Place {
  id: string;
  name: string;
  address: string;
  kind: "landmark" | "station" | "park" | "street" | "venue" | "shopping";
  lat: number;
  lng: number;
}

export const SP_CENTER: [number, number] = [-23.5505, -46.6333];

export const PLACES: Place[] = [
  { id: "se", name: "Praça da Sé", address: "Praça da Sé, Sé, Centro", kind: "landmark", lat: -23.5503, lng: -46.6339 },
  { id: "masp", name: "MASP", address: "Av. Paulista, 1578 – Bela Vista", kind: "venue", lat: -23.5614, lng: -46.6559 },
  { id: "paulista-consolacao", name: "Av. Paulista x R. da Consolação", address: "Av. Paulista – Consolação", kind: "street", lat: -23.5577, lng: -46.6608 },
  { id: "ibirapuera", name: "Parque Ibirapuera", address: "Av. Pedro Álvares Cabral – Vila Mariana", kind: "park", lat: -23.5874, lng: -46.6576 },
  { id: "mercadao", name: "Mercado Municipal (Mercadão)", address: "R. da Cantareira, 306 – Centro", kind: "landmark", lat: -23.5417, lng: -46.6297 },
  { id: "copan", name: "Edifício Copan", address: "Av. Ipiranga, 200 – República", kind: "landmark", lat: -23.5465, lng: -46.6444 },
  { id: "municipal", name: "Theatro Municipal", address: "Praça Ramos de Azevedo – República", kind: "venue", lat: -23.5452, lng: -46.6388 },
  { id: "luz", name: "Estação da Luz", address: "Praça da Luz, 1 – Luz", kind: "station", lat: -23.5347, lng: -46.6355 },
  { id: "pinacoteca", name: "Pinacoteca de São Paulo", address: "Praça da Luz, 2 – Luz", kind: "venue", lat: -23.5342, lng: -46.6339 },
  { id: "liberdade", name: "Bairro da Liberdade", address: "Praça da Liberdade – Liberdade", kind: "landmark", lat: -23.5557, lng: -46.6355 },
  { id: "beco-batman", name: "Beco do Batman", address: "R. Gonçalo Afonso – Vila Madalena", kind: "landmark", lat: -23.5563, lng: -46.6878 },
  { id: "vila-madalena", name: "Estação Vila Madalena", address: "R. Heitor Penteado – Vila Madalena", kind: "station", lat: -23.5465, lng: -46.6913 },
  { id: "pinheiros", name: "Largo da Batata", address: "Av. Brig. Faria Lima – Pinheiros", kind: "street", lat: -23.5672, lng: -46.6936 },
  { id: "faria-lima", name: "Av. Brig. Faria Lima, 3477", address: "Itaim Bibi", kind: "street", lat: -23.5868, lng: -46.6825 },
  { id: "estaiada", name: "Ponte Estaiada", address: "Ponte Octávio Frias de Oliveira – Brooklin", kind: "landmark", lat: -23.6106, lng: -46.6972 },
  { id: "berrini", name: "Av. Eng. Luís Carlos Berrini", address: "Cidade Monções – Brooklin", kind: "street", lat: -23.6057, lng: -46.6939 },
  { id: "congonhas", name: "Aeroporto de Congonhas", address: "Av. Washington Luís – Vila Congonhas", kind: "station", lat: -23.6261, lng: -46.6564 },
  { id: "allianz", name: "Allianz Parque", address: "Av. Francisco Matarazzo, 1705 – Água Branca", kind: "venue", lat: -23.5275, lng: -46.6784 },
  { id: "morumbi-stadium", name: "Estádio do Morumbi", address: "Praça Roberto Gomes Pedrosa – Morumbi", kind: "venue", lat: -23.6, lng: -46.7203 },
  { id: "pacaembu", name: "Estádio do Pacaembu", address: "Praça Charles Miller – Pacaembu", kind: "venue", lat: -23.5475, lng: -46.6651 },
  { id: "neo-quimica", name: "Neo Química Arena", address: "Av. Miguel Ignácio Curi, 111 – Itaquera", kind: "venue", lat: -23.5453, lng: -46.4742 },
  { id: "usp", name: "Cidade Universitária (USP)", address: "Butantã", kind: "landmark", lat: -23.5613, lng: -46.7307 },
  { id: "butanta", name: "Instituto Butantan", address: "Av. Vital Brasil, 1500 – Butantã", kind: "venue", lat: -23.5672, lng: -46.7187 },
  { id: "villa-lobos", name: "Parque Villa-Lobos", address: "Av. Prof. Fonseca Rodrigues – Alto de Pinheiros", kind: "park", lat: -23.5465, lng: -46.7224 },
  { id: "aclimacao", name: "Parque da Aclimação", address: "R. Muniz de Souza – Aclimação", kind: "park", lat: -23.5726, lng: -46.6292 },
  { id: "augusta", name: "Rua Augusta", address: "R. Augusta – Consolação", kind: "street", lat: -23.5531, lng: -46.6538 },
  { id: "oscar-freire", name: "Rua Oscar Freire", address: "Jardins", kind: "street", lat: -23.5647, lng: -46.6702 },
  { id: "shopping-iguatemi", name: "Shopping Iguatemi", address: "Av. Brig. Faria Lima, 2232 – Jardim Paulistano", kind: "shopping", lat: -23.5776, lng: -46.6875 },
  { id: "eldorado", name: "Shopping Eldorado", address: "Av. Rebouças, 3970 – Pinheiros", kind: "shopping", lat: -23.5729, lng: -46.6963 },
  { id: "morumbi-shopping", name: "Morumbi Shopping", address: "Av. Roque Petroni Júnior, 1089 – Brooklin", kind: "shopping", lat: -23.6227, lng: -46.6988 },
  { id: "tatuape", name: "Estação Tatuapé", address: "R. Melo Freire – Tatuapé", kind: "station", lat: -23.5403, lng: -46.5763 },
  { id: "barra-funda", name: "Terminal Barra Funda", address: "Av. Auro Soares de Moura Andrade – Barra Funda", kind: "station", lat: -23.5254, lng: -46.6676 },
  { id: "tiete", name: "Terminal Rodoviário Tietê", address: "Av. Cruzeiro do Sul, 1800 – Santana", kind: "station", lat: -23.5163, lng: -46.6252 },
  { id: "santana", name: "Estação Santana", address: "Av. Cruzeiro do Sul – Santana", kind: "station", lat: -23.5025, lng: -46.6245 },
  { id: "jabaquara", name: "Terminal Jabaquara", address: "R. dos Jequitibás – Jabaquara", kind: "station", lat: -23.6466, lng: -46.6413 },
  { id: "paraiso", name: "Estação Paraíso", address: "R. Vergueiro – Paraíso", kind: "station", lat: -23.5762, lng: -46.6406 },
  { id: "vila-mariana", name: "Estação Vila Mariana", address: "R. Domingos de Morais – Vila Mariana", kind: "station", lat: -23.5893, lng: -46.6347 },
  { id: "moema", name: "Av. Ibirapuera, 3103", address: "Moema", kind: "street", lat: -23.6097, lng: -46.6668 },
  { id: "jardim-botanico", name: "Jardim Botânico", address: "Av. Miguel Stéfano, 3031 – Água Funda", kind: "park", lat: -23.6411, lng: -46.6236 },
  { id: "bom-retiro", name: "Rua José Paulino", address: "Bom Retiro", kind: "street", lat: -23.5281, lng: -46.6408 },
  { id: "brás", name: "Estação Brás", address: "Praça Agente Cícero – Brás", kind: "station", lat: -23.5465, lng: -46.6164 },
  { id: "mooca", name: "Rua da Mooca", address: "Mooca", kind: "street", lat: -23.5579, lng: -46.5994 },
  { id: "sesc-pompeia", name: "Sesc Pompeia", address: "R. Clélia, 93 – Pompeia", kind: "venue", lat: -23.5256, lng: -46.6834 },
  { id: "minhocao", name: "Minhocão (Elevado João Goulart)", address: "Santa Cecília", kind: "street", lat: -23.5378, lng: -46.6519 },
];

export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function searchPlaces(query: string, limit = 6): Place[] {
  const q = normalize(query);
  if (!q) return PLACES.slice(0, limit);
  const terms = q.split(/\s+/);
  return PLACES.map((p) => {
    const hay = normalize(`${p.name} ${p.address}`);
    const name = normalize(p.name);
    if (!terms.every((t) => hay.includes(t))) return null;
    const score = name.startsWith(q) ? 0 : name.includes(q) ? 1 : 2;
    return { p, score };
  })
    .filter((x): x is { p: Place; score: number } => x !== null)
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((x) => x.p);
}

export const KIND_LABEL: Record<Place["kind"], string> = {
  landmark: "Ponto turístico",
  station: "Estação / Terminal",
  park: "Parque",
  street: "Endereço",
  venue: "Cultura & lazer",
  shopping: "Shopping",
};
