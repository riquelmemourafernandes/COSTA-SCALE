import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { Layers, Eye, Maximize2, MapPin, Moon, Sun, Globe } from 'lucide-react';

interface FleetVehicle {
  id: string;
  cavalo: string;
  motorista: string;
  status: string;
  local?: string;
  displayLocation?: string;
  cityName?: string;
  tipo?: string;
  carreta?: string;
  position?: { lat: number; lng: number } | null;
  [key: string]: any;
}

export type MapLayerType = 'dark' | 'satellite' | 'street';

interface LeafletFleetMapProps {
  fleet: FleetVehicle[];
  center: { lat: number; lng: number };
  zoom: number;
  activeLayer?: MapLayerType;
  onLayerChange?: (layer: MapLayerType) => void;
  onVehicleClick?: (v: FleetVehicle) => void;
}

export const LeafletFleetMap: React.FC<LeafletFleetMapProps> = ({
  fleet,
  center,
  zoom,
  activeLayer,
  onLayerChange,
  onVehicleClick
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayersRef = useRef<L.TileLayer[]>([]);
  const hasFittedBoundsRef = useRef<boolean>(false);
  const [internalLayer, setInternalLayer] = useState<MapLayerType>('dark');
  const [selectedHub, setSelectedHub] = useState<string | null>(null);

  const currentLayer = activeLayer || internalLayer;

  const handleSelectLayer = (layer: MapLayerType) => {
    setInternalLayer(layer);
    if (onLayerChange) {
      onLayerChange(layer);
    }
  };

  // Helper to remove existing tiles and apply new ones cleanly
  const applyTileLayer = (map: L.Map, layerType: MapLayerType) => {
    // Cleanly remove any existing tile layers
    tileLayersRef.current.forEach(layer => {
      try {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      } catch (e) {
        // ignore layer removal error
      }
    });
    tileLayersRef.current = [];

    const newLayers: L.TileLayer[] = [];

    if (layerType === 'dark') {
      // 100% Free Esri World Dark Gray Base - No API key, no watermarks, high performance
      const darkBase = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
          maxNativeZoom: 16,
          attribution: '&copy; Esri &copy; OpenStreetMap',
          className: 'dark-base-tiles'
        }
      );

      // Reference overlay for streets, highways, ports, cities and terminal labels
      const darkLabels = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
          maxNativeZoom: 16,
          className: 'dark-labels-tiles'
        }
      );

      darkBase.addTo(map);
      darkLabels.addTo(map);
      darkBase.bringToBack();
      newLayers.push(darkBase, darkLabels);
    } else if (layerType === 'satellite') {
      // Esri World Imagery (HD Satellite)
      const satBase = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
          maxNativeZoom: 18,
          attribution: '&copy; Esri World Imagery'
        }
      );

      // Road networks and place labels overlay
      const satLabels = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
          maxNativeZoom: 18
        }
      );

      satBase.addTo(map);
      satLabels.addTo(map);
      satBase.bringToBack();
      newLayers.push(satBase, satLabels);
    } else {
      // Street / Ruas (OpenStreetMap standard)
      const street = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 19,
          subdomains: 'abc',
          attribution: '&copy; OpenStreetMap contributors'
        }
      );

      street.addTo(map);
      street.bringToBack();
      newLayers.push(street);
    }

    tileLayersRef.current = newLayers;
  };

  // Group vehicles with verified positions by city/hub for quick navigation
  const hubStats = useMemo(() => {
    const counts: Record<string, { count: number; lat: number; lng: number }> = {};
    fleet.forEach(v => {
      if (!v.position || isNaN(v.position.lat) || isNaN(v.position.lng)) return;
      const city = v.cityName || (v.displayLocation || v.local || '').split(' - ')[0].trim();
      const locKey = city || 'OUTROS';
      if (!counts[locKey]) {
        counts[locKey] = {
          count: 0,
          lat: v.position.lat,
          lng: v.position.lng
        };
      }
      counts[locKey].count += 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10); // Top active cities
  }, [fleet]);

  // Fit bounds to show all vehicles
  const handleFitAll = () => {
    if (!mapInstanceRef.current || fleet.length === 0) return;
    
    const validPoints = fleet
      .filter(v => v.position && !isNaN(v.position.lat) && !isNaN(v.position.lng))
      .map(v => [v.position!.lat, v.position!.lng] as [number, number]);

    if (validPoints.length > 0) {
      const bounds = L.latLngBounds(validPoints);
      mapInstanceRef.current.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 14
      });
      setSelectedHub(null);
    }
  };

  // Pan to a specific city/hub
  const handleJumpToHub = (hubName: string, lat: number, lng: number) => {
    if (!mapInstanceRef.current) return;
    setSelectedHub(hubName);
    mapInstanceRef.current.setView([lat, lng], 13, { animate: true });
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [center.lat, center.lng],
        zoom: zoom,
        zoomControl: false,
        attributionControl: false
      });

      applyTileLayer(map, currentLayer);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;

      // Fit all vehicles automatically on initial load if fleet is ready
      if (fleet.length > 0) {
        const validPoints = fleet
          .filter(v => v.position && !isNaN(v.position.lat) && !isNaN(v.position.lng))
          .map(v => [v.position!.lat, v.position!.lng] as [number, number]);
        if (validPoints.length > 0) {
          map.fitBounds(L.latLngBounds(validPoints), { padding: [50, 50], maxZoom: 12 });
          hasFittedBoundsRef.current = true;
        }
      }
    }

    return () => {
      tileLayersRef.current = [];
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Change Tile Layer when toggled
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    applyTileLayer(mapInstanceRef.current, currentLayer);
  }, [currentLayer]);

  // Update center and zoom when props change
  useEffect(() => {
    if (mapInstanceRef.current && center && !isNaN(center.lat) && !isNaN(center.lng)) {
      mapInstanceRef.current.setView([center.lat, center.lng], zoom, {
        animate: true
      });
    }
  }, [center.lat, center.lng, zoom]);

  // Update Markers & auto-fit on data load
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    // Marcador de Destaque: Base Matriz da Empresa (Santos - Chico de Paula)
    const baseIcon = L.divIcon({
      className: 'custom-company-base-marker',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="
            width: 32px; 
            height: 32px; 
            background: linear-gradient(135deg, #00e5ff 0%, #00838f 100%); 
            border: 2px solid #ffffff; 
            border-radius: 8px; 
            box-shadow: 0 0 18px rgba(0, 229, 255, 0.8), 0 4px 10px rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
          ">
            🏢
          </div>
          <div style="
            position: absolute;
            bottom: 36px;
            background: #00363de6;
            backdrop-filter: blur(6px);
            border: 1px solid #00e5ff;
            padding: 3px 8px;
            border-radius: 6px;
            font-family: system-ui, sans-serif;
            font-size: 10px;
            font-weight: 900;
            color: #00e5ff;
            white-space: nowrap;
            box-shadow: 0 6px 16px rgba(0,0,0,0.7);
            letter-spacing: 0.5px;
            text-transform: uppercase;
            pointer-events: none;
          ">
            ★ BASE SANTOS (CHICO DE PAULA)
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const baseMarker = L.marker([-23.93298, -46.37083], { icon: baseIcon, zIndexOffset: 1000 });
    const vehiclesAtBase = fleet.filter(v => (v.cityName && v.cityName.includes('Base')) || (v.displayLocation && v.displayLocation.includes('Chico de Paula')) || !v.local);
    baseMarker.bindPopup(`
      <div style="font-family: system-ui, sans-serif; padding: 8px 10px; color: #fff; background: #1c1b1b; border-radius: 10px; border: 1.5px solid #00e5ff; min-width: 250px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <span style="font-size: 20px;">🏢</span>
          <div>
            <div style="font-weight: 900; font-size: 12px; color: #00e5ff; text-transform: uppercase;">BASE MATRIZ DA EMPRESA</div>
            <div style="font-size: 9px; color: #849396; font-weight: 700;">SANTOS - SP</div>
          </div>
        </div>
        <div style="font-size: 10px; color: #bac9cc; margin-bottom: 8px; background: rgba(255,255,255,0.05); padding: 6px 8px; border-radius: 6px; line-height: 1.4;">
          📍 <b>R. Dr. Zelnor Paiva Magalhães, 201</b><br/>
          Bairro Chico de Paula • CEP 11090-040
        </div>
        <div style="font-size: 11px; font-weight: bold; color: #77ff61; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.1); pt: 6px;">
          <span>Veículos no Pátio da Base:</span>
          <span style="font-family: monospace; font-size: 13px; font-weight: 900; color: #00e5ff;">${vehiclesAtBase.length}</span>
        </div>
      </div>
    `, { className: 'dark-popup' });
    markersLayerRef.current.addLayer(baseMarker);

    // Auto fit bounds on first arrival of fleet data so user immediately sees all cities
    if (!hasFittedBoundsRef.current && fleet.length > 0) {
      const validPoints = fleet
        .filter(v => v.position && !isNaN(v.position.lat) && !isNaN(v.position.lng))
        .map(v => [v.position!.lat, v.position!.lng] as [number, number]);
      if (validPoints.length > 0) {
        mapInstanceRef.current.fitBounds(L.latLngBounds(validPoints), {
          padding: [50, 50],
          maxZoom: 12
        });
        hasFittedBoundsRef.current = true;
      }
    }

    fleet.forEach((v) => {
      if (!v.position || isNaN(v.position.lat) || isNaN(v.position.lng)) return;
      const pos = v.position;
      
      const isSinistro = v.status === 'SINISTRO';
      const isManutencao = v.status === 'EM MANUTENÇÃO' || v.status === 'MANUTENÇÃO' || (v.status || '').toUpperCase().includes('MANUTEN');
      const isOperacao = v.status === 'ESCALADO' || v.status === 'EM VIAGEM' || v.status === 'A CAMINHO' || v.status === 'MANTIDO NA VIAGEM' || v.status === 'ENTRE VIAGENS';
      
      const color = isSinistro ? '#ffb4ab' : isManutencao ? '#ffb870' : isOperacao ? '#00e5ff' : '#28ff1d';
      const displayLoc = v.displayLocation || v.local || 'SANTOS - SP';
      const cityName = v.cityName || displayLoc.split(' - ')[0].trim();

      const customIcon = L.divIcon({
        className: 'custom-fleet-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="
              width: 22px; 
              height: 22px; 
              background-color: ${color}; 
              border: 2px solid #131313; 
              border-radius: 50%; 
              box-shadow: 0 0 12px ${color}aa;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: transform 0.2s ease;
            ">
              <div style="width: 7px; height: 7px; border-radius: 50%; background-color: #131313;"></div>
            </div>
            <div style="
              position: absolute;
              bottom: 24px;
              background: #1c1b1be6;
              backdrop-filter: blur(4px);
              border: 1px solid rgba(255,255,255,0.25);
              padding: 2px 6px;
              border-radius: 4px;
              font-family: monospace;
              font-size: 10px;
              font-weight: bold;
              color: #fff;
              white-space: nowrap;
              box-shadow: 0 4px 10px rgba(0,0,0,0.5);
              pointer-events: none;
              display: flex;
              align-items: center;
              gap: 4px;
            ">
              <span style="color: #00e5ff; font-weight: 800;">${v.cavalo}</span>
              <span style="color: #bac9cc; font-size: 8.5px; font-weight: 600;">• ${cityName}</span>
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([pos.lat, pos.lng], { icon: customIcon });

      const popupContent = `
        <div style="font-family: system-ui, sans-serif; padding: 6px 8px; color: #fff; background: #1c1b1b; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); min-width: 180px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-weight: 800; font-size: 13px; color: #00e5ff; font-family: monospace;">${v.cavalo || 'Veículo'}</span>
            <span style="padding: 1px 6px; border-radius: 4px; font-size: 8px; font-weight: 700; background: ${color}25; color: ${color}; border: 1px solid ${color}40;">${v.status}</span>
          </div>
          <div style="font-size: 11px; color: #bac9cc; font-weight: 600;">👤 ${v.motorista || 'Sem motorista'}</div>
          <div style="font-size: 10px; color: #00e5ff; margin-top: 3px; font-weight: 700; background: rgba(0,229,255,0.1); padding: 3px 6px; border-radius: 4px;">
            📍 Cidade: ${cityName} (${displayLoc})
          </div>
          ${v.tipo ? `<div style="font-size: 9px; color: #849396; margin-top: 3px;">🚛 ${v.tipo} ${v.carreta ? `• Carreta: ${v.carreta}` : ''}</div>` : ''}
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: 'dark-popup'
      });

      marker.on('click', () => {
        if (onVehicleClick) {
          onVehicleClick(v);
        }
      });

      markersLayerRef.current?.addLayer(marker);
    });
  }, [fleet, onVehicleClick]);

  return (
    <div className="w-full h-full relative z-0">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* City / Hub Quick-Jump Chips Bar (Bottom Left) */}
      <div className="absolute bottom-6 left-20 right-72 z-[400] flex items-center gap-1.5 overflow-x-auto pb-1 invisible-scrollbar pointer-events-auto">
        <button
          onClick={handleFitAll}
          title="Ver todos os veículos no mapa"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#00e5ff] text-[#00363d] text-[10px] font-black shadow-lg hover:brightness-110 transition-all active:scale-95 shrink-0"
        >
          <Maximize2 size={11} />
          Ver Todos
        </button>
        <span className="text-[9px] uppercase tracking-wider text-[#849396] font-bold bg-[#1c1b1b]/90 backdrop-blur-md px-2 py-1.5 rounded-lg border border-white/5 shrink-0 flex items-center gap-1">
          <MapPin size={10} className="text-[#00e5ff]" />
          Cidades:
        </span>
        {hubStats.map(([hub, data]) => (
          <button
            key={hub}
            onClick={() => handleJumpToHub(hub, data.lat, data.lng)}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap border backdrop-blur-md transition-all shrink-0 flex items-center gap-1.5 ${
              selectedHub === hub
                ? 'bg-[#00e5ff] border-[#00e5ff] text-[#00363d] shadow-md'
                : 'bg-[#1c1b1b]/90 border-white/10 text-[#bac9cc] hover:text-white hover:border-white/20'
            }`}
          >
            <span>{hub.replace(' - SP', '').replace(' - PR', '').replace(' - SC', '').replace(' - MG', '').replace(' - RJ', '')}</span>
            <span className={`text-[8px] px-1 py-0.2 rounded font-mono ${
              selectedHub === hub ? 'bg-[#00363d]/30 text-[#00363d]' : 'bg-white/10 text-[#00e5ff]'
            }`}>
              {data.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
