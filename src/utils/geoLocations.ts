/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import BRAZIL_MUNICIPALITIES_DATA from '../data/locationCoordinates.json';

export interface LatLng {
  lat: number;
  lng: number;
}

const BRAZIL_MUNICIPALITIES = BRAZIL_MUNICIPALITIES_DATA as Record<string, LatLng>;

// Centroids for all 27 Brazilian federative units for guaranteed geocoding
const STATE_CENTROIDS: Record<string, LatLng> = {
  'AC': { lat: -9.97499, lng: -67.8243 },
  'AL': { lat: -9.5713, lng: -36.782 },
  'AP': { lat: 0.902, lng: -52.003 },
  'AM': { lat: -3.4168, lng: -65.8561 },
  'BA': { lat: -12.5797, lng: -41.7007 },
  'CE': { lat: -5.4984, lng: -39.3206 },
  'DF': { lat: -15.7998, lng: -47.8645 },
  'ES': { lat: -19.1834, lng: -40.3089 },
  'GO': { lat: -15.827, lng: -49.8362 },
  'MA': { lat: -5.42, lng: -45.44 },
  'MT': { lat: -12.6819, lng: -56.9211 },
  'MS': { lat: -20.7722, lng: -54.7852 },
  'MG': { lat: -18.5122, lng: -44.555 },
  'PA': { lat: -3.4168, lng: -52.003 },
  'PB': { lat: -7.24, lng: -36.78 },
  'PR': { lat: -24.89, lng: -51.55 },
  'PE': { lat: -8.8137, lng: -36.9541 },
  'PI': { lat: -7.7183, lng: -42.7289 },
  'RJ': { lat: -22.9068, lng: -43.1729 },
  'RN': { lat: -5.7945, lng: -36.56 },
  'RS': { lat: -30.0346, lng: -51.2177 },
  'RO': { lat: -11.5057, lng: -63.5806 },
  'RR': { lat: 2.7376, lng: -62.0751 },
  'SC': { lat: -27.2423, lng: -50.2189 },
  'SP': { lat: -23.5505, lng: -46.6333 },
  'SE': { lat: -10.5741, lng: -37.3857 },
  'TO': { lat: -10.1753, lng: -48.2982 }
};

// Base Matriz da Empresa em Santos (Chico de Paula)
export const COMPANY_BASE_SANTOS: LatLng = {
  lat: -23.93298,
  lng: -46.37083
};
export const COMPANY_BASE_ADDRESS = 'R. Dr. Zelnor Paiva Magalhães, 201 - Chico de Paula, Santos - SP, 11090-040';
export const COMPANY_BASE_NAME = 'Base Santos (Chico de Paula)';

