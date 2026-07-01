/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import CustomTooltip from "./CustomTooltip.tsx";
import { Activity, Heart, ArrowUpRight, ArrowDownRight, Percent, Database, Info, UserCheck } from "lucide-react";
import { MeasurementRecord, PeriodFilter, PatientProfile } from "../types";
import { calculateStats, formatDateFr, calculateAge } from "../utils";
import { motion } from "motion/react";




interface StatsDashboardProps {
  filteredRecords: MeasurementRecord[];
  allRecords: MeasurementRecord[];
  activePeriod: PeriodFilter;
  patientProfile?: PatientProfile | null;
}



export default function StatsDashboard({ filteredRecords, allRecords, activePeriod, patientProfile }: StatsDashboardProps) {
  const stats = useMemo(() => calculateStats(filteredRecords), [filteredRecords]);

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
        dateComplete: formatDateFr(r.timestamp, true)
      };
    });
  }, [filteredRecords, activePeriod]);

  // Helper to format X axis ticks from index
  const xTickFormatter = (idx: number) => chartData[idx]?.displayName ?? '';
  // Helper for tooltip label
  const xLabelFormatter = (idx: number) => chartData[idx]?.displayName ?? '';

  return (
    <div className="space-y-6" id="stats-dashboard">
      {/* Patient Profile Quick Summary Banner */}
      {patientProfile ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-natural-surface border border-natural-border p-5 rounded-[32px] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
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
        <div className="bg-natural-surface/60 border border-dashed border-natural-border/80 p-5 rounded-[32px] shadow-sm flex items-center gap-3" id="patient-profile-dashboard-empty">
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
        {/* Card 1: Average Blood Pressure */}
        <div className="bg-natural-surface p-6 rounded-[32px] border border-natural-border shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-natural-secondary font-bold uppercase tracking-widest">Moyenne Tension</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-natural-primary font-mono">
                {stats.avgSys}/{stats.avgDia}
              </span>
              <span className="text-[10px] text-natural-secondary font-mono font-bold">mmHg</span>
            </div>
            <p className="text-[10px] text-natural-secondary flex items-center gap-1">
              {stats.avgSys >= 140 || stats.avgDia >= 90 ? (
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

        {/* Card 2: Average Pulse / Heart rate */}
        <div className="bg-natural-surface p-6 rounded-[32px] border border-natural-border shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-natural-secondary font-bold uppercase tracking-widest">Moyenne Pouls</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-natural-primary font-mono">{stats.avgPulse}</span>
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
        <div className="bg-natural-surface p-6 rounded-[32px] border border-natural-border shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-natural-secondary font-bold uppercase tracking-widest">Stabilité Idéale</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-natural-primary font-mono">{stats.normalPercent}%</span>
              <span className="text-[10px] text-natural-secondary font-mono font-bold">des mesures</span>
            </div>
            <p className="text-[10px] text-natural-secondary leading-tight">
              Cible &lt; 130/85 mmHg
            </p>
          </div>
          <div className="p-2.5 bg-natural-bg text-natural-primary border border-natural-border/60 rounded-xl">
            <Percent className="h-5 w-5" />
          </div>
        </div>

        {/* Card 4: Log count */}
        <div className="bg-natural-surface p-6 rounded-[32px] border border-natural-border shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-natural-secondary font-bold uppercase tracking-widest">Total Saisies</p>
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
      </div>

      {/* Main charts area */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Tension Artérielle Trends Chart */}
        <div className="bg-natural-surface rounded-[32px] border border-natural-border p-6 shadow-sm space-y-4">
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
                  <ReferenceLine y={140} stroke="#f43f5e" strokeDasharray="3 3" strokeWidth={1} label={{ value: "SYS haute (140)", fill: "#f43f5e", fontSize: 9, position: "insideBottomLeft" }} />
                  <ReferenceLine y={90} stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={1} label={{ value: "DIA haute (90)", fill: "#f59e0b", fontSize: 9, position: "insideBottomLeft" }} />

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
        <div className="bg-natural-surface rounded-[32px] border border-natural-border p-6 shadow-sm space-y-4">
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
                  <ReferenceLine y={100} stroke="#ec4899" strokeDasharray="3 3" strokeWidth={1} label={{ value: "FC haute (100)", fill: "#ec4899", fontSize: 9, position: "insideBottomLeft" }} />
                  <ReferenceLine y={60} stroke="#14b8a6" strokeDasharray="3 3" strokeWidth={1} label={{ value: "FC basse (60)", fill: "#14b8a6", fontSize: 9, position: "insideBottomLeft" }} />

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
