/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import CustomTooltip from "./CustomTooltip.tsx";
import { Activity, Heart, Percent, Database, UserCheck, Droplets } from "lucide-react";
import { MeasurementRecord, PeriodFilter, PatientProfile, MedicalSettings } from "../types";
import { calculateStats, formatDateFr, calculateAge } from "../utils";
import { motion } from "motion/react";




interface StatsDashboardProps {
  filteredRecords: MeasurementRecord[];
  allRecords: MeasurementRecord[];
  activePeriod: PeriodFilter;
  patientProfile?: PatientProfile | null;
  settings: MedicalSettings;
}



export default function StatsDashboard({ filteredRecords, allRecords, activePeriod, patientProfile, settings }: StatsDashboardProps) {
  const stats = useMemo(() => calculateStats(filteredRecords), [filteredRecords]);

  // Get the latest record (most recent) - last element of the array
  const latestRecord = filteredRecords.length > 0 ? filteredRecords[filteredRecords.length - 1] : null;
  const latestSys = latestRecord?.systolic ?? 0;
  const latestDia = latestRecord?.diastolic ?? 0;
  const latestPulse = latestRecord?.pulse ?? 0;

  // Format data specifically for Recharts
  const chartData = useMemo(() => {
    return filteredRecords.map((r, i) => {
      const dateObj = new Date(r.timestamp);
      
      // Dynamic X-axis formatting based on filter
      let formattedTime = "";
      if (activePeriod === "day") {
        formattedTime = dateObj.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
      } else if (activePeriod === "week") {
        formattedTime = dateObj.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
      } else {
        formattedTime = dateObj.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
      }

      return {
        ...r,
        _idx: i,
        displayName: formattedTime,
        systolique: r.systolic,
        diastolique: r.diastolic,
        pouls: r.pulse,
        dateComplete: formatDateFr(r.timestamp, true),
        spo2: r.spo2,
      };
    });
  }, [filteredRecords, activePeriod]);

  // Helper to format X axis ticks from index
  const xTickFormatter = (value: unknown) => {
    if (typeof value === 'number') {
      return chartData[value]?.displayName ?? '';
    }
    return String(value);
  };
  // Helper for tooltip label
  const xLabelFormatter = (value: unknown) => {
    if (typeof value === 'number') {
      return chartData[value]?.displayName ?? '';
    }
    return String(value);
  };

  const spo2Values = useMemo(() => chartData.map((item) => item.spo2).filter((value): value is number => typeof value === "number"), [chartData]);
  const averageSpo2 = spo2Values.length > 0 ? Math.round(spo2Values.reduce((total, value) => total + value, 0) / spo2Values.length) : null;
  const latestSpo2 = spo2Values.length > 0 ? spo2Values[spo2Values.length - 1] : null;
  const showSpo2Card = settings.spo2Enabled && spo2Values.length > 0;

  return (
    <div className="space-y-6" id="stats-dashboard">
      {/* Patient Profile Quick Summary Banner */}
      {patientProfile ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-natural-surface border border-natural-border p-5 rounded-4xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
          id="patient-profile-dashboard-banner"
        >
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-natural-primary/10 text-natural-primary flex items-center justify-center font-black text-lg shrink-0 border border-natural-border/60 shadow-sm">
              {patientProfile.prenom.charAt(0).toUpperCase()}{patientProfile.nom.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-extrabold text-natural-dark font-sans leading-none">
                  {patientProfile.prenom} {patientProfile.nom}
                </h2>
                <span className="text-[10px] bg-natural-primary text-white font-bold px-2 py-0.5 rounded-full font-mono">
                  {calculateAge(patientProfile.dateNaissance)} ans
                </span>
              </div>
              <p className="text-xs text-natural-secondary font-medium mt-1">
                Né(e) le {new Date(patientProfile.dateNaissance).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-y-2 gap-x-6 text-xs text-natural-secondary border-t md:border-t-0 md:border-l border-natural-border/60 pt-3 md:pt-0 md:pl-6 flex-1 max-w-xl justify-end">
            <div className="space-y-0.5">
              <span className="text-[9px] font-bold text-natural-secondary uppercase tracking-wider block">📍 ADRESSE</span>
              <p className="font-semibold text-natural-dark leading-tight">{patientProfile.adresse}</p>
              <p className="text-[11px] font-medium text-natural-secondary">{patientProfile.cp} {patientProfile.ville}</p>
            </div>
            <div className="space-y-0.5 sm:border-l sm:border-natural-border/40 sm:pl-6 shrink-0">
              <span className="text-[9px] font-bold text-natural-secondary uppercase tracking-wider block">📞 TÉLÉPHONE</span>
              <p className="font-mono font-bold text-natural-primary">{patientProfile.tel}</p>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="bg-natural-surface/60 border border-dashed border-natural-border/80 p-5 rounded-4xl shadow-sm flex items-center gap-3" id="patient-profile-dashboard-empty">
          <div className="p-2 bg-natural-primary/10 rounded-xl text-natural-primary">
            <UserCheck className="h-5 w-5 opacity-70" />
          </div>
          <div className="text-xs text-natural-secondary font-medium">
            💡 <span className="font-bold text-natural-dark">Astuce :</span> Renseignez votre <span className="font-bold text-natural-primary">Profil Patient</span> dans la barre latérale pour afficher votre âge, vos coordonnées et personnaliser votre tableau de bord médical.
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Latest Blood Pressure */}
        <div className="bg-natural-surface p-6 rounded-4xl border border-natural-border shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-natural-primary font-mono">
                {latestSys}/{latestDia}
              </span>
              <span className="text-[10px] text-natural-secondary font-mono font-bold">mmHg</span>
            </div>
            <p className="text-[10px] text-natural-secondary flex items-center gap-1">
              {latestSys >= 140 || latestDia >= 90 ? (
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

        {/* Card 2: Latest Pulse / Heart rate */}
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

        {/* Card 3: Target Stability Percentage */}
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

        {/* Card 4: Log count */}
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
              <p className="text-[10px] text-natural-secondary font-mono">Derni?re mesure: {latestSpo2}%</p>
            </div>
            <div className="p-2.5 bg-natural-bg text-natural-primary rounded-xl">
              <Droplets className="h-5 w-5" />
            </div>
          </div>
        )}
      </div>

      {/* Main charts area */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Tension Artérielle Trends Chart */}
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
              <div className="h-full flex items-center justify-center text-natural-secondary text-xs">
                Aucune donnée à afficher pour le graphique de tension.
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
                  
                  {/* Guideline thresholds */}
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
                    dot={{ r: 4, fill: '#059669', strokeWidth: 0 }}
                    activeDot={{ r: 8, fill: '#059669', stroke: '#ffffff', strokeWidth: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="diastolique"
                    name="Tension Diastolique"
                    stroke="#34D399"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#34D399', strokeWidth: 0 }}
                    activeDot={{ r: 8, fill: '#34D399', stroke: '#ffffff', strokeWidth: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pouls (Heart Rate) Trends Chart */}
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
              <div className="h-full flex items-center justify-center text-natural-secondary text-xs">
                Aucune donnée à afficher pour le graphique de pouls.
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
                  
                  {/* Guideline thresholds */}
                  <ReferenceLine y={settings.pulseHigh} stroke="#ec4899" strokeDasharray="3 3" strokeWidth={1} label={{ value: `FC haute (${settings.pulseHigh})`, fill: "#ec4899", fontSize: 9, position: "insideBottomLeft" }} />
                  <ReferenceLine y={settings.pulseLow} stroke="#14b8a6" strokeDasharray="3 3" strokeWidth={1} label={{ value: `FC basse (${settings.pulseLow})`, fill: "#14b8a6", fontSize: 9, position: "insideBottomLeft" }} />

                  <Line
                    type="monotone"
                    dataKey="pouls"
                    name="Pouls / Rythme"
                    stroke="#475569"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#475569', strokeWidth: 0 }}
                    activeDot={{ r: 8, fill: '#475569', stroke: '#ffffff', strokeWidth: 3 }}
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