// Master coordinates dictionary for logistics hubs, port terminals, and Brazilian industrial cities
export const COMPREHENSIVE_LOCATIONS: Record<string, LatLng> = {
  // Baixada Santista & Port Terminals
  'SANTOS': COMPANY_BASE_SANTOS,
  'SANTOS - SP': COMPANY_BASE_SANTOS,
  'SANTOS/SP': COMPANY_BASE_SANTOS,
  'CHICO DE PAULA': COMPANY_BASE_SANTOS,
  'CHICO DE PAULA - SANTOS': COMPANY_BASE_SANTOS,
  'BASE': COMPANY_BASE_SANTOS,
  'BASE SANTOS': COMPANY_BASE_SANTOS,
  'MATRIZ': COMPANY_BASE_SANTOS,
  'PATIO CENTRAL': COMPANY_BASE_SANTOS,
  'PÁTIO CENTRAL': COMPANY_BASE_SANTOS,
  'PATIO MATRIZ': COMPANY_BASE_SANTOS,
  'PÁTIO MATRIZ': COMPANY_BASE_SANTOS,
  'OFICINA CENTRAL': { lat: -23.9350, lng: -46.3680 },
  'OFICINA': { lat: -23.9350, lng: -46.3680 },
  'ALEMOA': { lat: -23.9330, lng: -46.3720 },
  'SABOO': { lat: -23.9380, lng: -46.3450 },
  'PORTO DE SANTOS': { lat: -23.9550, lng: -46.3150 },
  'TERMINAL MARITIMO': { lat: -23.9510, lng: -46.3210 },
  'CUBATAO': { lat: -23.8911, lng: -46.4253 },
  'CUBATAO - SP': { lat: -23.8911, lng: -46.4253 },
  'CUBATÃO - SP': { lat: -23.8911, lng: -46.4253 },
  'CUBATÃO': { lat: -23.8911, lng: -46.4253 },
  'GUARUJA': { lat: -23.9931, lng: -46.2564 },
  'GUARUJA - SP': { lat: -23.9931, lng: -46.2564 },
  'GUARUJÁ - SP': { lat: -23.9931, lng: -46.2564 },
  'GUARUJÁ': { lat: -23.9931, lng: -46.2564 },
  'SAO VICENTE': { lat: -23.9631, lng: -46.3919 },
  'SÃO VICENTE - SP': { lat: -23.9631, lng: -46.3919 },
  'PRAIA GRANDE - SP': { lat: -24.0058, lng: -46.4028 },

  // São Paulo Interior & Metropolitan
  'SAO PAULO': { lat: -23.5505, lng: -46.6333 },
  'SAO PAULO - SP': { lat: -23.5505, lng: -46.6333 },
  'SÃO PAULO - SP': { lat: -23.5505, lng: -46.6333 },
  'SÃO PAULO': { lat: -23.5505, lng: -46.6333 },
  'PAULINIA': { lat: -22.7617, lng: -47.1539 },
  'PAULINIA - SP': { lat: -22.7617, lng: -47.1539 },
  'PAULÍNIA - SP': { lat: -22.7617, lng: -47.1539 },
  'PAULÍNIA': { lat: -22.7617, lng: -47.1539 },
  'CAMPINAS': { lat: -22.9099, lng: -47.0626 },
  'CAMPINAS - SP': { lat: -22.9099, lng: -47.0626 },
  'SAO BERNARDO DO CAMPO - SP': { lat: -23.6944, lng: -46.5654 },
  'SANTO ANDRE - SP': { lat: -23.6536, lng: -46.5276 },
  'MAUA - SP': { lat: -23.6678, lng: -46.4614 },
  'BARUERI - SP': { lat: -23.5105, lng: -46.8761 },
  'GUARULHOS - SP': { lat: -23.4542, lng: -46.5333 },
  'SUZANO - SP': { lat: -23.5425, lng: -46.3108 },
  'SAO JOSE DOS CAMPOS': { lat: -23.2237, lng: -45.9009 },
  'SAO JOSE DOS CAMPOS - SP': { lat: -23.2237, lng: -45.9009 },
  'SÃO JOSÉ DOS CAMPOS - SP': { lat: -23.2237, lng: -45.9009 },
  'TAUBATE - SP': { lat: -23.0264, lng: -45.5553 },
  'JUNDIAI - SP': { lat: -23.1857, lng: -46.8978 },
  'SOROCABA - SP': { lat: -23.5015, lng: -47.4526 },
  'RIBEIRAO PRETO - SP': { lat: -21.1767, lng: -47.8208 },
  'SAO CARLOS - SP': { lat: -22.0175, lng: -47.8908 },
  'PIRACICABA - SP': { lat: -22.7253, lng: -47.6492 },
  'LIMEIRA - SP': { lat: -22.5647, lng: -47.4017 },
  'AMERICANA - SP': { lat: -22.7375, lng: -47.3331 },
  'SUMARE - SP': { lat: -22.8219, lng: -47.2669 },
  'SAO SEBASTIAO - SP': { lat: -23.7600, lng: -45.4097 },

  // Paraná & South Ports
  'PARANAGUA': { lat: -25.5161, lng: -48.5225 },
  'PARANAGUA - PR': { lat: -25.5161, lng: -48.5225 },
  'PARANAGUÁ - PR': { lat: -25.5161, lng: -48.5225 },
  'PARANAGUÁ': { lat: -25.5161, lng: -48.5225 },
  'CURITIBA': { lat: -25.4284, lng: -49.2733 },
  'CURITIBA - PR': { lat: -25.4284, lng: -49.2733 },
  'SAO JOSE DOS PINHAIS - PR': { lat: -25.5347, lng: -49.2064 },
  'ARAUCARIA - PR': { lat: -25.5925, lng: -49.4086 },
  'PONTA GROSSA - PR': { lat: -25.0994, lng: -50.1583 },
  'LONDRINA - PR': { lat: -23.3045, lng: -51.1696 },
  'MARINGA - PR': { lat: -23.4210, lng: -51.9331 },
  'CASCAVEL - PR': { lat: -24.9578, lng: -53.4595 },
  'FOZ DO IGUACU - PR': { lat: -25.5159, lng: -54.5857 },

  // Santa Catarina
  'ITAJAI': { lat: -26.9078, lng: -48.6619 },
  'ITAJAI - SC': { lat: -26.9078, lng: -48.6619 },
  'ITAJAÍ - SC': { lat: -26.9078, lng: -48.6619 },
  'ITAJAÍ': { lat: -26.9078, lng: -48.6619 },
  'NAVEGANTES - SC': { lat: -26.8967, lng: -48.6547 },
  'JOINVILLE - SC': { lat: -26.3044, lng: -48.8464 },
  'SAO FRANCISCO DO SUL - SC': { lat: -26.2425, lng: -48.6381 },
  'FLORIANOPOLIS - SC': { lat: -27.5954, lng: -48.5480 },
  'BLUMENAU - SC': { lat: -26.9194, lng: -49.0661 },
  'CRICIUMA - SC': { lat: -28.6775, lng: -49.3703 },

  // Rio Grande do Sul
  'PORTO ALEGRE - RS': { lat: -30.0346, lng: -51.2177 },
  'RIO GRANDE - RS': { lat: -32.0350, lng: -52.0986 },
  'CANOAS - RS': { lat: -29.9178, lng: -51.1836 },
  'CAXIAS DO SUL - RS': { lat: -29.1678, lng: -51.1794 },

  // Minas Gerais
  'BETIM': { lat: -19.9678, lng: -44.1983 },
  'BETIM - MG': { lat: -19.9678, lng: -44.1983 },
  'CONTAGEM - MG': { lat: -19.9317, lng: -44.0536 },
  'BELO HORIZONTE - MG': { lat: -19.9167, lng: -43.9345 },
  'UBERLANDIA - MG': { lat: -18.9186, lng: -48.2772 },
  'UBERABA - MG': { lat: -19.7472, lng: -47.9392 },
  'JUIZ DE FORA - MG': { lat: -21.7642, lng: -43.3497 },
  'POUSO ALEGRE - MG': { lat: -22.2300, lng: -45.9364 },

  // Rio de Janeiro
  'RIO DE JANEIRO': { lat: -22.9068, lng: -43.1729 },
  'RIO DE JANEIRO - RJ': { lat: -22.9068, lng: -43.1729 },
  'DUQUE DE CAXIAS': { lat: -22.7858, lng: -43.3117 },
  'DUQUE DE CAXIAS - RJ': { lat: -22.7858, lng: -43.3117 },
  'VOLTA REDONDA - RJ': { lat: -22.5231, lng: -44.1042 },
  'RESENDE - RJ': { lat: -22.4689, lng: -44.4467 },
  'MACAE - RJ': { lat: -22.3769, lng: -41.7869 },
  'MACAÉ - RJ': { lat: -22.3769, lng: -41.7869 },
  'ITAGUAI - RJ': { lat: -22.8681, lng: -43.7753 },

  // Espírito Santo & Bahia
  'VITORIA - ES': { lat: -20.3155, lng: -40.3128 },
  'SERRA - ES': { lat: -20.1286, lng: -40.3078 },
  'SALVADOR - BA': { lat: -12.9777, lng: -38.5016 },
  'CAMACARI - BA': { lat: -12.6975, lng: -38.3242 },
  'CANDEIAS - BA': { lat: -12.6733, lng: -38.5139 },
  'FEIRA DE SANTANA - BA': { lat: -12.2667, lng: -38.9667 },

  // Highways & Key Transport Hubs
  'RODOVIA BR-101': { lat: -23.9100, lng: -46.3100 },
  'RODOVIA BR-101 KM 240': { lat: -23.9100, lng: -46.3100 },
  'RODOVIA ANCHIETA': { lat: -23.8300, lng: -46.4800 },
  'RODOVIA DOS IMIGRANTES': { lat: -23.8500, lng: -46.5200 },
  'RODOVIA PRESIDENTE DUTRA': { lat: -22.7500, lng: -43.7000 },
  'RODOVIA REGIS BITTENCOURT': { lat: -24.4900, lng: -47.8400 }
};

