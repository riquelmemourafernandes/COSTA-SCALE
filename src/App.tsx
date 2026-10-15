/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  AlertTriangle, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical,
  CheckCircle,
  Clock,
  Wrench,
  BarChart3,
  TrendingUp,
  RefreshCcw,
  Download,
  ExternalLink,
  Moon,
  Sun,
  Globe,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarRange
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
  PieChart,
  Pie,
  AreaChart,
  Area,
  LabelList
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { StatusCategoryDashboard } from './components/StatusCategoryDashboard';
import { LeafletFleetMap } from './components/LeafletFleetMap';
import { assignVehiclePositions, cleanLocationStr } from './utils/geoLocations';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const normalizeToISODate = (dateStr: any) => {
  if (!dateStr) return '';
  // Converter para string se for número (data do Excel as vezes vem como serial)
  const str = dateStr.toString().trim();
  if (!str) return '';

  // Pegar apenas a parte da data (ignorar hora se houver)
  const clean = str.replace(/[,T]/g, ' ').split(' ')[0].trim();
  
  const delimiter = clean.includes('/') ? '/' : '-';
  const parts = clean.split(delimiter);
  
  if (parts.length === 3) {
    // DD/MM/YYYY
    if (parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    // YYYY/MM/DD
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    // DD/MM/YY (assume 20xx)
    if (parts[2].length === 2) {
      const year = parseInt(parts[2]) > 50 ? '19' + parts[2] : '20' + parts[2];
      return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  return clean;
};

const formatDateBR = (dateStr: string) => {
  if (!dateStr) return 'sem data';
  const iso = normalizeToISODate(dateStr);
  const parts = iso.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const cleanLocation = (local: string | undefined) => {
  return cleanLocationStr(local);
};

// --- Types ---
type Status = 
  | 'MANTIDO NA VIAGEM' 
  | 'EM MANUTENÇÃO' 
  | 'MANUTENÇÃO'
  | 'ESCALADO' 
  | 'APOIO' 
  | 'SINISTRO' 
  | 'FORA DE ESCALA' 
  | 'EM VIAGEM' 
  | 'ENTRE VIAGENS' 
  | 'A CAMINHO' 
  | 'RETORNANDO DA VIAGEM' 
  | 'VIRA' 
  | 'ESTACIONADO'
  | 'DISPONÍVEL'
  | 'S/ MOTORISTA'
  | (string & {});

interface FleetVehicle {
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
  status: Status;
  date: string;
  local: string;
}

// --- Components ---

const DateSelector = ({ selectedDate, onChange }: { selectedDate: string, onChange: (date: string) => void }) => (
  <div className="flex items-center gap-3 bg-[#1c1b1b] border border-white/10 px-4 py-2 rounded-xl">
    <div className="flex flex-col">
      <span className="text-[9px] font-bold text-[#849396] uppercase tracking-wider">Data da Operação</span>
      <input 
        type="date" 
        value={selectedDate}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent border-none text-sm font-bold text-[#00e5ff] outline-none cursor-pointer [color-scheme:dark]"
      />
    </div>
    <Clock size={18} className="text-[#849396]" />
  </div>
);

const SidebarItem = ({ icon: Icon, label, isActive, onClick, color }: { 
  icon: any, 
  label: string, 
  isActive?: boolean, 
  onClick?: () => void,
  color?: string
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-4 px-4 py-3 rounded-lg mx-2 transition-all active:scale-95 duration-200 w-[calc(100%-16px)]",
      isActive 
        ? (color || "bg-[#28ff1d] text-[#013a00]") 
        : "text-[#bac9cc] hover:bg-[#353534]"
    )}
  >
    <Icon size={20} className={isActive ? "fill-current" : ""} />
    <span className="font-medium text-sm">{label}</span>
  </button>
);

  const StatCard = ({ label, value, trend, icon: Icon, color, description, progress, statusColor, isAlert }: any) => (
    <motion.div 
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        borderColor: isAlert ? ['rgba(255,180,171,0.1)', 'rgba(255,180,171,0.5)', 'rgba(255,180,171,0.1)'] : 'rgba(255,255,255,0.05)'
      }}
      whileHover={{ 
        scale: 1.04, 
        boxShadow: "0 15px 35px rgba(0, 0, 0, 0.4)",
        borderColor: "rgba(0, 229, 255, 0.3)",
        zIndex: 10
      }}
      transition={isAlert ? {
        borderColor: { duration: 2, repeat: Infinity, ease: "easeInOut" },
        scale: { type: "spring", stiffness: 400, damping: 10 }
      } : {
        scale: { type: "spring", stiffness: 400, damping: 10 }
      }}
      className={cn(
        "bg-[#201f1f]/80 backdrop-blur-xl border p-4 rounded-xl relative overflow-hidden cursor-default",
        isAlert ? "border-[#ffb4ab]/30" : "border-white/5"
      )}
    >
      {isAlert && (
        <motion.div 
          animate={{ opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-[#ffb4ab]"
        />
      )}
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            {statusColor && <div className={cn("w-2 h-2 rounded-full", statusColor)} />}
            <span className="text-[#849396] text-[11px] font-bold tracking-wider uppercase">{label}</span>
          </div>
          {Icon && <Icon size={16} className={color} />}
        </div>
        <div className="flex items-baseline gap-2">
          <p className={cn("text-3xl font-bold", color || "text-[#e5e2e1]")}>{value}</p>
          {trend && <span className="text-[#77ff61] text-xs font-bold">{trend}</span>}
        </div>
        {description && <p className="text-xs text-[#849396] mt-1 font-medium">{description}</p>}
        {progress !== undefined && (
          <div className="w-full bg-[#353534] h-1 rounded-full mt-3 overflow-hidden">
            <div 
              className={cn("h-full transition-all duration-1000", color ? color.replace('text-', 'bg-').replace('border-', 'bg-') : "bg-[#77ff61]")}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );

const StatusBadge = ({ status }: { status: string }) => {
  const norm = (status || '').toUpperCase().trim();
  let style = 'bg-[#353534] text-[#bac9cc]';

  if (norm.includes('EM VIAGEM') || norm.includes('ESCALADO')) {
    style = 'bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/30 shadow-[0_0_8px_rgba(0,229,255,0.2)]';
  } else if (norm.includes('MANTIDO')) {
    style = 'bg-[#28ff1d]/20 text-[#28ff1d] border border-[#28ff1d]/30 shadow-[0_0_8px_rgba(40,255,29,0.2)]';
  } else if (norm.includes('ENTRE VIAGENS')) {
    style = 'bg-[#60a5fa]/20 text-[#60a5fa] border border-[#60a5fa]/30';
  } else if (norm.includes('A CAMINHO') || norm.includes('RETORNANDO')) {
    style = 'bg-[#93c5fd]/20 text-[#93c5fd] border border-[#93c5fd]/30';
  } else if (norm.includes('DISPON') || norm.includes('ESTACIONADO')) {
    style = 'bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/30';
  } else if (norm.includes('MANUTEN')) {
    style = 'bg-[#ff5555]/20 text-[#ff5555] border border-[#ff5555]/30 shadow-[0_0_8px_rgba(255,85,85,0.2)]';
  } else if (norm.includes('SINISTRO')) {
    style = 'bg-[#93000a] text-white border border-[#ffb4ab] animate-pulse';
  } else if (norm.includes('S/ MOTORISTA') || norm.includes('SEM MOTORISTA')) {
    style = 'bg-[#f97316]/20 text-[#f97316] border border-[#f97316]/30';
  } else if (norm.includes('FORA DE ESCALA')) {
    style = 'bg-[#fb923c]/20 text-[#fb923c] border border-[#fb923c]/30';
  } else if (norm.includes('VIRA')) {
    style = 'bg-[#c084fc]/20 text-[#c084fc] border border-[#c084fc]/30';
  } else if (norm.includes('APOIO')) {
    style = 'bg-[#e879f9]/20 text-[#e879f9] border border-[#e879f9]/30';
  }

  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
      style
    )}>
      {status || 'N/A'}
    </span>
  );
};

// --- Pages ---

const OverviewPage = ({ fleet, onSwitchToMatrix }: { fleet: FleetVehicle[], onSwitchToMatrix?: () => void }) => {
  // Unificar por placa do cavalo (evita contagem duplicada de rodotrem que tem 2 carretas na planilha)
  const unifiedFleet = useMemo(() => {
    const plateMap = new Map<string, FleetVehicle>();
    fleet.forEach(v => {
      const plate = (v.cavalo?.trim() || v.tag?.trim() || v.id?.trim() || '').toUpperCase();
      if (!plate) return;
      const existing = plateMap.get(plate);
      if (!existing) {
        plateMap.set(plate, v);
      } else {
        const merged = { ...v };
        if (!merged.obs && existing.obs) merged.obs = existing.obs;
        if (existing.carreta && merged.carreta && existing.carreta !== merged.carreta) {
          merged.carreta = `${existing.carreta} / ${merged.carreta}`;
        } else if (!merged.carreta && existing.carreta) {
          merged.carreta = existing.carreta;
        }
        plateMap.set(plate, merged);
      }
    });
    return Array.from(plateMap.values());
  }, [fleet]);

  const stats = useMemo(() => {
    const total = unifiedFleet.length;
    const maintenance = unifiedFleet.filter(v => 
      v.status === 'EM MANUTENÇÃO' || v.status === 'MANUTENÇÃO' || (v.status || '').includes('MANUTEN') || v.status === 'SINISTRO'
    ).length;
    
    // FROTA EM OPERAÇÃO: A CAMINHO, ENTRE VIAGENS, ESCALADO, MANTIDO NA VIAGEM, RETORNANDO DA VIAGEM, EM VIAGEM
    const opStatuses = ['A CAMINHO', 'ENTRE VIAGENS', 'ESCALADO', 'MANTIDO NA VIAGEM', 'RETORNANDO DA VIAGEM', 'EM VIAGEM'];
    const active = unifiedFleet.filter(v => opStatuses.includes(v.status)).length;
    
    // DISPONÍVEL / PÁTIO
    const available = unifiedFleet.filter(v => (v.status || '').includes('DISPON') || v.status === 'ESTACIONADO').length;

    // ESCALA / APOIO / VIRA
    const supportStatuses = ['APOIO', 'VIRA', 'FORA DE ESCALA', 'S/ MOTORISTA'];
    const support = unifiedFleet.filter(v => supportStatuses.includes(v.status)).length;

    const safeTotal = total || 1;
    const opRate = (active / safeTotal) * 100;
    let opStatusColor = "bg-[#ffb4ab]"; // Red < 50%
    if (opRate > 75) opStatusColor = "bg-[#77ff61]"; // Green > 75%
    else if (opRate >= 40) opStatusColor = "bg-[#ffb870]"; // Yellow 40-75%
    
    // Agrupar por tipo contando PLACAS ÚNICAS de veículos (ex: rodotrem conta 1 por cavalo, mesmo tendo 2 linhas de carretas)
    const byType = unifiedFleet.reduce((acc: any, v) => {
      const t = v.tipo || 'OUTROS';
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});

    const chartData = Object.keys(byType).map(key => ({
      name: key,
      value: byType[key]
    })).sort((a, b) => b.value - a.value);

    return { 
      total, 
      active, 
      maintenance, 
      available,
      supportOrVira: support, 
      chartData, 
      opStatusColor, 
      opRate, 
      maintenanceRate: (maintenance / safeTotal) * 100, 
      supportRate: (support / safeTotal) * 100,
      availableRate: (available / safeTotal) * 100
    };
  }, [unifiedFleet]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-[#1c1b1b] to-[#252424] border border-[#00e5ff]/30 p-4 rounded-xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#00e5ff]/20 text-[#00e5ff] flex items-center justify-center shadow-inner">
            <LayoutDashboard size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white uppercase flex items-center gap-2">
              Painel Diário por Status & Categoria (Estilo Matriz)
              <span className="text-[10px] bg-[#00e5ff] text-[#00363d] font-black px-1.5 py-0.5 rounded">NOVO</span>
            </h4>
            <p className="text-xs text-[#849396]">Acompanhamento dia a dia segmentado por Frota Própria e Agregados (RODO, LS, L)</p>
          </div>
        </div>
        {onSwitchToMatrix && (
          <button 
            onClick={onSwitchToMatrix}
            className="bg-[#00e5ff] hover:opacity-90 text-[#00363d] px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-opacity shadow-lg shadow-[#00e5ff]/20"
          >
            Abrir Painel Status & Categoria
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="TOTAL DA FROTA" value={stats.total} color="text-[#00e5ff]" icon={Truck} progress={100} trend="100%" />
        <StatCard label="EM OPERAÇÃO" value={stats.active} color="text-[#28ff1d]" icon={CheckCircle} progress={stats.opRate} statusColor={stats.opStatusColor} trend={`${stats.opRate.toFixed(1)}%`} />
        <StatCard 
          label="MANUTENÇÃO / SINISTRO" 
          value={stats.maintenance} 
          color="text-[#ffb4ab]" 
          icon={AlertTriangle} 
          progress={stats.maintenanceRate} 
          isAlert={stats.maintenance > 0}
          trend={`${stats.maintenanceRate.toFixed(1)}%`}
        />
        <StatCard label="DISPONÍVEL / PÁTIO" value={stats.available} color="text-[#38bdf8]" icon={Clock} progress={stats.availableRate} trend={`${stats.availableRate.toFixed(1)}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#201f1f] p-6 rounded-xl border border-white/5">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <BarChart3 size={18} className="text-[#00e5ff]" />
            Distribuição por Tipo de Veículo
          </h3>
          <div className="h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData} layout="vertical" margin={{ left: 40, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#353534" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" stroke="#849396" fontSize={12} width={120} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#1c1b1b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={35}>
                  {stats.chartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#00e5ff' : '#28ff1d'} />
                  ))}
                  <LabelList 
                    dataKey="value" 
                    position="right" 
                    fill="#bac9cc" 
                    fontSize={12} 
                    fontWeight="bold"
                    offset={10}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#201f1f] p-6 rounded-xl border border-white/5">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <AlertTriangle size={18} className="text-[#ffb4ab]" />
            Alertas Recentes & Oficina
          </h3>
          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
            {unifiedFleet.filter(v => v.status === 'SINISTRO' || v.status === 'EM MANUTENÇÃO' || v.status === 'MANUTENÇÃO' || (v.status || '').includes('MANUTEN')).map(v => (
              <div key={v.id} className="p-3 bg-[#93000a]/10 border-l-4 border-[#ffb4ab] rounded-lg">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-xs text-[#ffb4ab]">{v.cavalo} {v.carreta ? `+ ${v.carreta}` : ''}</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded uppercase font-bold",
                    v.status === 'SINISTRO' ? "bg-[#93000a] text-white" : "bg-[#690005] text-[#ffb4ab]"
                  )}>
                    {v.status === 'SINISTRO' ? 'Sinistro' : 'Manutenção'}
                  </span>
                </div>
                <p className="text-[11px] text-[#849396]">{v.motorista || 'Sem motorista'} - {v.local || 'Local não informado'}</p>
                {v.obs && <p className="text-[10px] text-[#ffb4ab]/80 italic mt-0.5">{v.obs}</p>}
              </div>
            ))}
            {unifiedFleet.filter(v => v.status === 'SINISTRO' || v.status === 'EM MANUTENÇÃO' || v.status === 'MANUTENÇÃO' || (v.status || '').includes('MANUTEN')).length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 opacity-30 text-center">
                <CheckCircle size={32} className="mb-2" />
                <p className="text-xs">Nenhum alerta crítico ativo</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MultiSelect = ({ label, options, selected, onChange }: { 
  label: string, 
  options: string[], 
  selected: string[], 
  onChange: (vals: string[]) => void 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter(v => v !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  const selectAll = () => {
    onChange([...options]);
  };

  return (
    <div className="relative z-30">
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-bold text-[#849396] uppercase">{label}:</span>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="bg-[#353534] border-none text-[11px] font-bold rounded-lg py-1.5 px-3 focus:ring-1 focus:ring-[#00e5ff] text-[#e5e2e1] outline-none cursor-pointer flex items-center gap-2 min-w-[120px] justify-between hover:bg-[#3d3d3c] transition-colors"
        >
          <span className="truncate max-w-[100px]">
            {selected.length === 0 ? `TODOS ${label}S` : selected.length === options.length ? `TODOS ${label}S` : `${selected.length} SELEC.`}
          </span>
          <Filter size={10} />
        </button>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-56 bg-[#201f1f] border border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 py-2 max-h-72 overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 pb-2 mb-1">
              <button 
                onClick={selectAll}
                className="text-[10px] font-bold text-[#00e5ff] hover:underline uppercase tracking-widest"
              >
                SELEC. TUDO
              </button>
              <button 
                onClick={() => onChange([])}
                className="text-[10px] font-bold text-[#ffb4ab] hover:underline uppercase tracking-widest"
              >
                LIMPAR
              </button>
            </div>
            {options.map(opt => (
              <label 
                key={opt} 
                className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 cursor-pointer group"
              >
                <div className={cn(
                  "w-4 h-4 rounded border flex items-center justify-center transition-all",
                  selected.includes(opt) ? "bg-[#00e5ff] border-[#00e5ff]" : "border-white/20 group-hover:border-[#00e5ff]/50"
                )}>
                  {selected.includes(opt) && <CheckCircle size={12} className="text-[#00363d]" />}
                </div>
                <span className="text-xs text-[#bac9cc] font-medium">{opt}</span>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={selected.includes(opt)}
                  onChange={() => toggle(opt)}
                />
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// --- Components ---
const TooltipWrapper = ({ children, content, position = "top" }: { children: React.ReactNode, content: string, position?: "top" | "bottom" | "left" | "right" }) => {
  const [show, setShow] = useState(false);
  const posClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-y-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2"
  };

  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: position === 'top' ? 4 : position === 'bottom' ? -4 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: position === 'top' ? 4 : position === 'bottom' ? -4 : 0 }}
            className={cn(
              "absolute z-[100] px-2 py-1.5 bg-[#131313] border border-white/20 rounded shadow-[0_10px_30px_rgba(0,0,0,0.5)] text-[10px] text-[#c3f5ff] font-bold whitespace-nowrap pointer-events-none",
              posClasses[position]
            )}
          >
            {content}
            <div className={cn(
              "absolute w-2 h-2 bg-[#131313] border-b border-r border-white/20 rotate-45",
              position === 'top' ? "top-full left-1/2 -translate-x-1/2 -mt-1" :
              position === 'bottom' ? "bottom-full left-1/2 -translate-x-1/2 -mb-1 rotate-[225deg]" :
              position === 'left' ? "left-full top-1/2 -translate-y-1/2 -ml-1 rotate-[-45deg]" :
              "right-full top-1/2 -translate-y-1/2 -mr-1 rotate-[135deg]"
            )} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DailyDateNavigator = ({ 
  dateRange, 
  onChange,
  availableDates = [],
  todayDate
}: { 
  dateRange: { start: string, end: string }, 
  onChange: (range: { start: string, end: string }) => void,
  availableDates?: string[],
  todayDate?: string
}) => {
  const [isRangeOpen, setIsRangeOpen] = useState(false);
  const activeToday = todayDate || new Date().toISOString().split('T')[0];
  const activeDate = dateRange.start || activeToday;
  const isRangeActive = Boolean(dateRange.start && dateRange.end && dateRange.start !== dateRange.end);

  const [customStart, setCustomStart] = useState(dateRange.start || activeToday);
  const [customEnd, setCustomEnd] = useState(dateRange.end || activeToday);

  // Sync inputs when dateRange updates externally
  useEffect(() => {
    setCustomStart(dateRange.start || activeToday);
    setCustomEnd(dateRange.end || activeToday);
  }, [dateRange.start, dateRange.end, activeToday]);

  // Index in sorted operational dates
  const currentIndex = availableDates.indexOf(activeDate);

  const handlePrevDay = () => {
    if (isRangeActive) {
      onChange({ start: dateRange.start, end: dateRange.start });
      return;
    }
    if (currentIndex > 0) {
      const prevDate = availableDates[currentIndex - 1];
      onChange({ start: prevDate, end: prevDate });
    } else {
      const d = new Date(activeDate + 'T12:00:00');
      d.setDate(d.getDate() - 1);
      const iso = d.toISOString().split('T')[0];
      onChange({ start: iso, end: iso });
    }
  };

  const handleNextDay = () => {
    if (isRangeActive) {
      onChange({ start: dateRange.end, end: dateRange.end });
      return;
    }
    if (currentIndex >= 0 && currentIndex < availableDates.length - 1) {
      const nextDate = availableDates[currentIndex + 1];
      onChange({ start: nextDate, end: nextDate });
    } else {
      const d = new Date(activeDate + 'T12:00:00');
      d.setDate(d.getDate() + 1);
      const iso = d.toISOString().split('T')[0];
      onChange({ start: iso, end: iso });
    }
  };

  const isToday = activeDate === activeToday && !isRangeActive;
  const canGoPrev = currentIndex === -1 || currentIndex > 0;
  const canGoNext = currentIndex === -1 || currentIndex < availableDates.length - 1;

  return (
    <div className="relative z-30 flex items-center gap-2">
      {/* ================= PRIMARY: CONTROLE DIÁRIO (ALTERAÇÃO DIÁRIA) ================= */}
      <div className="flex items-center bg-[#1c1b1b] border border-white/10 rounded-xl p-1 shadow-md">
        <button
          type="button"
          onClick={handlePrevDay}
          disabled={!canGoPrev && !isRangeActive}
          className="p-1.5 text-[#849396] hover:text-[#00e5ff] hover:bg-white/5 disabled:opacity-30 disabled:hover:text-[#849396] rounded-lg transition-all active:scale-95 cursor-pointer"
          title="Dia Anterior (Navegação Diária)"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Central Display: Data Atual com Seleção Direta */}
        <div className="relative flex items-center gap-2 px-3 py-1 cursor-pointer hover:bg-white/5 rounded-lg transition-colors group">
          <Calendar size={14} className="text-[#00e5ff] shrink-0" />
          <div className="flex items-center gap-1.5 select-none font-mono">
            {isRangeActive ? (
              <span className="text-xs font-bold text-[#00e5ff]">
                {formatDateBR(dateRange.start)} até {formatDateBR(dateRange.end)}
              </span>
            ) : (
              <>
                <span className="text-xs font-black text-white tracking-wide">
                  {formatDateBR(activeDate)}
                </span>
                {isToday && (
                  <span className="bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/30 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                    Hoje
                  </span>
                )}
              </>
            )}
          </div>
          {/* Input date transparente sobreposto para permitir clique direto e selecionar qualquer dia */}
          <input
            type="date"
            value={isRangeActive ? dateRange.start : activeDate}
            onChange={(e) => {
              if (e.target.value) {
                onChange({ start: e.target.value, end: e.target.value });
                setIsRangeOpen(false);
              }
            }}
            title="Clique para escolher uma data específica no calendário"
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full [color-scheme:dark]"
          />
        </div>

        <button
          type="button"
          onClick={handleNextDay}
          disabled={!canGoNext && !isRangeActive}
          className="p-1.5 text-[#849396] hover:text-[#00e5ff] hover:bg-white/5 disabled:opacity-30 disabled:hover:text-[#849396] rounded-lg transition-all active:scale-95 cursor-pointer"
          title="Próximo Dia (Navegação Diária)"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Botão rápido para retornar a Hoje se estiver em outro dia ou em intervalo */}
      {(!isToday || isRangeActive) && (
        <button
          type="button"
          onClick={() => {
            onChange({ start: activeToday, end: activeToday });
            setIsRangeOpen(false);
          }}
          className="flex items-center gap-1 bg-[#00e5ff]/15 hover:bg-[#00e5ff]/25 text-[#00e5ff] border border-[#00e5ff]/30 px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm active:scale-95 cursor-pointer"
          title={`Ir diretamente para o dia atual (${formatDateBR(activeToday)})`}
        >
          <Clock size={11} />
          <span>Hoje</span>
        </button>
      )}

      {/* ================= OPÇÃO SECUNDÁRIA: BUSCAR ENTRE DATAS (INTERVALO) ================= */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsRangeOpen(!isRangeOpen)}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all active:scale-95 cursor-pointer",
            isRangeActive 
              ? "bg-[#00e5ff]/20 text-[#00e5ff] border-[#00e5ff]/40 shadow-sm"
              : isRangeOpen
                ? "bg-white/10 text-white border-white/20"
                : "bg-[#1c1b1b] text-[#849396] hover:text-white border-white/10 hover:bg-white/5"
          )}
          title="Opção secundária: Buscar entre datas (filtro por intervalo)"
        >
          <CalendarRange size={13} className={isRangeActive ? "text-[#00e5ff]" : "text-[#849396]"} />
          <span className="hidden sm:inline">
            {isRangeActive ? "Intervalo Ativo" : "Buscar entre datas"}
          </span>
        </button>

        {isRangeOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsRangeOpen(false)} />
            <div className="absolute top-full right-0 mt-2 w-80 bg-[#1c1b1b] border border-white/15 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] z-50 p-4 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <div className="flex items-center gap-2">
                  <CalendarRange size={15} className="text-[#00e5ff]" />
                  <span className="text-xs font-black uppercase tracking-wider text-white">
                    Buscar entre Datas
                  </span>
                </div>
                <span className="text-[9px] font-bold text-[#849396] bg-white/5 px-2 py-0.5 rounded uppercase">
                  Opção Secundária
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-[#849396] uppercase mb-1 block">Data Inicial:</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full bg-[#131313] border border-white/10 rounded-lg p-2 text-xs font-mono text-white outline-none focus:ring-1 focus:ring-[#00e5ff] [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#849396] uppercase mb-1 block">Data Final:</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full bg-[#131313] border border-white/10 rounded-lg p-2 text-xs font-mono text-white outline-none focus:ring-1 focus:ring-[#00e5ff] [color-scheme:dark]"
                  />
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (customStart && customEnd) {
                        onChange({ start: customStart, end: customEnd });
                        setIsRangeOpen(false);
                      }
                    }}
                    className="w-full text-xs font-bold bg-[#00e5ff] text-[#00363d] py-2 rounded-xl hover:opacity-90 uppercase tracking-tight shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    Aplicar Intervalo
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onChange({ start: activeDate, end: activeDate });
                        setIsRangeOpen(false);
                      }}
                      className="flex-1 text-[10px] font-bold bg-[#2a2929] hover:bg-[#353534] text-[#849396] hover:text-white py-1.5 rounded-lg uppercase tracking-tight transition-colors cursor-pointer"
                      title="Voltar para alteração diária"
                    >
                      Voltar ao Diário
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onChange({ start: activeToday, end: activeToday });
                        setIsRangeOpen(false);
                      }}
                      className="flex-1 text-[10px] font-bold bg-[#00e5ff]/15 hover:bg-[#00e5ff]/25 text-[#00e5ff] py-1.5 rounded-lg uppercase tracking-tight transition-colors cursor-pointer"
                    >
                      Hoje ({formatDateBR(activeToday)})
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Alias for backwards compatibility
const DateRangeSelector = DailyDateNavigator;

const FleetActivePage = ({ 
  fleet, 
  statusFilter, setStatusFilter, 
  typeFilter, setTypeFilter, 
  dateRange, setDateRange,
  availableTypes, availableStatus,
  availableDates,
  clearFilters, isFiltered,
  latestDate
}: any) => {
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' | null }>({ key: 'date', direction: 'desc' });
  const [quickTab, setQuickTab] = useState<'all' | 'propria' | 'agregados' | 'viagem' | 'manutencao' | 'disponivel'>('all');

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const quickFilteredFleet = useMemo(() => {
    if (quickTab === 'propria') return fleet.filter((v: any) => !(v.tipo || '').toUpperCase().includes('AGREG'));
    if (quickTab === 'agregados') return fleet.filter((v: any) => (v.tipo || '').toUpperCase().includes('AGREG'));
    if (quickTab === 'viagem') return fleet.filter((v: any) => (v.status || '').toUpperCase().includes('VIAGEM') || v.status === 'ESCALADO');
    if (quickTab === 'manutencao') return fleet.filter((v: any) => (v.status || '').toUpperCase().includes('MANUTEN') || v.status === 'SINISTRO');
    if (quickTab === 'disponivel') return fleet.filter((v: any) => (v.status || '').toUpperCase().includes('DISPON'));
    return fleet;
  }, [fleet, quickTab]);

  const sortedFleet = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return quickFilteredFleet;

    return [...quickFilteredFleet].sort((a: any, b: any) => {
      let valA = a[sortConfig.key] || '';
      let valB = b[sortConfig.key] || '';

      if (sortConfig.key === 'date') {
        valA = normalizeToISODate(valA);
        valB = normalizeToISODate(valB);
      }

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [quickFilteredFleet, sortConfig]);

  const stats = useMemo(() => {
    const total = fleet.length;
    const maintenance = fleet.filter((v: any) => 
      v.status === 'EM MANUTENÇÃO' || v.status === 'MANUTENÇÃO' || (v.status || '').includes('MANUTEN') || v.status === 'SINISTRO'
    ).length;
    
    const operationStatuses = ['A CAMINHO', 'ENTRE VIAGENS', 'ESCALADO', 'MANTIDO NA VIAGEM', 'RETORNANDO DA VIAGEM', 'EM VIAGEM'];
    const inOperation = fleet.filter((v: any) => operationStatuses.includes(v.status)).length;
    
    // EM VIAGEM
    const inTrip = fleet.filter((v: any) => v.status === 'EM VIAGEM' || v.status === 'ESCALADO').length;
    
    // DISPONÍVEL
    const available = fleet.filter((v: any) => (v.status || '').includes('DISPON')).length;

    // APOIO / VIRA
    const supportOrVira = fleet.filter((v: any) => ['APOIO', 'VIRA', 'FORA DE ESCALA', 'S/ MOTORISTA'].includes(v.status)).length;

    const safeTotal = total || 1;
    const opRate = (inOperation / safeTotal) * 100;
    const tripRate = (inTrip / safeTotal) * 100;
    const maintenanceRate = (maintenance / safeTotal) * 100;
    const supportRate = (supportOrVira / safeTotal) * 100;

    return { total, maintenance, inOperation, inTrip, supportOrVira, available, opRate, tripRate, maintenanceRate, supportRate };
  }, [fleet]);

  const statusColor = useMemo(() => {
    if (stats.total === 0) return "bg-[#849396]";
    if (stats.maintenanceRate > 20) return "bg-[#ffb4ab]";
    if (stats.opRate > 70) return "bg-[#77ff61]";
    return "bg-[#ffb870]";
  }, [stats]);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard label="FROTA EM OPERAÇÃO" value={stats.inOperation} trend={`${stats.opRate.toFixed(1)}%`} progress={stats.opRate} color="text-[#77ff61]" icon={Truck} />
        <StatCard label="EM VIAGEM" value={stats.inTrip} trend={`${stats.tripRate.toFixed(1)}%`} description="Em rota ativa" color="text-[#00e5ff]" icon={CheckCircle} progress={stats.tripRate} />
        <StatCard 
          label="MANUTENÇÃO / SINISTRO" 
          value={stats.maintenance} 
          trend={`${stats.maintenanceRate.toFixed(1)}%`}
          description="Ação imediata necessária" 
          color="text-[#ffb4ab]" 
          icon={AlertTriangle} 
          isAlert={stats.maintenance > 0}
          progress={stats.maintenanceRate}
        />
        <StatCard label="DISPONÍVEL / APOIO" value={stats.available + stats.supportOrVira} trend={`${(((stats.available + stats.supportOrVira) / (stats.total || 1)) * 100).toFixed(1)}%`} description="Livres ou suporte" color="text-[#ffb870]" icon={Users} progress={((stats.available + stats.supportOrVira) / (stats.total || 1)) * 100} />
      </div>

    {/* Filters Bar */}
    <div className="bg-[#201f1f]/80 backdrop-blur-md p-3 rounded-xl border border-white/5 flex flex-wrap items-center gap-4 relative z-20">
      <div className="flex items-center gap-2 text-[#849396] px-2 border-r border-white/5 mr-2">
        <Filter size={14} />
        <span className="text-[10px] font-bold uppercase tracking-widest">Filtros Ativos</span>
      </div>
      
      <MultiSelect 
        label="Tipo" 
        options={availableTypes} 
        selected={typeFilter} 
        onChange={setTypeFilter} 
      />

      <MultiSelect 
        label="Status" 
        options={availableStatus} 
        selected={statusFilter} 
        onChange={setStatusFilter} 
      />

      <DailyDateNavigator 
        dateRange={dateRange}
        onChange={setDateRange} 
        availableDates={availableDates}
        todayDate={latestDate}
      />

      {isFiltered && (
        <button 
          onClick={clearFilters}
          className="text-[10px] font-bold text-[#ffb4ab] hover:text-white px-3 py-1.5 bg-[#ffb4ab]/10 rounded-lg border border-[#ffb4ab]/20 transition-all flex items-center gap-1 ml-auto md:ml-0 uppercase"
        >
          <RefreshCcw size={12} />
          LIMPAR TUDO
        </button>
      )}

      <div className="flex-1 hidden md:block" />
      <TooltipWrapper content="Cadastrar lançamento operacional" position="left">
        <button 
          onClick={() => alert('Para cadastrar uma nova viagem, preencha os dados no formulário operacional ou sincronize a planilha.')}
          className="bg-[#00e5ff] text-[#00626e] px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 active:scale-95 transition-all"
        >
          <Plus size={14} strokeWidth={3} />
          NOVA VIAGEM
        </button>
      </TooltipWrapper>
    </div>

    {/* Quick Segment Filter Chips */}
    <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
      {[
        { id: 'all', label: `Todos (${fleet.length})` },
        { id: 'propria', label: `Frota Própria (${fleet.filter((v: any) => !(v.tipo || '').toUpperCase().includes('AGREG')).length})` },
        { id: 'agregados', label: `Agregados (${fleet.filter((v: any) => (v.tipo || '').toUpperCase().includes('AGREG')).length})` },
        { id: 'viagem', label: `Em Viagem (${fleet.filter((v: any) => (v.status || '').toUpperCase().includes('VIAGEM') || v.status === 'ESCALADO').length})` },
        { id: 'manutencao', label: `Manutenção (${fleet.filter((v: any) => (v.status || '').toUpperCase().includes('MANUTEN') || v.status === 'SINISTRO').length})` },
        { id: 'disponivel', label: `Disponíveis (${fleet.filter((v: any) => (v.status || '').toUpperCase().includes('DISPON')).length})` },
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => setQuickTab(tab.id as any)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap",
            quickTab === tab.id 
              ? "bg-[#00e5ff] text-[#00363d] shadow-md shadow-[#00e5ff]/20" 
              : "bg-[#252424] text-[#849396] hover:text-white hover:bg-[#353534]"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>

    {/* Table */}
    <div className="bg-[#201f1f]/80 backdrop-blur-md rounded-xl overflow-hidden border border-white/5">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#353534]/50">
              {[
                { label: 'DATA', key: 'date' },
                { label: 'TIPO', key: 'tipo' },
                { label: 'CAVALO', key: 'cavalo' },
                { label: 'MOTORISTA', key: 'motorista' },
                { label: 'STATUS', key: 'status' },
                { label: 'LOCAL', key: 'local' },
                { label: 'OBS', key: 'obs' }
              ].map(col => (
                <th 
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={cn(
                    "p-3 text-[11px] font-bold text-[#849396] uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors group whitespace-nowrap",
                    sortConfig.key === col.key && "text-[#00e5ff]"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {col.key === 'status' && (
                      <TooltipWrapper content={`Status Geral: ${stats.maintenance > stats.inOperation ? 'Atenção' : 'Operacional'}`} position="top">
                        <div className={cn("w-2 h-2 rounded-full", statusColor)} />
                      </TooltipWrapper>
                    )}
                    {col.label}
                    <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                      <Plus size={8} className={cn("rotate-45", sortConfig.key === col.key && sortConfig.direction === 'asc' ? "text-[#00e5ff]" : "text-[#849396]/30")} />
                    </div>
                  </div>
                </th>
              ))}
              <th className="p-3 text-[11px] font-bold text-[#849396] uppercase tracking-wider text-right">AÇÕES</th>
            </tr>
          </thead>
          <tbody className="text-[13px] font-mono">
            {sortedFleet.map((vehicle: any) => (
              <motion.tr 
                key={vehicle.id} 
                whileHover={{ scale: 1.002, backgroundColor: "rgba(255, 255, 255, 0.05)", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)" }}
                className="border-b border-white/5 hover:bg-[#2a2a2a] transition-colors group cursor-pointer"
              >
                <td className="p-3">
                  <span className="text-[#849396] text-[10px] font-mono whitespace-nowrap">
                    {formatDateBR(vehicle.date)}
                  </span>
                </td>
                <td className="p-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-1.5 h-6 rounded-full shrink-0",
                      vehicle.status === 'SINISTRO' ? "bg-[#ffb4ab] animate-pulse" : 
                      (vehicle.status === 'MANUTENÇÃO' || vehicle.status === 'EM MANUTENÇÃO' || (vehicle.status || '').includes('MANUTEN')) ? "bg-[#ff5555]" : 
                      (vehicle.status === 'EM VIAGEM' || vehicle.status === 'ESCALADO' || vehicle.status === 'A CAMINHO') ? "bg-[#00e5ff]" : 
                      vehicle.status === 'MANTIDO NA VIAGEM' ? "bg-[#28ff1d]" : 
                      (vehicle.status || '').includes('DISPON') ? "bg-[#38bdf8]" : "bg-[#ffb870]"
                    )} />
                    <span className="text-[#849396] text-[10px] font-bold">{vehicle.tipo}</span>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex flex-col">
                    <span className="font-bold text-[#c3f5ff]">{vehicle.cavalo}</span>
                    {vehicle.carreta && (
                      <span className="text-[10px] text-[#849396]">/ {vehicle.carreta}</span>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-[#849396]" />
                    <span>{vehicle.motorista || 'Sem motorista'}</span>
                  </div>
                </td>
                <td className="p-3 whitespace-nowrap"><StatusBadge status={vehicle.status} /></td>
                <td className="p-3 text-[#bac9cc] truncate max-w-[180px]">
                  {cleanLocation(vehicle.local)}
                </td>
                <td className="p-3 text-[#849396] italic text-xs truncate max-w-[220px]">{vehicle.obs || '-'}</td>
                <td className="p-3 text-right">
                  <TooltipWrapper content="Ver detalhes e opções extras" position="left">
                    <button className="text-[#849396] hover:text-[#c3f5ff] transition-colors p-1">
                      <MoreVertical size={16} />
                    </button>
                  </TooltipWrapper>
                </td>
              </motion.tr>
            ))}

            {sortedFleet.length === 0 && (
              <tr>
                <td colSpan={8} className="p-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Filter size={36} className="text-[#849396]/40" />
                    <p className="text-sm font-bold text-[#e5e2e1]">Nenhum veículo encontrado com os filtros selecionados</p>
                    <p className="text-xs text-[#849396]">Tente ajustar a busca, data ou filtros de status/tipo.</p>
                    {isFiltered && (
                      <button
                        onClick={clearFilters}
                        className="mt-2 px-4 py-2 bg-[#00e5ff] text-[#00363d] rounded-lg text-xs font-black uppercase tracking-wider hover:opacity-90"
                      >
                        Limpar Filtros e Exibir Frota Total
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="p-3 bg-[#1c1b1b] border-t border-white/5 flex justify-between items-center text-xs">
        <span className="text-[#849396]">Listagem atual: {sortedFleet.length} de {fleet.length} veículos</span>
        <div className="text-[#849396] flex items-center gap-2">
          <Clock size={12} />
          <span>Sincronizado com Google Sheets</span>
        </div>
      </div>
      </div>
    </div>
  );
};

const MonitoringPage = ({ fleet }: { fleet: FleetVehicle[] }) => {
  // Centro inicial padrão: Base Matriz da Empresa (Chico de Paula, Santos - SP)
  const [mapCenter, setMapCenter] = useState({ lat: -23.93298, lng: -46.37083 });
  const [zoom, setZoom] = useState(13);
  const [activeLayer, setActiveLayer] = useState<'dark' | 'satellite' | 'street'>('dark');

  // Unificar por placa do cavalo (evita duplicar rodotrem com 2 carretas no mapa)
  const unifiedFleet = useMemo(() => {
    const plateMap = new Map<string, FleetVehicle>();
    fleet.forEach(v => {
      const plate = (v.cavalo?.trim() || v.tag?.trim() || v.id?.trim() || '').toUpperCase();
      if (!plate) return;
      const existing = plateMap.get(plate);
      if (!existing) {
        plateMap.set(plate, v);
      } else {
        const merged = { ...v };
        if (!merged.obs && existing.obs) merged.obs = existing.obs;
        if (existing.carreta && merged.carreta && existing.carreta !== merged.carreta) {
          merged.carreta = `${existing.carreta} / ${merged.carreta}`;
        } else if (!merged.carreta && existing.carreta) {
          merged.carreta = existing.carreta;
        }
        plateMap.set(plate, merged);
      }
    });
    return Array.from(plateMap.values());
  }, [fleet]);

  // Pre-calculate positions: veículos sem cidade citada são automaticamente posicionados na Base Santos (Chico de Paula)
  const positionedFleet = useMemo(() => {
    return assignVehiclePositions(unifiedFleet);
  }, [unifiedFleet]);

  const vehiclesAtBaseCount = useMemo(() => {
    return positionedFleet.filter(v => v.cityName?.includes('Base') || v.isAtBase || !v.local).length;
  }, [positionedFleet]);

  const otherCitiesCount = positionedFleet.length - vehiclesAtBaseCount;

  const handleVehicleSelect = (v: any) => {
    if (v.position && !isNaN(v.position.lat) && !isNaN(v.position.lng)) {
      setMapCenter(v.position);
      setZoom(15);
    }
  };

  const handleFitAll = () => {
    if (positionedFleet.length === 0) return;
    const lats = positionedFleet.map(v => v.position.lat);
    const lngs = positionedFleet.map(v => v.position.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    setMapCenter({ lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 });
    setZoom(12);
  };

  return (
    <div className="h-full relative overflow-hidden rounded-2xl border border-white/5 bg-[#131313]">
      {/* 100% Free Interactive Map (Satélite HD / Noturno / Ruas) */}
      <LeafletFleetMap
        fleet={positionedFleet}
        center={mapCenter}
        zoom={zoom}
        activeLayer={activeLayer}
        onLayerChange={setActiveLayer}
        onVehicleClick={handleVehicleSelect}
      />

      {/* Map Header Overlay */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-30">
        <div className="bg-[#201f1f]/90 backdrop-blur-md p-3 border border-white/10 rounded-xl pointer-events-auto flex items-center gap-4">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2 text-white">
              <div className="w-2 h-2 bg-[#77ff61] rounded-full animate-pulse" />
              Monitoramento Geográfico
            </h3>
            <p className="text-[10px] text-[#849396] font-mono mt-0.5">
              {positionedFleet.length} veículos rastreados ({vehiclesAtBaseCount} na Base Santos Chico de Paula • {otherCitiesCount} em rota/outras cidades)
            </p>
          </div>

          {/* Layer Switcher */}
          <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10 text-[10px] font-bold">
            <button
              onClick={() => setActiveLayer('dark')}
              className={cn(
                "px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
                activeLayer === 'dark' ? "bg-[#00e5ff] text-[#00363d] shadow-sm font-black" : "text-[#849396] hover:text-white"
              )}
            >
              <Moon size={11} className={activeLayer === 'dark' ? "fill-current" : ""} />
              Noturno
            </button>
            <button
              onClick={() => setActiveLayer('satellite')}
              className={cn(
                "px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
                activeLayer === 'satellite' ? "bg-[#00e5ff] text-[#00363d] shadow-sm font-black" : "text-[#849396] hover:text-white"
              )}
            >
              <Globe size={11} />
              Satélite
            </button>
            <button
              onClick={() => setActiveLayer('street')}
              className={cn(
                "px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
                activeLayer === 'street' ? "bg-[#00e5ff] text-[#00363d] shadow-sm font-black" : "text-[#849396] hover:text-white"
              )}
            >
              <Sun size={11} />
              Ruas
            </button>
          </div>
        </div>
        
        <div className="bg-[#201f1f]/90 backdrop-blur-md p-2 border border-white/10 rounded-xl flex gap-1 pointer-events-auto">
           <div className="flex flex-col items-center px-3 border-r border-white/5">
             <span className="text-[8px] font-bold text-[#849396] uppercase">Operação</span>
             <div className="flex items-baseline gap-1">
               <span className="text-xs font-bold text-[#77ff61] font-mono">{unifiedFleet.filter(v => v.status !== 'EM MANUTENÇÃO' && v.status !== 'SINISTRO').length}</span>
               <span className="text-[8px] text-[#849396] font-mono">{((unifiedFleet.filter(v => v.status !== 'EM MANUTENÇÃO' && v.status !== 'SINISTRO').length / (unifiedFleet.length || 1)) * 100).toFixed(0)}%</span>
             </div>
           </div>
           <div className="flex flex-col items-center px-3 border-r border-white/5">
             <span className="text-[8px] font-bold text-[#849396] uppercase">Parado</span>
             <div className="flex items-baseline gap-1">
               <span className="text-xs font-bold text-[#ffb870] font-mono">{unifiedFleet.filter(v => v.status === 'EM MANUTENÇÃO').length}</span>
               <span className="text-[8px] text-[#849396] font-mono">{((unifiedFleet.filter(v => v.status === 'EM MANUTENÇÃO').length / (unifiedFleet.length || 1)) * 100).toFixed(0)}%</span>
             </div>
           </div>
           <div className="flex flex-col items-center px-3">
             <span className="text-[8px] font-bold text-[#849396] uppercase">Alerta</span>
             <div className="flex items-baseline gap-1">
               <span className="text-xs font-bold text-[#ffb4ab] font-mono">{unifiedFleet.filter(v => v.status === 'SINISTRO').length}</span>
               <span className="text-[8px] text-[#849396] font-mono">{((unifiedFleet.filter(v => v.status === 'SINISTRO').length / (unifiedFleet.length || 1)) * 100).toFixed(0)}%</span>
             </div>
           </div>
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-30">
        <div className="bg-[#201f1f]/90 backdrop-blur-md p-1 border border-white/10 rounded-xl flex flex-col items-center shadow-xl">
          <button onClick={() => setZoom(z => Math.min(18, z + 1))} className="p-2 hover:bg-[#353534] rounded text-[#bac9cc] transition-colors" title="Aproximar zoom"><Plus size={18} /></button>
          <div className="w-full h-px bg-white/5" />
          <button onClick={() => setZoom(z => Math.max(3, z - 1))} className="p-2 hover:bg-[#353534] rounded text-[#bac9cc] transition-colors" title="Afastar zoom"><Plus size={18} className="rotate-45" /></button>
          <div className="w-full h-px bg-white/5" />
          <button onClick={handleFitAll} className="p-2 hover:bg-[#353534] rounded text-[#00e5ff] transition-colors" title="Enquadrar toda a frota"><Maximize2 size={16} /></button>
        </div>
      </div>

      {/* Right Sidebar - Showing vehicles */}
      <div className="absolute top-28 right-6 bottom-24 w-64 flex flex-col gap-4 pointer-events-none z-30">
        <div className="flex-1 bg-[#201f1f]/90 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden flex flex-col pointer-events-auto shadow-2xl">
          <div className="p-3 border-b border-white/10 bg-white/5 flex items-center justify-between">
            <h3 className="font-bold text-[10px] text-white uppercase tracking-widest">Frota na Planilha</h3>
            <span className="text-[9px] font-mono text-[#00e5ff]">{positionedFleet.length} unid</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2.5 invisible-scrollbar">
            {positionedFleet.map(v => (
              <motion.div 
                key={v.id} 
                onClick={() => handleVehicleSelect(v)}
                whileHover={{ scale: 1.03, boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)", borderColor: "rgba(0, 229, 255, 0.5)" }}
                className={cn(
                  "p-3 rounded-lg border transition-all cursor-pointer group active:scale-95 flex flex-col justify-center min-h-[60px]",
                  v.position 
                    ? "bg-[#131313]/60 border-l-2 border-[#00e5ff] border-white/5 hover:bg-[#353534]" 
                    : "bg-[#131313]/30 border-l-2 border-white/20 border-white/5 opacity-70"
                )}
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[12px] font-bold text-white transition-colors group-hover:text-[#00e5ff]">{v.cavalo}</span>
                    {v.cityName && v.cityName !== 'Não informado' && (
                      <span className="text-[9px] font-bold text-[#bac9cc] bg-white/5 px-1 py-0.5 rounded">
                        {v.cityName}
                      </span>
                    )}
                  </div>
                  <span className={cn(
                    "text-[8px] font-bold px-1.5 py-0.5 rounded-full",
                    v.status === 'SINISTRO' ? 'text-[#ffb4ab] bg-[#ffb4ab]/10' : 
                    v.status === 'EM MANUTENÇÃO' ? 'text-[#ffb870] bg-[#ffb870]/10' :
                    'text-[#00e5ff] bg-[#00e5ff]/10'
                  )}>{v.status}</span>
                </div>
                <p className="text-[10px] text-[#bac9cc] truncate leading-tight font-medium">{v.motorista || 'Sem motorista'}</p>
                <p className={cn(
                  "text-[9px] truncate leading-tight mt-0.5 font-semibold",
                  v.position ? "text-[#00e5ff]" : "text-[#849396] italic"
                )}>
                  📍 {v.displayLocation}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ReportsPage = ({ fleet, dateRange, showToast }: { fleet: FleetVehicle[], dateRange: { start: string, end: string }, showToast: (msg: string, type?: 'success' | 'info' | 'error') => void }) => {
  const [reportPeriod, setReportPeriod] = useState<'diario' | 'semanal' | 'mensal'>('mensal');

  const stats = useMemo(() => {
    // 1. Filtrar com base no período selecionado ou dateRange global
    const startDate = dateRange.start;
    const endDate = dateRange.end;

    let filteredFleet = fleet;

    if (reportPeriod === 'diario' && startDate) {
      filteredFleet = fleet.filter(v => normalizeToISODate(v.date) === startDate);
    } else if (reportPeriod === 'semanal' && startDate) {
      const startMs = new Date(startDate + 'T00:00:00').getTime();
      const endMs = startMs + (7 * 24 * 60 * 60 * 1000);
      filteredFleet = fleet.filter(v => {
        const iso = normalizeToISODate(v.date);
        if (!iso) return false;
        const vMs = new Date(iso + 'T00:00:00').getTime();
        return vMs >= startMs && vMs <= endMs;
      });
    } else if (reportPeriod === 'mensal' && startDate) {
      const monthPrefix = startDate.substring(0, 7); // YYYY-MM
      filteredFleet = fleet.filter(v => {
        const iso = normalizeToISODate(v.date);
        return iso && iso.startsWith(monthPrefix);
      });
    } else if (startDate && endDate) {
      filteredFleet = fleet.filter(v => {
        const iso = normalizeToISODate(v.date);
        return iso && iso >= startDate && iso <= endDate;
      });
    } else {
      const monthCounts: Record<string, number> = {};
      fleet.forEach(v => {
        const iso = normalizeToISODate(v.date);
        if (iso && iso.length === 10) {
          const mKey = iso.substring(0, 7);
          monthCounts[mKey] = (monthCounts[mKey] || 0) + 1;
        }
      });
      const sortedMonths = Object.keys(monthCounts).sort();
      const currentMonthKey = sortedMonths[sortedMonths.length - 1] || new Date().toISOString().substring(0, 7);
      filteredFleet = fleet.filter(v => {
        const iso = normalizeToISODate(v.date);
        return iso && iso.startsWith(currentMonthKey);
      });
    }

    // Unificar por placa do cavalo para métricas de unidades únicas (evitando rodotrem duplicado por linhas)
    const plateMap = new Map<string, FleetVehicle>();
    filteredFleet.forEach(v => {
      const plate = (v.cavalo?.trim() || v.tag?.trim() || v.id?.trim() || '').toUpperCase();
      if (!plate) return;
      if (!plateMap.has(plate)) {
        plateMap.set(plate, v);
      } else {
        const existing = plateMap.get(plate)!;
        const merged = { ...v };
        if (!merged.obs && existing.obs) merged.obs = existing.obs;
        plateMap.set(plate, merged);
      }
    });

    const uniqueFleet = Array.from(plateMap.values());
    const total = uniqueFleet.length;

    const maintenance = uniqueFleet.filter(v => 
      v.status === 'EM MANUTENÇÃO' || v.status === 'MANUTENÇÃO' || (v.status || '').includes('MANUTEN') || v.status === 'SINISTRO'
    ).length;

    const opStatuses = ['A CAMINHO', 'ENTRE VIAGENS', 'ESCALADO', 'MANTIDO NA VIAGEM', 'RETORNANDO DA VIAGEM', 'EM VIAGEM'];
    const inOperation = uniqueFleet.filter(v => opStatuses.includes(v.status)).length;
    const idle = Math.max(0, total - maintenance - inOperation);

    const safeTotal = total || 1;

    // Status Pie Data
    const statusCounts = uniqueFleet.reduce((acc: any, v) => {
      const s = v.status || 'OUTROS';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
    
    const statusPieData = Object.keys(statusCounts).map(key => ({
      name: key,
      value: statusCounts[key],
      percentage: Number(((statusCounts[key] / safeTotal) * 100).toFixed(1))
    })).sort((a, b) => b.value - a.value);

    // Trend Data
    const datesMap = filteredFleet.reduce((acc: any, v) => {
      const date = normalizeToISODate(v.date);
      if (!date) return acc;
      if (!acc[date]) acc[date] = { date, available: 0, total: 0 };
      acc[date].total++;
      if (!['EM MANUTENÇÃO', 'MANUTENÇÃO', 'SINISTRO'].includes(v.status) && !(v.status || '').includes('MANUTEN')) {
        acc[date].available++;
      }
      return acc;
    }, {});

    let trendData = Object.values(datesMap)
      .sort((a: any, b: any) => a.date.localeCompare(b.date))
      .map((d: any) => ({
        name: formatDateBR(d.date),
        rate: d.total > 0 ? Number(((d.available / d.total) * 100).toFixed(1)) : 0,
        count: d.available
      }));

    // Type vs Status Breakdown
    const typeAnalysis = uniqueFleet.reduce((acc: any, v) => {
      const tipo = v.tipo || 'OUTROS';
      if (!acc[tipo]) acc[tipo] = { name: tipo, operacao: 0, manutencao: 0, total: 0 };
      acc[tipo].total++;
      if (['EM MANUTENÇÃO', 'MANUTENÇÃO', 'SINISTRO'].includes(v.status) || (v.status || '').includes('MANUTEN')) {
        acc[tipo].manutencao++;
      } else {
        acc[tipo].operacao++;
      }
      return acc;
    }, {});

    const typeChartData = Object.values(typeAnalysis).sort((a: any, b: any) => b.total - a.total);
    const sinistros = uniqueFleet.filter(v => v.status === 'SINISTRO').length;

    let periodLabel = "Mês Vigente";
    if (reportPeriod === 'diario') periodLabel = `Diário (${startDate ? formatDateBR(startDate) : ''})`;
    if (reportPeriod === 'semanal') periodLabel = `Semanal (${startDate ? formatDateBR(startDate) : ''})`;
    if (reportPeriod === 'mensal') {
      const m = startDate ? startDate.substring(0, 7) : new Date().toISOString().substring(0, 7);
      const [year, month] = m.split('-');
      const monthNames = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      periodLabel = `${monthNames[parseInt(month, 10)] || month}/${year}`;
    }

    return { 
      total, 
      maintenance, 
      inOperation, 
      idle,
      sinistros,
      statusPieData,
      trendData,
      typeChartData,
      periodLabel,
      uniqueFleet,
      availabilityRate: ((inOperation + idle) / safeTotal) * 100
    };
  }, [fleet, dateRange, reportPeriod]);

  const STATUS_COLOR_MAP: Record<string, string> = {
    'EM VIAGEM': '#00e5ff',
    'ESCALADO': '#00e5ff',
    'A CAMINHO': '#93c5fd',
    'RETORNANDO DA VIAGEM': '#93c5fd',
    'MANTIDO NA VIAGEM': '#10b981',
    'ENTRE VIAGENS': '#60a5fa',
    'DISPONÍVEL': '#38bdf8',
    'ESTACIONADO': '#38bdf8',
    'MANUTENÇÃO': '#ef4444',
    'EM MANUTENÇÃO': '#ef4444',
    'SINISTRO': '#94a3b8',
    'S/ MOTORISTA': '#f97316',
    'FORA DE ESCALA': '#fb923c',
    'VIRA': '#c084fc',
    'APOIO': '#e879f9'
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (!percent || isNaN(percent) || percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 1.3;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="#849396" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-[10px] font-bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const exportToExcel = () => {
    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
          th { background-color: #00363d; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #cccccc; text-align: left; }
          td { padding: 8px; border: 1px solid #cccccc; font-size: 11px; }
          .title { font-size: 16px; font-weight: bold; color: #00363d; margin-bottom: 5px; }
          .subtitle { font-size: 12px; color: #555555; margin-bottom: 15px; }
          .kpi { background-color: #f0f8ff; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="title">COSTA SCALE - RELATÓRIO DE PERFORMANCE OPERACIONAL</div>
        <div class="subtitle">Período: ${stats.periodLabel} | Gerado em: ${new Date().toLocaleString()}</div>
        <table>
          <tr>
            <th colspan="2" class="kpi">RESUMO DE INDICADORES</th>
          </tr>
          <tr><td>Total de Frota (Unidades Únicas)</td><td><b>${stats.total}</b></td></tr>
          <tr><td>Disponibilidade Global</td><td><b>${stats.availabilityRate.toFixed(1)}%</b></td></tr>
          <tr><td>Em Operação</td><td><b>${stats.inOperation}</b></td></tr>
          <tr><td>Em Manutenção / Sinistro</td><td><b>${stats.maintenance}</b></td></tr>
          <tr><td>Sinistros</td><td><b>${stats.sinistros}</b></td></tr>
        </table>
        <br/><br/>
        <table>
          <thead>
            <tr>
              <th>PLACA (CAVALO)</th>
              <th>CARRETA</th>
              <th>TIPO</th>
              <th>MOTORISTA</th>
              <th>STATUS OPERACIONAL</th>
              <th>DATA</th>
              <th>LOCALIZAÇÃO</th>
            </tr>
          </thead>
          <tbody>
            ${stats.uniqueFleet.map((v, i) => `
              <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f9f9f9'};">
                <td><b>${v.cavalo || ''}</b></td>
                <td>${v.carreta || ''}</td>
                <td>${v.tipo || ''}</td>
                <td>${v.motorista || ''}</td>
                <td><b>${v.status || ''}</b></td>
                <td>${v.date ? formatDateBR(v.date) : ''}</td>
                <td>${v.displayLocation || v.local || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_frota_costa_scale_${stats.periodLabel.toLowerCase().replace(/[^a-z0-9]/g, '_')}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Relatório Excel exportado com sucesso!', 'success');
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Relatório de Performance - Costa Scale</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111; padding: 20px; margin: 0; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #00363d; padding-bottom: 15px; margin-bottom: 20px; }
          .meta { font-size: 11px; color: #555; text-align: right; }
          h1 { font-size: 18px; margin: 0 0 5px 0; color: #111; text-transform: uppercase; }
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }
          .kpi-card { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 12px; text-align: center; }
          .kpi-label { font-size: 9px; font-weight: bold; color: #6c757d; text-transform: uppercase; margin-bottom: 4px; }
          .kpi-value { font-size: 16px; font-weight: 900; color: #00363d; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10px; }
          th { background: #00363d; color: #fff; text-align: left; padding: 8px; font-weight: bold; }
          td { padding: 7px 8px; border-bottom: 1px solid #dee2e6; }
          tr:nth-child(even) { background: #f8f9fa; }
          .footer { margin-top: 30px; text-align: center; font-size: 9px; color: #6c757d; border-top: 1px solid #dee2e6; padding-top: 10px; }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Relatório de Performance Operacional</h1>
            <div style="font-size: 12px; color: #00363d; font-weight: bold; margin-top: 2px;">COSTA SCALE • Período: ${stats.periodLabel}</div>
          </div>
          <div class="meta">
            <div>Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}</div>
            <div>Total de Unidades: <b>${stats.total}</b></div>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Disponibilidade Global</div>
            <div class="kpi-value">${stats.availabilityRate.toFixed(1)}%</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Em Operação</div>
            <div class="kpi-value">${stats.inOperation}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Manutenção / Sinistro</div>
            <div class="kpi-value">${stats.maintenance}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Sinistros</div>
            <div class="kpi-value">${stats.sinistros}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>PLACA (CAVALO)</th>
              <th>CARRETA</th>
              <th>TIPO</th>
              <th>MOTORISTA</th>
              <th>STATUS OPERACIONAL</th>
              <th>DATA</th>
              <th>LOCALIZAÇÃO</th>
            </tr>
          </thead>
          <tbody>
            ${stats.uniqueFleet.map(v => `
              <tr>
                <td><b>${v.cavalo || ''}</b></td>
                <td>${v.carreta || ''}</td>
                <td>${v.tipo || ''}</td>
                <td>${v.motorista || ''}</td>
                <td><b>${v.status || ''}</b></td>
                <td>${v.date ? formatDateBR(v.date) : ''}</td>
                <td>${v.displayLocation || v.local || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Costa Scale • Sistema de Gestão e Telemetria de Frotas • Documento gerado automaticamente em ${new Date().toLocaleString('pt-BR')}
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    showToast('Relatório PDF/Impressão gerado com sucesso!', 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Relatórios de Performance</h2>
            <span className="bg-[#00e5ff]/15 text-[#00e5ff] border border-[#00e5ff]/30 text-xs font-mono font-bold px-3 py-1 rounded-xl uppercase">
              {stats.periodLabel}
            </span>
          </div>
          <p className="text-[#849396] text-sm font-medium">Business Intelligence & Operational Metrics (Consolidado)</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Perseguição de Período: Diário, Semanal, Mensal */}
          <div className="flex bg-[#1c1b1b] border border-white/10 p-1 rounded-xl">
            <button 
              onClick={() => setReportPeriod('diario')}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase", reportPeriod === 'diario' ? "bg-[#00e5ff] text-[#00363d]" : "text-[#849396] hover:text-white")}
            >
              Diário
            </button>
            <button 
              onClick={() => setReportPeriod('semanal')}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase", reportPeriod === 'semanal' ? "bg-[#00e5ff] text-[#00363d]" : "text-[#849396] hover:text-white")}
            >
              Semanal
            </button>
            <button 
              onClick={() => setReportPeriod('mensal')}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase", reportPeriod === 'mensal' ? "bg-[#00e5ff] text-[#00363d]" : "text-[#849396] hover:text-white")}
            >
              Mensal
            </button>
          </div>

          <button 
            onClick={exportToExcel}
            className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl font-bold text-[10px] flex items-center gap-2 transition-all uppercase tracking-widest border border-white/5 cursor-pointer"
            title="Baixar planilha Excel formatada (.xls)"
          >
            <Download size={14} /> Baixar Excel
          </button>
          <button 
            onClick={exportToPDF}
            className="bg-[#00e5ff] text-[#00363d] px-5 py-2 rounded-xl font-black text-[10px] flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all uppercase tracking-widest shadow-[0_8px_20px_rgba(0,229,255,0.2)] cursor-pointer"
            title="Gerar PDF / Imprimir relatório padronizado"
          >
            <BarChart3 size={14} /> Gerar PDF / Imprimir
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="DISPONIBILIDADE GLOBAL" 
          value={`${stats.availabilityRate.toFixed(1)}%`} 
          description="Meta: 92%" 
          color="text-[#00e5ff]" 
          progress={stats.availabilityRate}
          statusColor={stats.availabilityRate >= 90 ? "bg-[#77ff61]" : "bg-[#ffb4ab]"}
        />
        <StatCard 
          label="EFICIÊNCIA EM ROTA" 
          value={`${((stats.inOperation / stats.total) * 100).toFixed(1)}%`} 
          description="Veículos gerando receita" 
          color="text-[#28ff1d]" 
          progress={(stats.inOperation / stats.total) * 100}
        />
        <StatCard 
          label="IMPACTO MANUTENÇÃO" 
          value={stats.maintenance} 
          description="Unidades paradas hoje" 
          color="text-[#ffb4ab]" 
          isAlert={stats.maintenance > 10}
          progress={(stats.maintenance / stats.total) * 100}
        />
        <StatCard 
          label="FREQUÊNCIA SINISTROS" 
          value={stats.sinistros} 
          description="Registrados na frota" 
          color={stats.sinistros > 0 ? "text-[#ffb4ab]" : "text-[#849396]"} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trend Analysis */}
        <div className="lg:col-span-8 bg-[#201f1f] p-6 rounded-2xl border border-white/5 shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-[#00e5ff]" />
              Evolução da Disponibilidade (%)
            </h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#849396]">
                <div className="w-2 h-2 rounded-full bg-[#00e5ff]" /> Realizado
              </span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.trendData}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#353534" vertical={false} />
                <XAxis dataKey="name" stroke="#849396" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#849396" fontSize={10} tickLine={false} axisLine={false} domain={[60, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1c1b1b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="#00e5ff" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorRate)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Donut */}
        <div className="lg:col-span-4 bg-[#201f1f] p-6 rounded-2xl border border-white/5 shadow-xl flex flex-col">
          <h3 className="font-bold text-white mb-4 uppercase tracking-wider text-xs">Distribuição Operacional</h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="h-80 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 10, right: 10, bottom: 40, left: 10 }}>
                  <Pie
                    data={stats.statusPieData}
                    cx="50%"
                    cy="38%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                    labelLine={false}
                    label={renderCustomizedLabel}
                  >
                    {stats.statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLOR_MAP[entry.name] || '#bac9cc'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1c1b1b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                    formatter={(value: number, name: string) => [`${value} unidades`, name]}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    align="center"
                    iconType="circle" 
                    iconSize={7}
                    wrapperStyle={{ paddingTop: '10px', fontSize: '9px', lineHeight: '14px' }}
                    formatter={(val, entry: any) => (
                      <span className="text-[9px] text-[#849396] font-bold uppercase tracking-tight">
                        {val} <span className="text-white/40 ml-0.5">({entry.payload.percentage}%)</span>
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-white leading-none">{stats.total}</span>
                <span className="text-[8px] font-black text-[#00e5ff] uppercase tracking-[0.2em] mt-1">Frota</span>
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown by Type */}
        <div className="lg:col-span-12 bg-[#201f1f] p-8 rounded-2xl border border-white/5 shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="font-bold text-white text-lg">Capacidade vs Manutenção por Tipo</h3>
              <p className="text-xs text-[#849396]">Análise detalhada de gargalos operacionais</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.typeChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#353534" vertical={false} />
                <XAxis dataKey="name" stroke="#849396" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#849396" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#1c1b1b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Legend />
                <Bar dataKey="operacao" name="Em Operação" stackId="a" fill="#00e5ff" radius={[0, 0, 0, 0]} barSize={40} />
                <Bar dataKey="manutencao" name="Manutenção" stackId="a" fill="#ffb4ab" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'matrix' | 'overview' | 'fleet' | 'monitoring' | 'maintenance' | 'reports' | 'agregados' | 'alerts'>('matrix');
  const [fleet, setFleet] = useState<FleetVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'info' | 'error'} | null>(null);
  
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 1. Map of global metadata for each vehicle (tipo, motorista)
  const vehicleMetadata = useMemo(() => {
    const metaMap = new Map<string, { tipo: string, motorista: string }>();
    
    const isInvalid = (val: string) => {
      if (!val) return true;
      const v = val.toString().trim().toUpperCase();
      return v === '' || v === 'N/A' || v === 'NÃO INFORMADO' || v === '-' || v === '.' || v === 'NI' || v === 'NULL' || v === 'UNDEFINED';
    };

    fleet.forEach(v => {
      const plate = v.cavalo?.trim().toUpperCase();
      if (!plate) return;
      
      const existing = metaMap.get(plate);
      const rawTipo = v.tipo?.toString().trim().toUpperCase();
      const rawMoto = v.motorista?.toString().trim().toUpperCase();
      
      const validTipo = !isInvalid(rawTipo) ? rawTipo : null;
      const validMoto = !isInvalid(rawMoto) ? rawMoto : null;

      if (!existing) {
        metaMap.set(plate, { 
          tipo: validTipo || 'N/A', 
          motorista: validMoto || 'NÃO INFORMADO' 
        });
      } else {
        if (validTipo && (existing.tipo === 'N/A' || existing.tipo === '')) {
          existing.tipo = validTipo;
        }
        if (validMoto && (existing.motorista === 'NÃO INFORMADO' || existing.motorista === '')) {
          existing.motorista = validMoto;
        }
      }
    });
    return metaMap;
  }, [fleet]);

  // 2. Cleaned fleet with metadata applied to ALL rows
  const cleanFleet = useMemo(() => {
    const isInvalid = (val: string) => {
      if (!val) return true;
      const v = val.toString().trim().toUpperCase();
      return v === '' || v === 'N/A' || v === 'NÃO INFORMADO' || v === '-' || v === '.' || v === 'NI' || v === 'NULL' || v === 'UNDEFINED';
    };

    return fleet.map(v => {
      const plate = v.cavalo?.trim().toUpperCase();
      const meta = vehicleMetadata.get(plate);
      return {
        ...v,
        tipo: isInvalid(v.tipo) ? (meta?.tipo || 'N/A') : v.tipo.toString().trim().toUpperCase(),
        motorista: isInvalid(v.motorista) ? (meta?.motorista || 'NÃO INFORMADO') : v.motorista.toString().trim().toUpperCase()
      };
    });
  }, [fleet, vehicleMetadata]);

  // Extrair tipos e status únicos da frota para os filtros
  const availableTypes = useMemo(() => {
    const types = new Set(cleanFleet.map(v => v.tipo).filter(t => t && t !== 'N/A'));
    return Array.from(types).sort();
  }, [cleanFleet]);

  const availableStatus = useMemo(() => {
    const statuses = new Set(cleanFleet.map(v => v.status).filter(Boolean));
    return Array.from(statuses).sort();
  }, [cleanFleet]);

  // Datas operacionais únicas disponíveis para navegação diária (passo a passo)
  const availableDates = useMemo(() => {
    const datesSet = new Set<string>();
    cleanFleet.forEach(v => {
      const iso = normalizeToISODate(v.date);
      if (iso && iso.length === 10) datesSet.add(iso);
    });
    return Array.from(datesSet).sort();
  }, [cleanFleet]);

  // Filtro de data: SEMPRE inicia e se mantém no dia atual por padrão (nunca todo histórico)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const latestFleetDate = useMemo(() => {
    if (!cleanFleet.length) return todayStr;
    const dates = cleanFleet.map(v => normalizeToISODate(v.date)).filter(Boolean).sort();
    return dates[dates.length - 1] || todayStr;
  }, [cleanFleet, todayStr]);

  const currentDayISO = useMemo(() => {
    if (!cleanFleet.length) return todayStr;
    const hasToday = cleanFleet.some(v => normalizeToISODate(v.date) === todayStr);
    if (hasToday) return todayStr;
    // Se o dia de hoje não tiver linhas na planilha, usar a data mais recente disponível
    return latestFleetDate;
  }, [cleanFleet, todayStr, latestFleetDate]);

  const [dateRange, setDateRange] = useState<{ start: string, end: string }>({ start: todayStr, end: todayStr });

  // Sincronizar para o dia atual no carregamento dos dados
  useEffect(() => {
    if (cleanFleet.length > 0) {
      setDateRange({ start: currentDayISO, end: currentDayISO });
    }
  }, [currentDayISO]);

  const todayFleet = useMemo(() => {
    const activeDate = dateRange.start || currentDayISO;
    return cleanFleet.filter(v => normalizeToISODate(v.date) === activeDate);
  }, [cleanFleet, dateRange.start, currentDayISO]);

  const fetchData = async (retryCount = 0, forceRefresh = false) => {
    setLoading(true);
    try {
      const endpoint = forceRefresh ? '/api/fleet?refresh=true' : '/api/fleet';
      const res = await fetch(endpoint, { cache: 'no-store' });
      const contentType = res.headers.get('content-type') || '';
      
      if (!res.ok) {
        let detail = '';
        try {
          const errorBody = await res.json();
          detail = errorBody?.error || errorBody?.details || '';
        } catch {
          // Mantém a mensagem HTTP caso o servidor não retorne JSON.
        }
        throw new Error(detail || `Servidor respondeu com status ${res.status}`);
      }

      let data: any;
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error('Servidor retornou resposta em formato inválido');
        }
      }

      if (Array.isArray(data)) {
        setFleet(data);
        if (data.length > 0) {
          showToast('Dados sincronizados com sucesso!', 'success');
        }
      } else {
        console.warn('Formato de dados inesperado:', data);
        showToast('Aviso ao ler dados da frota', 'info');
      }
      setLoading(false);
    } catch (err: any) {
      console.warn(`Tentativa de carregar frota falhou (${retryCount + 1}/3):`, err?.message || err);
      if (retryCount < 2) {
        setTimeout(() => {
          fetchData(retryCount + 1, forceRefresh);
        }, 1500);
      } else {
        setLoading(false);
        showToast('Não foi possível conectar ao servidor. Clique em sincronizar para tentar novamente.', 'error');
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredFleet = useMemo(() => {
    // 1. Filtrar pelo critério de busca, filtros avançados e data
    const start = dateRange.start;
    const end = dateRange.end;

    const baseFiltered = cleanFleet.filter(v => {
      // Filtro de Busca Global (Qualquer campo)
      const searchStr = searchQuery.toLowerCase().trim();
      const globalContent = `${v.tag} ${v.cavalo} ${v.carreta} ${v.motorista} ${v.local} ${v.status} ${v.obs} ${v.tipo} ${v.ddd}`.toLowerCase();
      const searchMatch = !searchStr || globalContent.includes(searchStr);

      // Filtros Avançados (Multi-select)
      const statusMatch = statusFilter.length === 0 || statusFilter.includes(v.status);
      const typeMatch = typeFilter.length === 0 || typeFilter.includes(v.tipo);

      // Filtro de Aba
      let tabMatch = true;
      if (activeTab === 'agregados') tabMatch = (v.tipo || '').toUpperCase().includes('AGREG');
      if (activeTab === 'alerts') tabMatch = v.status === 'SINISTRO' || v.t4s === false;
      if (activeTab === 'maintenance') {
        tabMatch = v.status === 'EM MANUTENÇÃO' || v.status === 'MANUTENÇÃO' || (v.status || '').toUpperCase().includes('MANUTEN') || v.status === 'SINISTRO';
      }

      // Filtro de Data
      const normalized = normalizeToISODate(v.date);
      const isDateInRange = (!start && !end) || (normalized && normalized >= start && normalized <= end);

      return searchMatch && statusMatch && typeMatch && tabMatch && isDateInRange;
    });

    // Unificamos por placa (CAVALO) para mostrar apenas o status atual
    const unifiedMap = new Map<string, FleetVehicle>();
    
    const sortedForGrouping = [...baseFiltered].sort((a, b) => {
      const dateA = normalizeToISODate(a.date);
      const dateB = normalizeToISODate(b.date);
      return dateA.localeCompare(dateB);
    });

    sortedForGrouping.forEach(v => {
      const plate = (v.cavalo?.trim() || v.tag?.trim() || v.id?.trim() || '').toUpperCase();
      if (!plate) return;

      const dateStr = normalizeToISODate(v.date);
      const groupKey = `${plate}_${dateStr}`;

      const existing = unifiedMap.get(groupKey);
      if (!existing) {
        unifiedMap.set(groupKey, v);
      } else {
        const merged = { ...v };
        if (!merged.obs && existing.obs) {
          merged.obs = existing.obs;
        }
        unifiedMap.set(groupKey, merged);
      }
    });

    const result = Array.from(unifiedMap.values());

    return result.sort((a, b) => {
      const dateA = normalizeToISODate(a.date);
      const dateB = normalizeToISODate(b.date);
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      return (a.cavalo || '').localeCompare(b.cavalo || '');
    });
  }, [cleanFleet, dateRange, searchQuery, statusFilter, typeFilter, activeTab]);

  const maintenanceFleet = useMemo(() => {
    const baseMaint = cleanFleet.filter(v => {
      const isMaint = v.status === 'EM MANUTENÇÃO' || v.status === 'MANUTENÇÃO' || (v.status || '').toUpperCase().includes('MANUTEN') || v.status === 'SINISTRO';
      if (!isMaint) return false;
      const vDate = normalizeToISODate(v.date);
      const targetDate = dateRange.start || currentDayISO;
      if (dateRange.start && vDate !== targetDate) return false;
      if (searchQuery) {
        const searchStr = searchQuery.toLowerCase().trim();
        const globalContent = `${v.tag} ${v.cavalo} ${v.carreta} ${v.motorista} ${v.local} ${v.status} ${v.obs} ${v.tipo}`.toLowerCase();
        if (!globalContent.includes(searchStr)) return false;
      }
      return true;
    });

    // Unificar por placa do cavalo para contar apenas cavalos únicos (carreta não duplica contagem)
    const plateMap = new Map<string, FleetVehicle>();
    baseMaint.forEach(v => {
      const plate = (v.cavalo?.trim() || '').toUpperCase();
      if (!plate) return;
      if (!plateMap.has(plate)) {
        plateMap.set(plate, v);
      } else {
        const existing = plateMap.get(plate)!;
        const merged = { ...v };
        if (existing.carreta && merged.carreta && existing.carreta !== merged.carreta) {
          merged.carreta = `${existing.carreta} / ${merged.carreta}`;
        } else if (!merged.carreta && existing.carreta) {
          merged.carreta = existing.carreta;
        }
        plateMap.set(plate, merged);
      }
    });

    return Array.from(plateMap.values());
  }, [cleanFleet, dateRange.start, currentDayISO, searchQuery]);

  return (
    <div className="flex h-screen bg-[#131313] text-[#e5e2e1] overflow-hidden font-sans">
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Navbar */}
        <header className="h-16 border-b border-white/5 px-6 flex items-center justify-between bg-[#1c1b1b] sticky top-0 z-50">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#00e5ff] flex items-center justify-center text-[#00363d]">
                <Truck size={20} strokeWidth={2.5} />
              </div>
              <span className="font-black text-sm uppercase tracking-tighter text-white">COSTA SCALE</span>
            </div>
            
            <nav className="flex items-center gap-2 bg-white/5 p-1 rounded-xl">
              {[
                { id: 'matrix', label: 'Status & Categoria', icon: LayoutDashboard },
                { id: 'overview', label: 'Visão Gráfica', icon: BarChart3 },
                { id: 'fleet', label: 'Frota Ativa', icon: Truck },
                { id: 'monitoring', label: 'Mapa Realtime', icon: Globe },
                { id: 'maintenance', label: 'Manutenção', icon: Wrench },
                { id: 'reports', label: 'Relatórios', icon: TrendingUp }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold transition-all uppercase tracking-wider whitespace-nowrap",
                    activeTab === item.id 
                      ? "text-[#00e5ff] bg-[#00e5ff]/10 shadow-inner" 
                      : "text-[#849396] hover:text-white"
                  )}
                >
                  <item.icon size={13} />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <DailyDateNavigator 
              dateRange={dateRange} 
              onChange={setDateRange} 
              availableDates={availableDates}
              todayDate={currentDayISO}
            />
            
            <div className="relative group hidden md:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#849396]" />
              <input 
                type="text" 
                placeholder="Buscar veículo, motorista ou placa..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#1c1b1b] border-none rounded-full pl-10 pr-4 py-1.5 text-xs w-64 focus:ring-1 focus:ring-[#00e5ff] transition-all text-[#e5e2e1]"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#849396] hover:text-[#00e5ff]"
                >
                  X
                </button>
              )}
            </div>
            {searchQuery && (
              <span className="hidden lg:flex items-center gap-1 bg-[#00e5ff]/15 text-[#00e5ff] border border-[#00e5ff]/30 text-[10px] font-bold px-2 py-1 rounded-full">
                {searchQuery}
                <button onClick={() => setSearchQuery('')} className="hover:text-white ml-0.5">×</button>
              </span>
            )}
            <button 
              onClick={() => fetchData(0, true)}
              disabled={loading}
              className="p-2 text-[#bac9cc] hover:text-[#00e5ff] transition-colors disabled:opacity-50 group"
              title="Sincronizar com Google Sheets"
            >
              <RefreshCcw size={20} className={cn(loading && "animate-spin")} />
            </button>
          </div>
        </header>

        {/* Dynamic Canvas */}
        <div className="flex-1 overflow-auto p-6 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-12 h-12 border-4 border-[#00e5ff]/20 border-t-[#00e5ff] rounded-full"
                  />
                </div>
              ) : (
                <>
                  {activeTab === 'matrix' && (
                    <StatusCategoryDashboard 
                      fleet={cleanFleet} 
                      selectedDate={dateRange.start || currentDayISO}
                      onSelectDate={(newDate) => setDateRange({ start: newDate, end: newDate })}
                      onSelectVehicle={(v) => {
                        setSearchQuery(v.cavalo);
                        setActiveTab('fleet');
                        showToast(`Filtrando veículo ${v.cavalo}`, 'info');
                      }}
                    />
                  )}
                  {activeTab === 'overview' && (
                    <OverviewPage 
                      fleet={todayFleet} 
                      onSwitchToMatrix={() => setActiveTab('matrix')} 
                    />
                  )}
                  {(activeTab === 'fleet' || activeTab === 'agregados' || activeTab === 'alerts') && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h2 className="text-xl font-bold text-[#e3e2e2] uppercase tracking-tight">
                            {activeTab === 'fleet' && "Frota Ativa Total"}
                            {activeTab === 'agregados' && "Gestão de Agregados"}
                            {activeTab === 'alerts' && "Central de Alertas Críticos"}
                          </h2>
                          <p className="text-xs text-[#849396]">
                            {activeTab === 'alerts' ? "Sinistros e veículos sem telemetria" : `Operação diária em ${formatDateBR(dateRange.start || currentDayISO)}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => showToast('Relatório PDF gerado com sucesso!', 'success')}
                            className="bg-[#353534] hover:bg-[#454544] text-[#bac9cc] px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors"
                          >
                            PDF
                          </button>
                          <button 
                            onClick={() => showToast('Planilha Excel exportada!', 'success')}
                            className="bg-[#00e5ff] hover:opacity-90 text-[#00363d] px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors"
                          >
                            EXCEL
                          </button>
                        </div>
                      </div>
                      <FleetActivePage 
                        fleet={filteredFleet} 
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        typeFilter={typeFilter}
                        setTypeFilter={setTypeFilter}
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                        availableDates={availableDates}
                        availableTypes={availableTypes}
                        availableStatus={availableStatus}
                        isFiltered={Boolean(searchQuery || (dateRange.start && dateRange.start !== currentDayISO) || (dateRange.end && dateRange.end !== currentDayISO) || statusFilter.length > 0 || typeFilter.length > 0)}
                        latestDate={currentDayISO}
                        clearFilters={() => {
                          setSearchQuery('');
                          setDateRange({ start: currentDayISO, end: currentDayISO });
                          setStatusFilter([]);
                          setTypeFilter([]);
                          showToast(`Filtros redefinidos para o dia atual (${formatDateBR(currentDayISO)})`, 'info');
                        }}
                      />
                    </div>
                  )}
                  {activeTab === 'monitoring' && <MonitoringPage fleet={todayFleet} />}
                  {activeTab === 'reports' && <ReportsPage fleet={cleanFleet} dateRange={dateRange} showToast={showToast} />}
                  {activeTab === 'maintenance' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <h2 className="text-xl font-bold flex items-center gap-2">
                            <Wrench size={24} className="text-[#ffb4ab]" />
                            Oficina & Sinistros
                          </h2>
                          <p className="text-xs text-[#849396]">
                            {maintenanceFleet.length} veículos fora de operação imediata (Manutenção Corretiva/Preventiva e Sinistros)
                          </p>
                        </div>
                        <div className="flex gap-2">
                           <StatCard label="NA OFICINA" value={maintenanceFleet.length} color="text-[#ffb4ab]" />
                        </div>
                      </div>
                      
                      {maintenanceFleet.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {maintenanceFleet.map(v => (
                            <motion.div 
                              key={v.id} 
                              whileHover={{ scale: 1.02, boxShadow: "0 15px 40px rgba(255, 180, 171, 0.15)", borderColor: "rgba(255, 180, 171, 0.5)" }}
                              className="bg-[#201f1f] border border-[#ffb4ab]/20 p-5 rounded-xl relative overflow-hidden group cursor-default transition-colors"
                            >
                              <div className="absolute top-0 right-0 w-16 h-16 bg-[#ffb4ab]/5 rotate-45 translate-x-8 -translate-y-8" />
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-[#849396] uppercase tracking-tighter">Cavalo / Carreta</span>
                                    <span className="text-[9px] font-bold text-[#00e5ff] bg-[#00e5ff]/10 px-1.5 py-0.5 rounded">{v.tipo}</span>
                                  </div>
                                  <p className="text-lg font-black text-[#ffb4ab] mt-0.5">{v.cavalo} {v.carreta ? `+ ${v.carreta}` : ''}</p>
                                </div>
                                <StatusBadge status={v.status} />
                              </div>
                              <div className="space-y-2 mb-4 text-xs">
                                <div className="flex items-center gap-2 text-[#bac9cc]">
                                  <Users size={13} className="text-[#849396]" />
                                  <span>{v.motorista || 'Sem motorista alocado'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[#00e5ff]">
                                  <span>📍</span>
                                  <span className="font-semibold">{cleanLocation(v.local) || 'Sem local informado'}</span>
                                </div>
                                <div className="flex items-start gap-2 text-[#ffb4ab] bg-[#ffb4ab]/10 p-2.5 rounded-lg border border-[#ffb4ab]/20">
                                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                  <span className="font-medium">{v.obs || "Sem observação informada"}</span>
                                </div>
                              </div>
                              <div className="flex justify-between items-center text-[10px] text-[#849396] border-t border-white/5 pt-2">
                                <span>Tag: {v.tag || v.id}</span>
                                <span>{v.date ? formatDateBR(v.date) : 'Data não informada'}</span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-[#201f1f]/30 border border-dashed border-white/5 rounded-3xl">
                          <CheckCircle size={64} className="text-[#28ff1d] opacity-20 mb-4" />
                          <h3 className="text-lg font-bold">Nenhum Veículo Retido Encontrado</h3>
                          <p className="text-sm text-[#849396]">
                            {searchQuery ? `Nenhum veículo em oficina corresponde à busca "${searchQuery}".` : "Toda a frota filtrada está liberada ou em rota operacional."}
                          </p>
                          {searchQuery && (
                            <button
                              onClick={() => setSearchQuery('')}
                              className="mt-4 px-4 py-2 bg-[#00e5ff] text-[#00363d] rounded-lg text-xs font-bold uppercase tracking-wider hover:opacity-90"
                            >
                              Limpar Busca e Ver Todas as Manutenções
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Global FAB */}
        <button 
          onClick={() => showToast('Funcionalidade de lançar nova viagem em breve!', 'info')}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#00e5ff] text-[#00363d] rounded-full shadow-[0_8px_32px_rgba(0,229,255,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[100] group"
        >
          <Plus size={28} strokeWidth={3} />
          <span className="absolute right-16 px-3 py-1.5 bg-[#201f1f] text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10 pointer-events-none">
            Nova Viagem
          </span>
        </button>
      </main>

      {/* Global Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: -40, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={cn(
              "fixed bottom-0 left-1/2 px-6 py-3 rounded-2xl shadow-2xl z-[200] flex items-center gap-3 border backdrop-blur-xl",
              toast.type === 'success' ? "bg-[#1c1b1b]/90 border-[#28ff1d]/30 text-[#28ff1d]" :
              toast.type === 'error' ? "bg-[#1c1b1b]/90 border-[#ffb4ab]/30 text-[#ffb4ab]" :
              "bg-[#1c1b1b]/90 border-white/10 text-[#00e5ff]"
            )}
          >
            {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <span className="text-sm font-bold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
