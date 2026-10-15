import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Truck, 
  Users, 
  Search, 
  X, 
  Info, 
  Download, 
  Copy, 
  Check, 
  Maximize2, 
  Layers, 
  ExternalLink,
  ShieldCheck,
  Activity,
  Gauge,
  Sparkles,
  ArrowRight,
  MapPin,
  User,
  SlidersHorizontal,
  Clock,
  Filter
} from 'lucide-react';

export interface FleetVehicle {
  id: string;
  tag: string;
  obs: string;
  mopp: string;
  ddd: string;
  t4s: boolean | 'warning';
  tipo: string;
  cavalo: string;
  carreta: string;
  motorista: string;
  contato: string;
  status: string;
  date: string;
  local: string;
  lastUpdate?: string;
}

interface StatusCategoryDashboardProps {
  fleet: FleetVehicle[];
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
  onSelectVehicle?: (vehicle: FleetVehicle) => void;
}

// 11 Core Statuses with refined modern dark-mode palette
export const DASHBOARD_STATUSES = [
  { key: 'EM VIAGEM', label: 'EM VIAGEM', bg: '#00f0ff', color: '#00e5ff', badgeBg: 'rgba(0, 229, 255, 0.15)', text: '#00e5ff', border: 'rgba(0, 229, 255, 0.3)', dot: '#00e5ff' },
  { key: 'MANTIDO NA VIAGEM', label: 'MANTIDO NA VIAGEM', bg: '#00ff00', color: '#10b981', badgeBg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)', dot: '#10b981' },
  { key: 'ENTRE VIAGENS', label: 'ENTRE VIAGENS', bg: '#6897ee', color: '#60a5fa', badgeBg: 'rgba(96, 165, 250, 0.15)', text: '#60a5fa', border: 'rgba(96, 165, 250, 0.3)', dot: '#60a5fa' },
  { key: 'A CAMINHO', label: 'A CAMINHO', bg: '#9fc4ff', color: '#93c5fd', badgeBg: 'rgba(147, 197, 253, 0.15)', text: '#93c5fd', border: 'rgba(147, 197, 253, 0.3)', dot: '#93c5fd' },
  { key: 'DISPONÍVEL', label: 'DISPONÍVEL', bg: '#d0f4f7', color: '#38bdf8', badgeBg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)', dot: '#38bdf8' },
  { key: 'MANUTENÇÃO', label: 'MANUTENÇÃO', bg: '#ff0000', color: '#ef4444', badgeBg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)', dot: '#ef4444' },
  { key: 'S/ MOTORISTA', label: 'S/ MOTORISTA', bg: '#ff7a00', color: '#f97316', badgeBg: 'rgba(249, 115, 22, 0.15)', text: '#f97316', border: 'rgba(249, 115, 22, 0.3)', dot: '#f97316' },
  { key: 'FORA DE ESCALA', label: 'FORA DE ESCALA', bg: '#ffcbb0', color: '#fb923c', badgeBg: 'rgba(251, 146, 60, 0.15)', text: '#fb923c', border: 'rgba(251, 146, 60, 0.3)', dot: '#fb923c' },
  { key: 'VIRA', label: 'VIRA', bg: '#e2b4e8', color: '#c084fc', badgeBg: 'rgba(192, 132, 252, 0.15)', text: '#c084fc', border: 'rgba(192, 132, 252, 0.3)', dot: '#c084fc' },
  { key: 'APOIO', label: 'APOIO', bg: '#ff00ff', color: '#e879f9', badgeBg: 'rgba(232, 121, 249, 0.15)', text: '#e879f9', border: 'rgba(232, 121, 249, 0.3)', dot: '#e879f9' },
  { key: 'SINISTRO', label: 'SINISTRO', bg: '#8f949c', color: '#94a3b8', badgeBg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)', dot: '#94a3b8' },
];