// Clean location string (removes invalid, null or placeholder texts)
export function cleanLocationStr(loc: string | undefined | null): string {
  if (!loc) return '';
  const trimmed = loc.trim();
  const upper = trimmed.toUpperCase();
  if (
    !upper ||
    upper === 'N/A' ||
    upper === '-' ||
    upper === 'LOCAL NÃO CADASTRADO' ||
    upper === 'LOCAL NAO CADASTRADO' ||
    upper.includes('NÃO CADASTRADO') ||
    upper.includes('NAO CADASTRADO') ||
    upper.includes('NÃO INFORMADO') ||
    upper.includes('NAO INFORMADO')
  ) {
    return '';
  }
  return trimmed;
}

// Normalize a location string for key comparison
function normalizeLocKey(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^\w\s-]/g, '') // remove punctuation
    .trim()
    .toUpperCase();
}

/**
 * Resolves any freeform Brazilian location string to geographic coordinates.
 * Returns null if location is empty or unresolvable (never invents fake coordinates).
 */
export function resolveLocationCoordinates(rawLocation: string | undefined | null): LatLng | null {
  const cleaned = cleanLocationStr(rawLocation);
  
  if (!cleaned) {
    return null;
  }

  const upper = cleaned.toUpperCase().trim();
  const normalized = normalizeLocKey(cleaned);

  // 1. Direct match in Comprehensive Brazilian Municipalities dataset (10,870+ cities)
  if (BRAZIL_MUNICIPALITIES[upper]) {
    return BRAZIL_MUNICIPALITIES[upper];
  }
  if (BRAZIL_MUNICIPALITIES[cleaned]) {
    return BRAZIL_MUNICIPALITIES[cleaned];
  }

  // 2. Direct match in local hub directory
  if (COMPREHENSIVE_LOCATIONS[upper]) {
    return COMPREHENSIVE_LOCATIONS[upper];
  }
  if (COMPREHENSIVE_LOCATIONS[cleaned]) {
    return COMPREHENSIVE_LOCATIONS[cleaned];
  }
  if (COMPREHENSIVE_LOCATIONS[normalized]) {
    return COMPREHENSIVE_LOCATIONS[normalized];
  }

  // 3. Match without state prefix/suffix if present
  const cityOnly = upper.split(' - ')[0].split('/')[0].trim();
  if (BRAZIL_MUNICIPALITIES[cityOnly]) {
    return BRAZIL_MUNICIPALITIES[cityOnly];
  }

  // 4. Tokenized search across comprehensive dictionary
  for (const [key, coords] of Object.entries(COMPREHENSIVE_LOCATIONS)) {
    const normKey = normalizeLocKey(key);
    if (normalized === normKey || normalized.includes(normKey) || normKey.includes(normalized)) {
      return coords;
    }
  }

  // 5. Keyword heuristic search for common operations
  if (normalized.includes('OFICINA') || normalized.includes('MANUTENCAO')) {
    return COMPREHENSIVE_LOCATIONS['OFICINA CENTRAL'];
  }
  if (normalized.includes('PORTO') || normalized.includes('MARITIMO') || normalized.includes('TERMINAL')) {
    if (normalized.includes('PARANAGUA')) return COMPREHENSIVE_LOCATIONS['PARANAGUA - PR'];
    if (normalized.includes('ITAJAI')) return COMPREHENSIVE_LOCATIONS['ITAJAI - SC'];
    if (normalized.includes('RIO')) return COMPREHENSIVE_LOCATIONS['RIO DE JANEIRO - RJ'];
    return COMPREHENSIVE_LOCATIONS['PORTO DE SANTOS'];
  }
  if (normalized.includes('PATIO') || normalized.includes('MATRIZ')) {
    return COMPREHENSIVE_LOCATIONS['PATIO CENTRAL'];
  }
  if (normalized.includes('SANTOS') || normalized.includes('CHICO DE PAULA') || normalized.includes('ALEMOA')) {
    return COMPREHENSIVE_LOCATIONS['SANTOS - SP'];
  }
  if (normalized.includes('CUBATAO')) {
    return COMPREHENSIVE_LOCATIONS['CUBATAO - SP'];
  }
  if (normalized.includes('GUARUJA')) {
    return COMPREHENSIVE_LOCATIONS['GUARUJA - SP'];
  }
  if (normalized.includes('PAULINIA')) {
    return COMPREHENSIVE_LOCATIONS['PAULINIA - SP'];
  }
  if (normalized.includes('BETIM')) {
    return COMPREHENSIVE_LOCATIONS['BETIM - MG'];
  }
  if (normalized.includes('PARANAGUA')) {
    return COMPREHENSIVE_LOCATIONS['PARANAGUA - PR'];
  }
  if (normalized.includes('CURITIBA')) {
    return COMPREHENSIVE_LOCATIONS['CURITIBA - PR'];
  }
  if (normalized.includes('ITAJAI')) {
    return COMPREHENSIVE_LOCATIONS['ITAJAI - SC'];
  }
  if (normalized.includes('CAXIAS')) {
    return COMPREHENSIVE_LOCATIONS['DUQUE DE CAXIAS - RJ'];
  }
  if (normalized.includes('RIO DE JANEIRO') || normalized.includes('RJ')) {
    return COMPREHENSIVE_LOCATIONS['RIO DE JANEIRO - RJ'];
  }
  if (normalized.includes('CAMPINAS')) {
    return COMPREHENSIVE_LOCATIONS['CAMPINAS - SP'];
  }
  if (normalized.includes('SJC') || normalized.includes('JOSE DOS CAMPOS')) {
    return COMPREHENSIVE_LOCATIONS['SAO JOSE DOS CAMPOS - SP'];
  }
  if (normalized.includes('BR-101') || normalized.includes('BR 101')) {
    return COMPREHENSIVE_LOCATIONS['RODOVIA BR-101'];
  }

  // 6. State centroid fallback if state suffix exists (e.g. "CIDADE - GO")
  const stateMatch = upper.match(/[-\/\s]([A-Z]{2})$/);
  if (stateMatch && STATE_CENTROIDS[stateMatch[1]]) {
    return STATE_CENTROIDS[stateMatch[1]];
  }

  // Purely null if location is unknown - no fictitious placement
  return null;
}

