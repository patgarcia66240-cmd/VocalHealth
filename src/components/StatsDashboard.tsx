import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import CustomTooltip from "./CustomTooltip.tsx";
import { Activity, Heart, Percent, Database, Droplets } from "lucide-react";
import { MeasurementRecord, PeriodFilter, PatientProfile, MedicalSettings } from "../types";
import { calculateStats, formatDateFr } from "../utils";
import PatientSelectorCard from "./PatientSelectorCard";

interface StatsDashboardProps {
  filteredRecords: MeasurementRecord[];
  allRecords: MeasurementRecord[];
  activePeriod: PeriodFilter;
  patientProfile?: PatientProfile | null;
  settings: MedicalSettings;
  onProfileChange?: (profile: PatientProfile | null) => void;
}

export default function StatsDashboard({ filteredRecords, allRecords, activePeriod, patientProfile, settings, onProfileChange }: StatsDashboardProps) {
  const stats = useMemo(() => calculateStats(filteredRecords), [filteredRecords]);

  const latestRecord = filteredRecords.length > 0 ? filteredRecords[filteredRecords.length - 1] : null;
  const latestSys = latestRecord?.systolic ?? 0;
  const latestDia = latestRecord?.diastolic ?? 0;
  const latestPulse = latestRecord?.pulse ?? 0;

  const chartData = useMemo(() => {
    return filteredRecords.map((record, index) => {
      const dateObj = new Date(record.timestamp);
      let formattedTime = "";

      if (activePeriod === "day") {
        formattedTime = dateObj.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
      } else if (activePeriod === "week") {
        formattedTime = dateObj.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
      } else {
        formattedTime = dateObj.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
      }

      return {
        ...record,
        _idx: index,
        displayName: formattedTime,
        systolique: record.systolic,
        diastolique: record.diastolic,
        pouls: record.pulse,
        dateComplete: formatDateFr(record.timestamp, true),
        spo2: record.spo2,
      };
    });
  }, [filteredRecords, activePeriod]);

  const xTickFormatter = (value: unknown) => {
    if (typeof value === "number") {
      return chartData[value]?.displayName ?? "";
    }

    return String(value);
  };

  const xLabelFormatter = (value: unknown) => {
    if (typeof value === "number") {
      return chartData[value]?.displayName ?? "";
    }

    return String(value);
  };

  const spo2Values = useMemo(() => chartData.map((item) => item.spo2).filter((value): value is number => typeof value === "number"), [chartData]);
  const averageSpo2 = spo2Values.length > 0 ? Math.round(spo2Values.reduce((total, value) => total + value, 0) / spo2Values.length) : null;
  const latestSpo2 = spo2Values.length > 0 ? spo2Values[spo2Values.length - 1] : null;
  const showSpo2Card = settings.spo2Enabled && spo2Values.length > 0;

  return (
    <div className="space-y-6" id="stats-dashboard">
      <PatientSelectorCard patientProfile={patientProfile} onProfileChange={onProfileChange} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-natural-surface p-6 rounded-4xl border border-natural-border shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-natural-primary font-mono">
                {latestSys}/{latestDia}
              </span>
              <span className="text-[10px] text-natural-secondary font-mono font-bold">mmHg</span>
            </div>
            <p className="text-[10px] text-natural-secondary flex items-center gap-1">
              {latestSys >= settings.systolicHigh || latestDia >= settings.diastolicHigh ? (
                <span className="text-rose-600 font-bold">⚠️ Élevée</span>
              ) : (
                <span className="text-natural-primary font-bold">✓ Optimale</span>
              )}
            </p>
          </div>
          <div className="p-2.5 bg-natural-bg text-natural-primary rounded-xl">
            <Activity className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-natural-surface p-6 rounded-4xl border border-natural-border shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-natural-primary font-mono">{latestPulse}</span>
              <span className="text-[10px] text-natural-secondary font-mono font-bold">bpm</span>
            </div>
            <p className="text-[10px] text-natural-secondary font-mono">
              Min: {stats.minPulse === Infinity ? 0 : stats.minPulse} • Max: {stats.maxPulse === -Infinity ? 0 : stats.maxPulse}
            </p>
          </div>
          <div className="p-2.5 bg-natural-card text-natural-primary rounded-xl">
            <Heart className="h-5 w-5 animate-pulse" />
          </div>
        </div>

        <div className="bg-natural-surface p-6 rounded-4xl border border-natural-border shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-natural-primary font-mono">{stats.normalPercent}%</span>
              <span className="text-[10px] text-natural-secondary font-mono font-bold">des mesures</span>
            </div>
            <p className="text-[10px] text-natural-secondary leading-tight">
              Cible &lt; {settings.systolicHigh}/{settings.diastolicHigh} mmHg
            </p>
          </div>
          <div className="p-2.5 bg-natural-bg text-natural-primary border border-natural-border/60 rounded-xl">
            <Percent className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-natural-surface p-6 rounded-4xl border border-natural-border shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-natural-primary font-mono">{stats.totalCount}</span>
              <span className="text-[10px] text-natural-secondary font-normal font-sans">filtrées</span>
            </div>
            <p className="text-[10px] text-natural-secondary">
              Historique: {allRecords.length}
            </p>
          </div>
          <div className="p-2.5 bg-natural-accent/25 text-natural-primary rounded-xl">
            <Database className="h-5 w-5" />
          </div>
        </div>

        {showSpo2Card && (
          <div className="bg-natural-surface p-6 rounded-4xl border border-natural-border shadow-sm flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-natural-primary font-mono">{averageSpo2}</span>
                <span className="text-[10px] text-natural-secondary font-mono font-bold">%</span>
              </div>
              <p className="text-[10px] text-natural-secondary font-mono">Dernière mesure: {latestSpo2}%</p>
            </div>
            <div className="p-2.5 bg-natural-bg text-natural-primary rounded-xl">
              <Droplets className="h-5 w-5" />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-natural-surface rounded-4xl border border-natural-border p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-natural-primary text-sm">Évolution de la Tension</h3>
              <p className="text-[11px] text-natural-secondary">Comparatif SYS / DIA (mmHg)</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest font-mono">
              <span className="flex items-center gap-1.5 text-natural-primary">
                <span className="h-2.5 w-2.5 rounded-full bg-natural-primary" /> Systolique
              </span>
              <span className="flex items-center gap-1.5 text-natural-accent">
                <span className="h-2.5 w-2.5 rounded-full bg-natural-accent" /> Diastolique
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <div className="w-12 h-12 rounded-full bg-natural-bg/50 flex items-center justify-center mb-3">
                  <Activity className="h-6 w-6 text-natural-secondary/40" />
                </div>
                <p className="text-sm font-medium text-natural-dark mb-1">Aucune mesure enregistrée</p>
                <p className="text-xs text-natural-secondary/60">Commencez par utiliser la saisie vocale ou manuelle pour voir votre évolution ici</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-natural-border)" />
                  <XAxis
                    dataKey="_idx"
                    tickFormatter={xTickFormatter}
                    stroke="#475569"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    dy={5}
                  />
                  <YAxis
                    stroke="#475569"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    domain={["dataMin - 10", "dataMax + 10"]}
                  />
                  <Tooltip content={(props) => <CustomTooltip {...props} labelFormatter={xLabelFormatter} />} />
                  <ReferenceLine y={settings.systolicHigh} stroke="#f43f5e" strokeDasharray="3 3" strokeWidth={1} label={{ value: `SYS haute (${settings.systolicHigh})`, fill: "#f43f5e", fontSize: 9, position: "insideBottomLeft" }} />
                  <ReferenceLine y={settings.systolicLow} stroke="#0ea5e9" strokeDasharray="3 3" strokeWidth={1} label={{ value: `SYS basse (${settings.systolicLow})`, fill: "#0ea5e9", fontSize: 9, position: "insideBottomLeft" }} />
                  <ReferenceLine y={settings.diastolicHigh} stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={1} label={{ value: `DIA haute (${settings.diastolicHigh})`, fill: "#f59e0b", fontSize: 9, position: "insideBottomLeft" }} />
                  <ReferenceLine y={settings.diastolicLow} stroke="#38bdf8" strokeDasharray="3 3" strokeWidth={1} label={{ value: `DIA basse (${settings.diastolicLow})`, fill: "#38bdf8", fontSize: 9, position: "insideBottomLeft" }} />

                  <Line
                    type="monotone"
                    dataKey="systolique"
                    name="Tension Systolique"
                    stroke="#059669"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#059669", strokeWidth: 0 }}
                    activeDot={{ r: 8, fill: "#059669", stroke: "#ffffff", strokeWidth: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="diastolique"
                    name="Tension Diastolique"
                    stroke="#34D399"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#34D399", strokeWidth: 0 }}
                    activeDot={{ r: 8, fill: "#34D399", stroke: "#ffffff", strokeWidth: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-natural-surface rounded-4xl border border-natural-border p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-natural-primary text-sm">Évolution du Rythme</h3>
              <p className="text-[11px] text-natural-secondary">Fréquence cardiaque au fil du temps (bpm)</p>
            </div>
            <div className="flex items-center text-[10px] font-bold uppercase tracking-widest font-mono">
              <span className="flex items-center gap-1.5 text-natural-secondary">
                <span className="h-2.5 w-2.5 rounded-full bg-natural-secondary" /> Fréquence
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <div className="w-12 h-12 rounded-full bg-natural-bg/50 flex items-center justify-center mb-3">
                  <Heart className="h-6 w-6 text-natural-secondary/40" />
                </div>
                <p className="text-sm font-medium text-natural-dark mb-1">Aucune mesure enregistrée</p>
                <p className="text-xs text-natural-secondary/60">Commencez par utiliser la saisie vocale ou manuelle pour voir votre évolution ici</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-natural-border)" />
                  <XAxis
                    dataKey="_idx"
                    tickFormatter={xTickFormatter}
                    stroke="#475569"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    dy={5}
                  />
                  <YAxis
                    stroke="#475569"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    domain={["dataMin - 10", "dataMax + 10"]}
                  />
                  <Tooltip content={(props) => <CustomTooltip {...props} labelFormatter={xLabelFormatter} />} />
                  <ReferenceLine y={settings.pulseHigh} stroke="#ec4899" strokeDasharray="3 3" strokeWidth={1} label={{ value: `FC haute (${settings.pulseHigh})`, fill: "#ec4899", fontSize: 9, position: "insideBottomLeft" }} />
                  <ReferenceLine y={settings.pulseLow} stroke="#14b8a6" strokeDasharray="3 3" strokeWidth={1} label={{ value: `FC basse (${settings.pulseLow})`, fill: "#14b8a6", fontSize: 9, position: "insideBottomLeft" }} />

                  <Line
                    type="monotone"
                    dataKey="pouls"
                    name="Pouls / Rythme"
                    stroke="#475569"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#475569", strokeWidth: 0 }}
                    activeDot={{ r: 8, fill: "#475569", stroke: "#ffffff", strokeWidth: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