export const normalizeToISODate = (dateStr: any) => {
  if (!dateStr) return '';
  const str = dateStr.toString().trim();
  if (!str) return '';

  const clean = str.replace(/[,T]/g, ' ').split(' ')[0].trim();
  const delimiter = clean.includes('/') ? '/' : '-';
  const parts = clean.split(delimiter);

  if (parts.length === 3) {
    if (parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    if (parts[2].length === 2) {
      const year = parseInt(parts[2]) > 50 ? '19' + parts[2] : '20' + parts[2];
      return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  return clean;
};

export const formatDateBR = (dateStr: string) => {
  if (!dateStr) return 'Sem data';
  const iso = normalizeToISODate(dateStr);
  const parts = iso.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

export function classifyCategory(tipo: string): 'RODO' | 'LS' | 'L' {
  const t = (tipo || '').toUpperCase().trim();
  if (t.includes('RODO') || t.includes('BITREM') || t === 'RO') return 'RODO';
  if (t.includes('LS') || t.includes('CARRETA') || t.includes('VANDER')) return 'LS';
  if (t === 'L' || t.includes('TRUCK') || t.includes('TOCO') || t.includes('LEVE') || t.includes('3/4')) return 'L';
  if (t.startsWith('RO')) return 'RODO';
  if (t.startsWith('LS')) return 'LS';
  return 'L';
}

export function isAgregadoVehicle(v: FleetVehicle): boolean {
  const t = (v.tipo || '').toUpperCase();
  const tag = (v.tag || '').toUpperCase();
  const obs = (v.obs || '').toUpperCase();
  const mot = (v.motorista || '').toUpperCase();
  return t.includes('AGREG') || tag.includes('AGREG') || obs.includes('AGREG') || mot.includes('AGREG');
}

export function normalizeStatusKey(rawStatus: string): string {
  const s = (rawStatus || '').toUpperCase().trim();
  if (s.includes('MANTIDO')) return 'MANTIDO NA VIAGEM';
  if (s.includes('ENTRE VIAGENS') || s.includes('ENTRE VIAGEM')) return 'ENTRE VIAGENS';
  if (s.includes('A CAMINHO') || s.includes('CAMINHO') || s.includes('RETORNANDO')) return 'A CAMINHO';
  if (s.includes('EM VIAGEM') || s.includes('VIAGEM') || s.includes('ESCALADO')) return 'EM VIAGEM';
  if (s.includes('MANUTEN')) return 'MANUTENÇÃO';
  if (s.includes('SINISTRO')) return 'SINISTRO';
  if (s.includes('S/ MOTORISTA') || s.includes('SEM MOTORISTA') || s.includes('S/MOTORISTA')) return 'S/ MOTORISTA';
  if (s.includes('FORA DE ESCALA') || s.includes('FORA DA ESCALA')) return 'FORA DE ESCALA';
  if (s.includes('VIRA')) return 'VIRA';
  if (s.includes('APOIO')) return 'APOIO';
  if (s.includes('DISPON') || s.includes('ESTACIONADO') || s.includes('PATIO') || s.includes('PÁTIO') || s.includes('LIVRE')) return 'DISPONÍVEL';
  return 'DISPONÍVEL';
}

export const StatusCategoryDashboard: React.FC<StatusCategoryDashboardProps> = ({ 
  fleet, 
  selectedDate: propSelectedDate,
  onSelectDate: propOnSelectDate,
  onSelectVehicle 
}) => {
  // 1. Discover unique dates in dataset
  const availableDates = useMemo(() => {
    const datesMap = new Map<string, number>();
    fleet.forEach(v => {
      const iso = normalizeToISODate(v.date);
      if (iso && iso.length === 10) {
        datesMap.set(iso, (datesMap.get(iso) || 0) + 1);
      }
    });

    const sorted = Array.from(datesMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, count]) => ({ date, count, labelBR: formatDateBR(date) }));

    return sorted;
  }, [fleet]);

  // Selected date initial state: SEMPRE no dia atual (nunca todo histórico)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (propSelectedDate) return propSelectedDate;
    const todayISO = new Date().toISOString().split('T')[0];
    const hasToday = fleet.some(v => normalizeToISODate(v.date) === todayISO);
    if (hasToday) return todayISO;
    const dates = fleet.map(v => normalizeToISODate(v.date)).filter(Boolean).sort();
    return dates[dates.length - 1] || todayISO;
  });

  // Sincronizar com prop externa se fornecida
  React.useEffect(() => {
    if (propSelectedDate && propSelectedDate !== selectedDate) {
      setSelectedDate(propSelectedDate);
    }
  }, [propSelectedDate]);

  // Sincronizar estritamente para o dia de hoje assim que os dados carregam se não houver prop
  React.useEffect(() => {
    if (!propSelectedDate && availableDates.length > 0) {
      const todayISO = new Date().toISOString().split('T')[0];
      const hasToday = availableDates.some(d => d.date === todayISO);
      if (hasToday) {
        setSelectedDate(todayISO);
      } else if (!availableDates.some(d => d.date === selectedDate)) {
        // Se o dia atual exato não estiver presente, selecionar a data mais recente disponível
        setSelectedDate(availableDates[0].date);
      }
    }
  }, [availableDates, propSelectedDate]);

  const changeDate = (newDate: string) => {
    setSelectedDate(newDate);
    if (propOnSelectDate) {
      propOnSelectDate(newDate);
    }
  };

  const [viewMode, setViewMode] = useState<'day' | 'all'>('day');
  const [sectionFilter, setSectionFilter] = useState<'all' | 'frota' | 'agregados'>('all');
  const [quickSearch, setQuickSearch] = useState('');
  const [copiedPlates, setCopiedPlates] = useState(false);

  // Drilldown modal state (when user clicks on any count)
  const [selectedCell, setSelectedCell] = useState<{
    section: 'FROTA' | 'AGREGADOS';
    category: 'RODO' | 'LS' | 'L';
    status: string;
    statusMeta: typeof DASHBOARD_STATUSES[0];
    vehicles: FleetVehicle[];
  } | null>(null);

  const [modalSearch, setModalSearch] = useState('');
  const [modalFilterTag, setModalFilterTag] = useState<'all' | 'with-obs' | 'with-carreta'>('all');

  // Day navigation controls
  const currentIndex = availableDates.findIndex(d => d.date === selectedDate);

  const handlePrevDay = () => {
    if (currentIndex >= 0 && currentIndex < availableDates.length - 1) {
      changeDate(availableDates[currentIndex + 1].date);
    } else {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - 1);
      changeDate(d.toISOString().split('T')[0]);
    }
  };

  const handleNextDay = () => {
    if (currentIndex > 0) {
      changeDate(availableDates[currentIndex - 1].date);
    } else {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + 1);
      changeDate(d.toISOString().split('T')[0]);
    }
  };

  // 2. Filter and unify vehicles for the selected day (strictly 1 line per plate per day)
  const unifiedDayFleet = useMemo(() => {
    const base = fleet.filter(v => {
      if (viewMode === 'all') return true;
      const vIso = normalizeToISODate(v.date);
      return vIso === selectedDate;
    });

    const map = new Map<string, FleetVehicle>();
    const sorted = [...base].sort((a, b) => {
      const dateA = normalizeToISODate(a.date);
      const dateB = normalizeToISODate(b.date);
      return dateA.localeCompare(dateB);
    });

    sorted.forEach(v => {
      const plate = v.cavalo?.trim().toUpperCase();
      if (!plate) return;

      const existing = map.get(plate);
      if (!existing) {
        map.set(plate, v);
      } else {
        const merged = { ...v };
        if (!merged.obs && existing.obs) merged.obs = existing.obs;
        if ((!merged.tipo || merged.tipo === 'N/A') && existing.tipo) merged.tipo = existing.tipo;
        if (!merged.carreta && existing.carreta) merged.carreta = existing.carreta;
        map.set(plate, merged);
      }
    });

    return Array.from(map.values());
  }, [fleet, selectedDate, viewMode]);

  // 3. Separate FROTA and AGREGADOS
  const { frotaVehicles, agregadosVehicles } = useMemo(() => {
    const frota: FleetVehicle[] = [];
    const agreg: FleetVehicle[] = [];

    unifiedDayFleet.forEach(v => {
      if (isAgregadoVehicle(v)) {
        agreg.push(v);
      } else {
        frota.push(v);
      }
    });

    return { frotaVehicles: frota, agregadosVehicles: agreg };
  }, [unifiedDayFleet]);

  // 4. Matrix & KPIs
  const matrixData = useMemo(() => {
    const calcTotals = (list: FleetVehicle[]) => {
      return {
        RODO: list.filter(v => classifyCategory(v.tipo) === 'RODO').length,
        LS: list.filter(v => classifyCategory(v.tipo) === 'LS').length,
        L: list.filter(v => classifyCategory(v.tipo) === 'L').length,
        total: list.length
      };
    };

    const frotaTotals = calcTotals(frotaVehicles);
    const agregTotals = calcTotals(agregadosVehicles);

    const buildRows = (list: FleetVehicle[], totals: { RODO: number; LS: number; L: number }) => {
      return DASHBOARD_STATUSES.map(statusMeta => {
        const inStatus = list.filter(v => normalizeStatusKey(v.status) === statusMeta.key);

        const rodoVehicles = inStatus.filter(v => classifyCategory(v.tipo) === 'RODO');
        const lsVehicles = inStatus.filter(v => classifyCategory(v.tipo) === 'LS');
        const lVehicles = inStatus.filter(v => classifyCategory(v.tipo) === 'L');

        const rodoCount = rodoVehicles.length;
        const lsCount = lsVehicles.length;
        const lCount = lVehicles.length;

        const rodoPct = totals.RODO > 0 ? Math.round((rodoCount / totals.RODO) * 100) : 0;
        const lsPct = totals.LS > 0 ? Math.round((lsCount / totals.LS) * 100) : 0;
        const lPct = totals.L > 0 ? Math.round((lCount / totals.L) * 100) : 0;

        return {
          ...statusMeta,
          RODO: { count: rodoCount, pct: rodoPct, vehicles: rodoVehicles },
          LS: { count: lsCount, pct: lsPct, vehicles: lsVehicles },
          L: { count: lCount, pct: lPct, vehicles: lVehicles },
          totalCount: rodoCount + lsCount + lCount
        };
      });
    };

    const frotaRows = buildRows(frotaVehicles, frotaTotals);
    const agregRows = buildRows(agregadosVehicles, agregTotals);

    // Summary KPIs:
    // Frota Vira e Apoio
    const frotaViraEApoio = frotaVehicles.filter(v => {
      const s = normalizeStatusKey(v.status);
      return s === 'VIRA' || s === 'APOIO';
    }).length;

    // Frota em Viagem operacional
    const frotaViagem = Math.max(0, frotaTotals.total - frotaViraEApoio);

    // Operational statuses for Frota capacity
    const operationalStatuses = ['EM VIAGEM', 'MANTIDO NA VIAGEM', 'ENTRE VIAGENS', 'A CAMINHO', 'DISPONÍVEL'];
    
    const frotaOpRodo = frotaVehicles.filter(v => operationalStatuses.includes(normalizeStatusKey(v.status)) && classifyCategory(v.tipo) === 'RODO').length;
    const frotaOpLs = frotaVehicles.filter(v => operationalStatuses.includes(normalizeStatusKey(v.status)) && classifyCategory(v.tipo) === 'LS').length;
    const frotaOpL = frotaVehicles.filter(v => operationalStatuses.includes(normalizeStatusKey(v.status)) && classifyCategory(v.tipo) === 'L').length;

    // CAPACIDADE: RODO x 2 + LS x 1 + L x 1
    const capacAtendFrota = (frotaOpRodo * 2) + (frotaOpLs * 1) + (frotaOpL * 1);
    const capacAtendAgreg = (agregTotals.RODO * 2) + (agregTotals.LS * 1) + (agregTotals.L * 1);
    const capacAtendTotal = capacAtendFrota + capacAtendAgreg;

    // Operational rate
    const opFrotaCount = frotaVehicles.filter(v => operationalStatuses.includes(normalizeStatusKey(v.status))).length;
    const taxaDisponibilidade = frotaTotals.total > 0 ? Math.round((opFrotaCount / frotaTotals.total) * 100) : 0;

    return {
      frotaTotals,
      agregTotals,
      frotaRows,
      agregRows,
      frotaViagem,
      frotaViraEApoio,
      qtdAgregados: agregTotals.total,
      capacAtendFrota,
      capacAtendAgreg,
      capacAtendTotal,
      taxaDisponibilidade
    };
  }, [frotaVehicles, agregadosVehicles]);

  // Modal filtered vehicles
  const modalVehicles = useMemo(() => {
    if (!selectedCell) return [];
    let list = selectedCell.vehicles;

    if (modalFilterTag === 'with-obs') {
      list = list.filter(v => !!v.obs && v.obs.trim() !== '' && v.obs.trim() !== '-');
    } else if (modalFilterTag === 'with-carreta') {
      list = list.filter(v => !!v.carreta && v.carreta.trim() !== '' && v.carreta.trim() !== '-');
    }

    if (!modalSearch.trim()) return list;
    const q = modalSearch.toLowerCase();
    return list.filter(v => 
      v.cavalo.toLowerCase().includes(q) ||
      (v.carreta && v.carreta.toLowerCase().includes(q)) ||
      (v.motorista && v.motorista.toLowerCase().includes(q)) ||
      (v.local && v.local.toLowerCase().includes(q)) ||
      (v.obs && v.obs.toLowerCase().includes(q))
    );
  }, [selectedCell, modalSearch, modalFilterTag]);

  // Quick copy plates helper
  const handleCopyPlates = () => {
    if (!selectedCell) return;
    const plates = selectedCell.vehicles.map(v => v.cavalo).filter(Boolean).join(', ');
    navigator.clipboard.writeText(plates);
    setCopiedPlates(true);
    setTimeout(() => setCopiedPlates(false), 2000);
  };

  // Download CSV of modal list
  const handleDownloadModalCSV = () => {
    if (!selectedCell || selectedCell.vehicles.length === 0) return;
    const headers = ['Cavalo', 'Carreta', 'Tipo', 'Motorista', 'Localização', 'Status', 'Data', 'Observações'];
    const rows = selectedCell.vehicles.map(v => [
      v.cavalo || '',
      v.carreta || '',
      v.tipo || '',
      v.motorista || '',
      v.local || '',
      v.status || '',
      formatDateBR(v.date),
      `"${(v.obs || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `frota_${selectedCell.section}_${selectedCell.status}_${selectedCell.category}_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-[1720px] mx-auto select-none font-sans text-white pb-16">
      
      {/* ===================== CONTROL BAR & DATE NAVIGATOR ===================== */}
      <div className="bg-[#17181c]/95 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Brand & Info */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#00e5ff] to-[#0091a3] text-[#002b33] flex items-center justify-center font-black shadow-lg shadow-[#00e5ff]/20">
            <Truck size={22} strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
                Status & Categoria
              </h1>
              <span className="text-[10px] font-mono font-bold bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/30 px-2 py-0.5 rounded tracking-widest">
                COSTA SCALE
              </span>
            </div>
            <p className="text-xs text-[#8e98a8] flex items-center gap-2">
              <span>Posição diária unificada</span>
              <span className="text-white/20">•</span>
              <span className="text-[#00e5ff] font-medium font-mono">{unifiedDayFleet.length} veículos nesta data</span>
            </p>
          </div>
        </div>

        {/* Center: High-Tech Date Navigation */}
        <div className="flex items-center gap-2 bg-[#0e0f12] border border-white/15 rounded-xl px-2 py-1.5 shadow-inner">
          <button 
            onClick={handlePrevDay}
            className="p-1.5 text-[#8e98a8] hover:text-[#00e5ff] hover:bg-white/5 rounded-lg transition-all active:scale-95"
            title="Dia Anterior"
          >
            <ChevronLeft size={19} />
          </button>

          <div className="flex items-center gap-2 px-2.5">
            <Calendar size={17} className="text-[#00e5ff]" />
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) changeDate(e.target.value);
              }}
              className="bg-transparent border-none text-sm sm:text-base font-black tracking-wider text-white outline-none cursor-pointer [color-scheme:dark] font-mono"
            />
          </div>

          <button 
            onClick={handleNextDay}
            className="p-1.5 text-[#8e98a8] hover:text-[#00e5ff] hover:bg-white/5 rounded-lg transition-all active:scale-95"
            title="Próximo Dia"
          >
            <ChevronRight size={19} />
          </button>

          <div className="h-4 w-px bg-white/10 mx-1" />

          {/* Quick Date Chips */}
          <div className="hidden lg:flex items-center gap-1.5">
            {availableDates.slice(0, 3).map(d => (
              <button
                key={d.date}
                onClick={() => {
                  setSelectedDate(d.date);
                  setViewMode('day');
                }}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition-all font-mono ${
                  selectedDate === d.date && viewMode === 'day'
                    ? 'bg-[#00e5ff] text-[#002b33] shadow-sm font-black'
                    : 'bg-white/5 text-[#8e98a8] hover:text-white hover:bg-white/10'
                }`}
              >
                {d.labelBR.slice(0, 5)}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Section Controls & View Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Section view filter (All, Frota, Agregados) */}
          <div className="flex bg-[#0e0f12] p-1 rounded-xl border border-white/10 text-xs font-bold">
            <button
              onClick={() => setSectionFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all uppercase tracking-wider text-[11px] ${
                sectionFilter === 'all'
                  ? 'bg-white/15 text-white shadow'
                  : 'text-[#8e98a8] hover:text-white'
              }`}
            >
              Lado a Lado
            </button>
            <button
              onClick={() => setSectionFilter('frota')}
              className={`px-3 py-1.5 rounded-lg transition-all uppercase tracking-wider text-[11px] ${
                sectionFilter === 'frota'
                  ? 'bg-[#00e5ff]/20 text-[#00e5ff] shadow'
                  : 'text-[#8e98a8] hover:text-white'
              }`}
            >
              Frota Própria
            </button>
            <button
              onClick={() => setSectionFilter('agregados')}
              className={`px-3 py-1.5 rounded-lg transition-all uppercase tracking-wider text-[11px] ${
                sectionFilter === 'agregados'
                  ? 'bg-[#a855f7]/20 text-[#c084fc] shadow'
                  : 'text-[#8e98a8] hover:text-white'
              }`}
            >
              Agregados
            </button>
          </div>

          {/* Mode Switcher */}
          <button
            onClick={() => setViewMode(viewMode === 'day' ? 'all' : 'day')}
            className={`text-[11px] font-bold px-3 py-2 rounded-xl border transition-all uppercase tracking-wider flex items-center gap-1.5 ${
              viewMode === 'day'
                ? 'bg-[#00e5ff]/10 text-[#00e5ff] border-[#00e5ff]/30'
                : 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/40'
            }`}
            title="Alternar entre consolidado do dia e todos os dias"
          >
            <Clock size={13} />
            <span>{viewMode === 'day' ? 'Consolidado Dia' : 'Todos os Dias'}</span>
          </button>
        </div>
      </div>

      {/* ===================== EXECUTIVE KPI CARDS ===================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Capacidade de Atendimento Total */}
        <div className="bg-gradient-to-br from-[#17181c] to-[#121316] border border-white/10 rounded-2xl p-4.5 shadow-lg relative overflow-hidden group hover:border-[#00e5ff]/30 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-[#00e5ff]/5 rounded-full blur-2xl group-hover:bg-[#00e5ff]/10 transition-all" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8e98a8]">
              Capacidade de Atendimento Total
            </span>
            <div className="p-2 rounded-lg bg-[#00e5ff]/10 text-[#00e5ff]">
              <Gauge size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black font-mono text-white tracking-tight">
              {matrixData.capacAtendTotal}
            </span>
            <span className="text-xs text-[#00e5ff] font-bold font-mono">pontos de capac.</span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-white/5 font-mono">
            <span className="text-[#8e98a8]">
              Frota: <strong className="text-white">{matrixData.capacAtendFrota}</strong>
            </span>
            <span className="text-[#8e98a8]">
              Agregados: <strong className="text-white">{matrixData.capacAtendAgreg}</strong>
            </span>
          </div>
        </div>

        {/* KPI 2: Frota em Viagem */}
        <div className="bg-gradient-to-br from-[#17181c] to-[#121316] border border-white/10 rounded-2xl p-4.5 shadow-lg relative overflow-hidden group hover:border-[#10b981]/30 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-[#10b981]/5 rounded-full blur-2xl group-hover:bg-[#10b981]/10 transition-all" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8e98a8]">
              Qtd Frota em Viagem
            </span>
            <div className="p-2 rounded-lg bg-[#10b981]/10 text-[#10b981]">
              <Truck size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black font-mono text-white tracking-tight">
              {matrixData.frotaViagem}
            </span>
            <span className="text-xs text-[#10b981] font-bold">
              {matrixData.frotaTotals.total > 0 
                ? `${Math.round((matrixData.frotaViagem / matrixData.frotaTotals.total) * 100)}% da frota` 
                : '0%'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-white/5 text-[#8e98a8]">
            <span>Total Frota Própria: <strong className="text-white font-mono">{matrixData.frotaTotals.total}</strong></span>
            <span className="text-[#10b981] font-bold">Operação ativa</span>
          </div>
        </div>

        {/* KPI 3: Frota Vira e Apoio */}
        <div className="bg-gradient-to-br from-[#17181c] to-[#121316] border border-white/10 rounded-2xl p-4.5 shadow-lg relative overflow-hidden group hover:border-[#c084fc]/30 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-[#c084fc]/5 rounded-full blur-2xl group-hover:bg-[#c084fc]/10 transition-all" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8e98a8]">
              Qtd Frota Vira & Apoio
            </span>
            <div className="p-2 rounded-lg bg-[#c084fc]/10 text-[#c084fc]">
              <Activity size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black font-mono text-white tracking-tight">
              {matrixData.frotaViraEApoio}
            </span>
            <span className="text-xs text-[#c084fc] font-bold">veículos dedicados</span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-white/5 text-[#8e98a8]">
            <span>Suporte operacional local</span>
            <span className="text-[#c084fc] font-mono font-bold">VIRA + APOIO</span>
          </div>
        </div>

        {/* KPI 4: Agregados Operacionais */}
        <div className="bg-gradient-to-br from-[#17181c] to-[#121316] border border-white/10 rounded-2xl p-4.5 shadow-lg relative overflow-hidden group hover:border-[#38bdf8]/30 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-[#38bdf8]/5 rounded-full blur-2xl group-hover:bg-[#38bdf8]/10 transition-all" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8e98a8]">
              Qtd Total Agregados
            </span>
            <div className="p-2 rounded-lg bg-[#38bdf8]/10 text-[#38bdf8]">
              <Users size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black font-mono text-white tracking-tight">
              {matrixData.qtdAgregados}
            </span>
            <span className="text-xs text-[#38bdf8] font-bold">parceiros terceiros</span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-white/5 text-[#8e98a8]">
            <span>Capacidade agregada: <strong className="text-white font-mono">{matrixData.capacAtendAgreg}</strong></span>
            <span className="text-[#38bdf8] font-bold">Escala externa</span>
          </div>
        </div>

      </div>

      {/* ===================== MATRIX PANELS CONTAINER ===================== */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        
        {/* ===================== TABLE 1: FROTA PRÓPRIA ===================== */}
        {(sectionFilter === 'all' || sectionFilter === 'frota') && (
          <div className="bg-[#17181c] border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-all">
            {/* Panel Header */}
            <div className="px-5 py-4 border-b border-white/10 bg-[#1e2025] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#00e5ff]/15 text-[#00e5ff] flex items-center justify-center font-black">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h2 className="text-base font-black tracking-wide uppercase text-white flex items-center gap-2">
                    FROTA PRÓPRIA
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-[#00e5ff]">
                      {matrixData.frotaTotals.total} veículos
                    </span>
                  </h2>
                  <p className="text-[11px] text-[#8e98a8]">
                    Classificação por categoria e status operacional do dia
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-[#8e98a8] block uppercase">Capac. Atendimento</span>
                <span className="text-base font-black font-mono text-[#00e5ff]">
                  {matrixData.capacAtendFrota}
                </span>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-[#121316] text-[11px] font-bold text-[#8e98a8] uppercase tracking-wider">
                    <th className="py-3 px-4 w-[34%]">
                      Status Operacional
                    </th>
                    <th className="py-3 px-3 text-center w-[22%]">
                      <div className="flex flex-col items-center">
                        <span className="text-white font-black text-xs">RODO</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] text-[#00e5ff] font-mono font-bold bg-[#00e5ff]/10 px-1 rounded">2x</span>
                          <span className="text-[11px] text-[#e5e2e1] font-mono font-bold">({matrixData.frotaTotals.RODO})</span>
                        </div>
                      </div>
                    </th>
                    <th className="py-3 px-3 text-center w-[22%]">
                      <div className="flex flex-col items-center">
                        <span className="text-white font-black text-xs">LS</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] text-[#60a5fa] font-mono font-bold bg-[#60a5fa]/10 px-1 rounded">1x</span>
                          <span className="text-[11px] text-[#e5e2e1] font-mono font-bold">({matrixData.frotaTotals.LS})</span>
                        </div>
                      </div>
                    </th>
                    <th className="py-3 px-3 text-center w-[22%]">
                      <div className="flex flex-col items-center">
                        <span className="text-white font-black text-xs">L</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] text-[#a855f7] font-mono font-bold bg-[#a855f7]/10 px-1 rounded">1x</span>
                          <span className="text-[11px] text-[#e5e2e1] font-mono font-bold">({matrixData.frotaTotals.L})</span>
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5 font-sans">
                  {matrixData.frotaRows.map((row) => (
                    <tr 
                      key={row.key} 
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Status Column */}
                      <td className="py-2 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: row.dot }}
                          />
                          <span 
                            className="text-xs font-bold uppercase tracking-wide group-hover:text-white transition-colors"
                            style={{ color: row.totalCount > 0 ? '#ffffff' : '#8e98a8' }}
                          >
                            {row.label}
                          </span>
                        </div>
                      </td>

                      {/* RODO Cell */}
                      <td className="py-2 px-2 text-center font-mono">
                        <button
                          onClick={() => {
                            if (row.RODO.count > 0) {
                              setSelectedCell({
                                section: 'FROTA',
                                category: 'RODO',
                                status: row.label,
                                statusMeta: row,
                                vehicles: row.RODO.vehicles
                              });
                            }
                          }}
                          disabled={row.RODO.count === 0}
                          className={`w-full py-1.5 px-2 rounded-lg flex items-center justify-between transition-all ${
                            row.RODO.count > 0
                              ? 'bg-white/5 hover:bg-[#00e5ff]/20 hover:border-[#00e5ff]/50 border border-white/10 text-white cursor-pointer group/cell active:scale-95 shadow-sm'
                              : 'bg-transparent text-white/20 border border-transparent cursor-default'
                          }`}
                          title={row.RODO.count > 0 ? `Clique para listar ${row.RODO.count} rodotrens em ${row.label}` : 'Nenhum veículo'}
                        >
                          <span className={`text-xs font-black ${row.RODO.count > 0 ? 'text-[#00e5ff] group-hover/cell:scale-110 transition-transform' : ''}`}>
                            {row.RODO.count}
                          </span>
                          <span className="text-[10px] text-[#8e98a8] font-bold">
                            {row.RODO.count > 0 ? `${row.RODO.pct}%` : '0%'}
                          </span>
                        </button>
                      </td>

                      {/* LS Cell */}
                      <td className="py-2 px-2 text-center font-mono">
                        <button
                          onClick={() => {
                            if (row.LS.count > 0) {
                              setSelectedCell({
                                section: 'FROTA',
                                category: 'LS',
                                status: row.label,
                                statusMeta: row,
                                vehicles: row.LS.vehicles
                              });
                            }
                          }}
                          disabled={row.LS.count === 0}
                          className={`w-full py-1.5 px-2 rounded-lg flex items-center justify-between transition-all ${
                            row.LS.count > 0
                              ? 'bg-white/5 hover:bg-[#60a5fa]/20 hover:border-[#60a5fa]/50 border border-white/10 text-white cursor-pointer group/cell active:scale-95 shadow-sm'
                              : 'bg-transparent text-white/20 border border-transparent cursor-default'
                          }`}
                          title={row.LS.count > 0 ? `Clique para listar ${row.LS.count} carretas em ${row.label}` : 'Nenhum veículo'}
                        >
                          <span className={`text-xs font-black ${row.LS.count > 0 ? 'text-[#60a5fa] group-hover/cell:scale-110 transition-transform' : ''}`}>
                            {row.LS.count}
                          </span>
                          <span className="text-[10px] text-[#8e98a8] font-bold">
                            {row.LS.count > 0 ? `${row.LS.pct}%` : '0%'}
                          </span>
                        </button>
                      </td>

                      {/* L Cell */}
                      <td className="py-2 px-2 text-center font-mono">
                        <button
                          onClick={() => {
                            if (row.L.count > 0) {
                              setSelectedCell({
                                section: 'FROTA',
                                category: 'L',
                                status: row.label,
                                statusMeta: row,
                                vehicles: row.L.vehicles
                              });
                            }
                          }}
                          disabled={row.L.count === 0}
                          className={`w-full py-1.5 px-2 rounded-lg flex items-center justify-between transition-all ${
                            row.L.count > 0
                              ? 'bg-white/5 hover:bg-[#a855f7]/20 hover:border-[#a855f7]/50 border border-white/10 text-white cursor-pointer group/cell active:scale-95 shadow-sm'
                              : 'bg-transparent text-white/20 border border-transparent cursor-default'
                          }`}
                          title={row.L.count > 0 ? `Clique para listar ${row.L.count} veículos leves em ${row.label}` : 'Nenhum veículo'}
                        >
                          <span className={`text-xs font-black ${row.L.count > 0 ? 'text-[#a855f7] group-hover/cell:scale-110 transition-transform' : ''}`}>
                            {row.L.count}
                          </span>
                          <span className="text-[10px] text-[#8e98a8] font-bold">
                            {row.L.count > 0 ? `${row.L.pct}%` : '0%'}
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Summary Bar for Frota */}
            <div className="p-4 bg-[#121316] border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4 font-mono">
                <div>
                  <span className="text-[#8e98a8] text-[11px] block">Viagem:</span>
                  <span className="font-bold text-white text-sm">{matrixData.frotaViagem}</span>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <div>
                  <span className="text-[#8e98a8] text-[11px] block">Vira & Apoio:</span>
                  <span className="font-bold text-[#c084fc] text-sm">{matrixData.frotaViraEApoio}</span>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <div>
                  <span className="text-[#8e98a8] text-[11px] block">Capacidade:</span>
                  <span className="font-bold text-[#00e5ff] text-sm">{matrixData.capacAtendFrota}</span>
                </div>
              </div>

              <div className="text-[11px] text-[#8e98a8] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff]" />
                <span>Clique em qualquer número para inspecionar</span>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TABLE 2: AGREGADOS ===================== */}
        {(sectionFilter === 'all' || sectionFilter === 'agregados') && (
          <div className="bg-[#17181c] border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-all">
            {/* Panel Header */}
            <div className="px-5 py-4 border-b border-white/10 bg-[#1e2025] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#a855f7]/15 text-[#c084fc] flex items-center justify-center font-black">
                  <Users size={18} />
                </div>
                <div>
                  <h2 className="text-base font-black tracking-wide uppercase text-white flex items-center gap-2">
                    AGREGADOS
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-[#c084fc]">
                      {matrixData.agregTotals.total} veículos
                    </span>
                  </h2>
                  <p className="text-[11px] text-[#8e98a8]">
                    Frota terceirizada agregada à operação nesta data
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-[#8e98a8] block uppercase">Capac. Atendimento</span>
                <span className="text-base font-black font-mono text-[#c084fc]">
                  {matrixData.capacAtendAgreg}
                </span>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-[#121316] text-[11px] font-bold text-[#8e98a8] uppercase tracking-wider">
                    <th className="py-3 px-4 w-[34%]">
                      Status Operacional
                    </th>
                    <th className="py-3 px-3 text-center w-[22%]">
                      <div className="flex flex-col items-center">
                        <span className="text-white font-black text-xs">RODO</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] text-[#00e5ff] font-mono font-bold bg-[#00e5ff]/10 px-1 rounded">2x</span>
                          <span className="text-[11px] text-[#e5e2e1] font-mono font-bold">({matrixData.agregTotals.RODO})</span>
                        </div>
                      </div>
                    </th>
                    <th className="py-3 px-3 text-center w-[22%]">
                      <div className="flex flex-col items-center">
                        <span className="text-white font-black text-xs">LS</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] text-[#60a5fa] font-mono font-bold bg-[#60a5fa]/10 px-1 rounded">1x</span>
                          <span className="text-[11px] text-[#e5e2e1] font-mono font-bold">({matrixData.agregTotals.LS})</span>
                        </div>
                      </div>
                    </th>
                    <th className="py-3 px-3 text-center w-[22%]">
                      <div className="flex flex-col items-center">
                        <span className="text-white font-black text-xs">L</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] text-[#a855f7] font-mono font-bold bg-[#a855f7]/10 px-1 rounded">1x</span>
                          <span className="text-[11px] text-[#e5e2e1] font-mono font-bold">({matrixData.agregTotals.L})</span>
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5 font-sans">
                  {matrixData.agregRows.map((row) => (
                    <tr 
                      key={row.key} 
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Status Column */}
                      <td className="py-2 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: row.dot }}
                          />
                          <span 
                            className="text-xs font-bold uppercase tracking-wide group-hover:text-white transition-colors"
                            style={{ color: row.totalCount > 0 ? '#ffffff' : '#8e98a8' }}
                          >
                            {row.label}
                          </span>
                        </div>
                      </td>

                      {/* RODO Cell */}
                      <td className="py-2 px-2 text-center font-mono">
                        <button
                          onClick={() => {
                            if (row.RODO.count > 0) {
                              setSelectedCell({
                                section: 'AGREGADOS',
                                category: 'RODO',
                                status: row.label,
                                statusMeta: row,
                                vehicles: row.RODO.vehicles
                              });
                            }
                          }}
                          disabled={row.RODO.count === 0}
                          className={`w-full py-1.5 px-2 rounded-lg flex items-center justify-between transition-all ${
                            row.RODO.count > 0
                              ? 'bg-white/5 hover:bg-[#00e5ff]/20 hover:border-[#00e5ff]/50 border border-white/10 text-white cursor-pointer group/cell active:scale-95 shadow-sm'
                              : 'bg-transparent text-white/20 border border-transparent cursor-default'
                          }`}
                          title={row.RODO.count > 0 ? `Clique para listar ${row.RODO.count} rodotrens em ${row.label}` : 'Nenhum veículo'}
                        >
                          <span className={`text-xs font-black ${row.RODO.count > 0 ? 'text-[#00e5ff] group-hover/cell:scale-110 transition-transform' : ''}`}>
                            {row.RODO.count}
                          </span>
                          <span className="text-[10px] text-[#8e98a8] font-bold">
                            {row.RODO.count > 0 ? `${row.RODO.pct}%` : '0%'}
                          </span>
                        </button>
                      </td>

                      {/* LS Cell */}
                      <td className="py-2 px-2 text-center font-mono">
                        <button
                          onClick={() => {
                            if (row.LS.count > 0) {
                              setSelectedCell({
                                section: 'AGREGADOS',
                                category: 'LS',
                                status: row.label,
                                statusMeta: row,
                                vehicles: row.LS.vehicles
                              });
                            }
                          }}
                          disabled={row.LS.count === 0}
                          className={`w-full py-1.5 px-2 rounded-lg flex items-center justify-between transition-all ${
                            row.LS.count > 0
                              ? 'bg-white/5 hover:bg-[#60a5fa]/20 hover:border-[#60a5fa]/50 border border-white/10 text-white cursor-pointer group/cell active:scale-95 shadow-sm'
                              : 'bg-transparent text-white/20 border border-transparent cursor-default'
                          }`}
                          title={row.LS.count > 0 ? `Clique para listar ${row.LS.count} carretas em ${row.label}` : 'Nenhum veículo'}
                        >
                          <span className={`text-xs font-black ${row.LS.count > 0 ? 'text-[#60a5fa] group-hover/cell:scale-110 transition-transform' : ''}`}>
                            {row.LS.count}
                          </span>
                          <span className="text-[10px] text-[#8e98a8] font-bold">
                            {row.LS.count > 0 ? `${row.LS.pct}%` : '0%'}
                          </span>
                        </button>
                      </td>

                      {/* L Cell */}
                      <td className="py-2 px-2 text-center font-mono">
                        <button
                          onClick={() => {
                            if (row.L.count > 0) {
                              setSelectedCell({
                                section: 'AGREGADOS',
                                category: 'L',
                                status: row.label,
                                statusMeta: row,
                                vehicles: row.L.vehicles
                              });
                            }
                          }}
                          disabled={row.L.count === 0}
                          className={`w-full py-1.5 px-2 rounded-lg flex items-center justify-between transition-all ${
                            row.L.count > 0
                              ? 'bg-white/5 hover:bg-[#a855f7]/20 hover:border-[#a855f7]/50 border border-white/10 text-white cursor-pointer group/cell active:scale-95 shadow-sm'
                              : 'bg-transparent text-white/20 border border-transparent cursor-default'
                          }`}
                          title={row.L.count > 0 ? `Clique para listar ${row.L.count} veículos leves em ${row.label}` : 'Nenhum veículo'}
                        >
                          <span className={`text-xs font-black ${row.L.count > 0 ? 'text-[#a855f7] group-hover/cell:scale-110 transition-transform' : ''}`}>
                            {row.L.count}
                          </span>
                          <span className="text-[10px] text-[#8e98a8] font-bold">
                            {row.L.count > 0 ? `${row.L.pct}%` : '0%'}
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Summary Bar for Agregados */}
            <div className="p-4 bg-[#121316] border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4 font-mono">
                <div>
                  <span className="text-[#8e98a8] text-[11px] block">Total Agregados:</span>
                  <span className="font-bold text-white text-sm">{matrixData.qtdAgregados}</span>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <div>
                  <span className="text-[#8e98a8] text-[11px] block">Capacidade:</span>
                  <span className="font-bold text-[#c084fc] text-sm">{matrixData.capacAtendAgreg}</span>
                </div>
              </div>

              <div className="text-[11px] text-[#8e98a8] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c084fc]" />
                <span>RODO (x2), LS (x1), L (x1)</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ===================== LOGISTICS RULES & CONSOLIDATION SUMMARY ===================== */}
      <div className="bg-[#17181c] border border-white/10 rounded-2xl p-4.5 flex flex-wrap items-center justify-between gap-4 text-xs text-[#8e98a8]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#00e5ff]/10 text-[#00e5ff] flex items-center justify-center shrink-0">
            <Info size={17} />
          </div>
          <div>
            <span className="font-bold text-white">Regras de Capacidade de Atendimento: </span>
            <span className="text-[#bac9cc]">
              RODO equivale a fator 2 (dupla capacidade), LS equivale a fator 1, L equivale a fator 1. 
            </span>
            <span className="text-[#8e98a8] ml-1">
              Veículos em condição operacional (Viagem, Mantido, Entre Viagens, A Caminho ou Disponível) compõem a capacidade da Frota.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#0e0f12] px-3 py-1.5 rounded-lg border border-white/10 font-mono text-[11px] text-[#00e5ff]">
            1 linha por placa / dia
          </div>
        </div>
      </div>

      {/* ===================== HIGH-END VEHICLE DRILLDOWN DRAWER/MODAL ===================== */}
      {selectedCell && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div 
            className="bg-[#16171b] border border-white/15 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-[0_25px_70px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-white/10 bg-[#1c1d22] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div 
                  className="w-3.5 h-10 rounded-full shadow-lg"
                  style={{ backgroundColor: selectedCell.statusMeta.color }}
                />
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-lg font-black uppercase tracking-tight text-white">
                      {selectedCell.section} • {selectedCell.category}
                    </h3>
                    <span 
                      className="text-xs font-bold px-2.5 py-1 rounded-md border tracking-wider uppercase font-mono"
                      style={{ 
                        backgroundColor: selectedCell.statusMeta.badgeBg,
                        color: selectedCell.statusMeta.color,
                        borderColor: selectedCell.statusMeta.border
                      }}
                    >
                      {selectedCell.status}
                    </span>
                    <span className="text-xs bg-white/10 text-white font-mono font-bold px-2.5 py-1 rounded-md">
                      {selectedCell.vehicles.length} {selectedCell.vehicles.length === 1 ? 'veículo' : 'veículos'}
                    </span>
                  </div>
                  <p className="text-xs text-[#8e98a8] mt-1 flex items-center gap-2">
                    <span>Data: <strong className="text-white">{formatDateBR(selectedDate)}</strong></span>
                    <span className="text-white/20">•</span>
                    <span>Fator de capacidade: <strong className="text-[#00e5ff]">{selectedCell.category === 'RODO' ? '2x' : '1x'}</strong></span>
                  </p>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyPlates}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-[#bac9cc] hover:text-white transition-all flex items-center gap-1.5"
                  title="Copiar todas as placas desta listagem"
                >
                  {copiedPlates ? <Check size={14} className="text-[#10b981]" /> : <Copy size={14} />}
                  <span>{copiedPlates ? 'Copiado!' : 'Copiar Placas'}</span>
                </button>

                <button
                  onClick={handleDownloadModalCSV}
                  className="px-3 py-1.5 rounded-xl bg-[#00e5ff]/15 hover:bg-[#00e5ff]/25 border border-[#00e5ff]/30 text-xs font-bold text-[#00e5ff] transition-all flex items-center gap-1.5"
                  title="Exportar esta lista para CSV"
                >
                  <Download size={14} />
                  <span>CSV</span>
                </button>

                <button 
                  onClick={() => setSelectedCell(null)}
                  className="p-2 text-[#8e98a8] hover:text-white rounded-xl hover:bg-white/10 transition-colors ml-1"
                  title="Fechar (Esc)"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Search & Filter Tabs */}
            <div className="p-4 border-b border-white/10 bg-[#121316] flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[260px]">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8e98a8]" />
                <input 
                  type="text"
                  placeholder="Pesquisar por placa (cavalo), motorista, carreta ou cidade..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full bg-[#1a1b20] border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-[#8e98a8] outline-none focus:border-[#00e5ff] transition-all"
                />
                {modalSearch && (
                  <button 
                    onClick={() => setModalSearch('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#8e98a8] hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-1 bg-[#1a1b20] p-1 rounded-xl border border-white/10 text-xs font-bold">
                <button
                  onClick={() => setModalFilterTag('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    modalFilterTag === 'all'
                      ? 'bg-white/15 text-white'
                      : 'text-[#8e98a8] hover:text-white'
                  }`}
                >
                  Todos ({selectedCell.vehicles.length})
                </button>
                <button
                  onClick={() => setModalFilterTag('with-carreta')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    modalFilterTag === 'with-carreta'
                      ? 'bg-white/15 text-white'
                      : 'text-[#8e98a8] hover:text-white'
                  }`}
                >
                  Com Carreta
                </button>
                <button
                  onClick={() => setModalFilterTag('with-obs')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    modalFilterTag === 'with-obs'
                      ? 'bg-white/15 text-white'
                      : 'text-[#8e98a8] hover:text-white'
                  }`}
                >
                  Com Observação
                </button>
              </div>
            </div>

            {/* Modal Body: Vehicle List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-white/5 space-y-2">
              {modalVehicles.length > 0 ? (
                <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#18191e]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#202228] text-[#8e98a8] font-bold uppercase tracking-wider text-[11px] border-b border-white/10">
                        <th className="py-3 px-4">Placa (Cavalo)</th>
                        <th className="py-3 px-4">Carreta</th>
                        <th className="py-3 px-4">Tipo</th>
                        <th className="py-3 px-4">Motorista / Contato</th>
                        <th className="py-3 px-4">Localização</th>
                        <th className="py-3 px-4">Observações</th>
                        <th className="py-3 px-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {modalVehicles.map(v => (
                        <tr 
                          key={v.id || v.cavalo} 
                          className="hover:bg-white/[0.04] transition-colors group"
                        >
                          {/* Placa Mercosul styled badge */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 bg-[#0e1726] border border-[#1e293b] px-2.5 py-1 rounded-md text-white font-mono font-black text-xs tracking-wider shadow-sm group-hover:border-[#00e5ff]/50 transition-colors">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff]" />
                              <span>{v.cavalo}</span>
                            </div>
                          </td>

                          {/* Carreta */}
                          <td className="py-3 px-4 font-mono text-[#bac9cc]">
                            {v.carreta && v.carreta !== '-' ? (
                              <span className="bg-white/5 px-2 py-0.5 rounded text-white font-bold border border-white/5">
                                {v.carreta}
                              </span>
                            ) : (
                              <span className="text-white/20">-</span>
                            )}
                          </td>

                          {/* Tipo */}
                          <td className="py-3 px-4 text-[#8e98a8] font-mono text-[11px]">
                            {v.tipo || '-'}
                          </td>

                          {/* Motorista */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[#8e98a8]">
                                <User size={13} />
                              </div>
                              <div>
                                <span className="font-bold text-white block">
                                  {v.motorista || 'Sem motorista vinculado'}
                                </span>
                                {v.contato && (
                                  <span className="text-[10px] text-[#8e98a8] font-mono">
                                    {v.contato}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Localização */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 text-[#bac9cc]">
                              <MapPin size={13} className="text-[#00e5ff] shrink-0" />
                              <span className="truncate max-w-[180px]" title={v.local}>
                                {v.local || 'Não informado'}
                              </span>
                            </div>
                          </td>

                          {/* Observações */}
                          <td className="py-3 px-4 max-w-[200px]">
                            {v.obs && v.obs !== '-' ? (
                              <span className="text-[11px] text-[#fbbf24] bg-[#fbbf24]/10 border border-[#fbbf24]/20 px-2 py-0.5 rounded inline-block truncate max-w-[200px]" title={v.obs}>
                                {v.obs}
                              </span>
                            ) : (
                              <span className="text-white/20">-</span>
                            )}
                          </td>

                          {/* Quick action button */}
                          <td className="py-3 px-4 text-right">
                            {onSelectVehicle && (
                              <button
                                onClick={() => {
                                  onSelectVehicle(v);
                                  setSelectedCell(null);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#00e5ff]/20 text-[#00e5ff] font-bold text-[11px] transition-all flex items-center gap-1 ml-auto group/btn"
                                title="Filtrar este veículo na Frota Ativa"
                              >
                                <span>Ver</span>
                                <ArrowRight size={12} className="group-hover/btn:translate-x-0.5 transition-transform" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-16 text-center text-[#8e98a8]">
                  <Truck size={42} className="mx-auto mb-3 opacity-25" />
                  <p className="text-sm font-bold text-white">Nenhum veículo encontrado</p>
                  <p className="text-xs text-[#8e98a8] mt-1">Tente remover os filtros de busca acima.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 bg-[#1c1d22] flex flex-wrap justify-between items-center gap-3 text-xs text-[#8e98a8]">
              <div className="flex items-center gap-2">
                <span>Exibindo <strong>{modalVehicles.length}</strong> de <strong>{selectedCell.vehicles.length}</strong> veículos</span>
                <span className="text-white/20">•</span>
                <span className="text-[#00e5ff] font-mono">1 linha consolidada por placa</span>
              </div>
              <button 
                onClick={() => setSelectedCell(null)}
                className="bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-xl font-bold uppercase text-[11px] tracking-wider transition-colors"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