/**
 * Positions vehicles on the map.
 * Vehicles without a registered city/location in the spreadsheet are placed at the Santos Company Base:
 * R. Dr. Zelnor Paiva Magalhães, 201 - Chico de Paula, Santos - SP, 11090-040
 */
export function assignVehiclePositions<T extends { local?: string; status?: string }>(vehicles: T[]): (T & { position: LatLng; displayLocation: string; cityName: string; isAtBase?: boolean })[] {
  const locationGroups: Record<string, number> = {};

  return vehicles.map((v) => {
    const rawLoc = (v.local || '').trim();
    
    // 1. Veículos que NÃO têm cidade citada na planilha: alocar na Base da empresa em Santos
    if (!rawLoc) {
      const baseCoords = COMPANY_BASE_SANTOS;
      const groupKey = 'BASE_SANTOS';
      const countInGroup = locationGroups[groupKey] || 0;
      locationGroups[groupKey] = countInGroup + 1;

      // Dispersão suave no pátio da Base Chico de Paula
      const angle = countInGroup * 0.65;
      const radius = 0.0004 + (0.00025 * Math.sqrt(countInGroup));
      const position = {
        lat: baseCoords.lat + Math.cos(angle) * radius,
        lng: baseCoords.lng + Math.sin(angle) * radius
      };

      return {
        ...v,
        position,
        displayLocation: 'Base Santos (R. Dr. Zelnor Paiva Magalhães, 201 - Chico de Paula)',
        cityName: 'Santos (Base)',
        isAtBase: true
      };
    }

    const displayLocation = cleanLocationStr(rawLoc);
    
    // Extract friendly city name for tags and headers
    let cityName = displayLocation;
    if (cityName.includes(' - ')) {
      cityName = cityName.split(' - ')[0].trim();
    } else if (cityName.includes('/')) {
      cityName = cityName.split('/')[0].trim();
    }
    
    const upperLoc = displayLocation.toUpperCase();
    if (
      upperLoc.includes('OFICINA') || 
      upperLoc.includes('PATIO') || 
      upperLoc.includes('PÁTIO') || 
      upperLoc.includes('CHICO DE PAULA') || 
      upperLoc.includes('ALEMOA') || 
      upperLoc.includes('SABOO') || 
      upperLoc.includes('PORTO DE SANTOS') || 
      upperLoc.includes('TERMINAL') ||
      upperLoc.includes('BASE') ||
      upperLoc.includes('MATRIZ')
    ) {
      cityName = 'SANTOS';
    }

    let baseCoords = resolveLocationCoordinates(displayLocation);
    let isAtBase = false;
    
    // Se a localização especificada não for encontrada em nenhum dicionário, aloca com segurança na Base Santos
    if (!baseCoords) {
      baseCoords = COMPANY_BASE_SANTOS;
      isAtBase = true;
    }

    // Group key based on approximate coordinates (to 3 decimals)
    const groupKey = `${baseCoords.lat.toFixed(3)}_${baseCoords.lng.toFixed(3)}`;
    const countInGroup = locationGroups[groupKey] || 0;
    locationGroups[groupKey] = countInGroup + 1;

    let finalCoords = baseCoords;

    if (countInGroup > 0) {
      // Small offset for vehicles at the exact same location
      const angle = countInGroup * 0.65;
      const radius = 0.0012 * Math.sqrt(countInGroup);
      finalCoords = {
        lat: baseCoords.lat + Math.cos(angle) * radius,
        lng: baseCoords.lng + Math.sin(angle) * radius
      };
    }

    return {
      ...v,
      position: finalCoords,
      displayLocation,
      cityName,
      isAtBase
    };
  });
}
