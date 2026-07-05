import React, { useState } from "react";
import { Download, Upload, Search, Trash2, Edit3, FileSpreadsheet, FileText, Check, ChevronDown, ChevronRight, AlertTriangle, X } from "lucide-react";
import { MeasurementRecord, PeriodFilter, MedicalSettings } from "../types";
import { formatDateFr, classifyBloodPressure } from "../utils";

interface HistorySpreadsheetProps {
  records: MeasurementRecord[];
  onDeleteRequest: (id: string) => void; // Changed: request deletion instead of direct delete
  onEditRecord?: (record: MeasurementRecord) => void;
  onImportRecords: (imported: MeasurementRecord[]) => void;
  settings: MedicalSettings;
}

export default function HistorySpreadsheet({
  records,
  onDeleteRequest,
  onEditRecord,
  onImportRecords,
  settings,
}: HistorySpreadsheetProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [selectedMonthKey, setSelectedMonthKey] = useState("");
  const [selectedWeekKey, setSelectedWeekKey] = useState("");
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Quick inline edit state
  const [inlineSys, setInlineSys] = useState<number>(120);
  const [inlineDia, setInlineDia] = useState<number>(80);
  const [inlinePulse, setInlinePulse] = useState<number>(70);
  const [inlineSpo2, setInlineSpo2] = useState<number>(98);
  const [inlineRemarks, setInlineRemarks] = useState<string>("");

  const toggleRowExpand = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleStartInlineEdit = (r: MeasurementRecord) => {
    setEditingRowId(r.id);
    setInlineSys(r.systolic);
    setInlineDia(r.diastolic);
    setInlinePulse(r.pulse);
    setInlineSpo2(r.spo2 ?? 98);
    setInlineRemarks(r.remarks || "");
  };

  const handleSaveInlineEdit = (r: MeasurementRecord) => {
    if (onEditRecord) {
      onEditRecord({
        ...r,
        systolic: inlineSys,
        diastolic: inlineDia,
        pulse: inlinePulse,
        spo2: settings.spo2Enabled ? inlineSpo2 : undefined,
        remarks: inlineRemarks,
      });
    }
    setEditingRowId(null);
  };

  const getValidDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const getMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

  const getWeekInfo = (date: Date) => {
    const normalized = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = normalized.getUTCDay() || 7;
    normalized.setUTCDate(normalized.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(normalized.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((normalized.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

    return {
      year: normalized.getUTCFullYear(),
      week,
      key: `${normalized.getUTCFullYear()}-W${String(week).padStart(2, "0")}`
    };
  };

  const availableMonths = Array.from(
    records.reduce((map, record) => {
      const date = getValidDate(record.timestamp);
      if (!date) return map;

      const key = getMonthKey(date);
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
        });
      }
      return map;
    }, new Map<string, { key: string; label: string }>())
  )
    .map(([, value]) => value)
    .sort((a, b) => b.key.localeCompare(a.key));

  const availableWeeks = Array.from(
    records.reduce((map, record) => {
      const date = getValidDate(record.timestamp);
      if (!date) return map;

      const weekInfo = getWeekInfo(date);
      if (!map.has(weekInfo.key)) {
        map.set(weekInfo.key, {
          key: weekInfo.key,
          label: `Semaine ${weekInfo.week} - ${weekInfo.year}`
        });
      }
      return map;
    }, new Map<string, { key: string; label: string }>())
  )
    .map(([, value]) => value)
    .sort((a, b) => b.key.localeCompare(a.key));

  // Export to CSV
  const exportToCSV = () => {
    if (records.length === 0) return;

    const headers = ["ID", "Date & Heure", "Systolique (mmHg)", "Diastolique (mmHg)", "Pouls (bpm)", "SpO2 (%)", "Classification", "Remarques"];

    const rows = records.map(r => {
      const cls = classifyBloodPressure(r.systolic, r.diastolic);
      return [
        r.id,
        formatDateFr(r.timestamp, true),
        r.systolic,
        r.diastolic,
        r.pulse,
        r.spo2 ?? "",
        cls.category,
        r.remarks || ""
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `suivi_tension_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import JSON/CSV File
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          const validated: MeasurementRecord[] = parsed.filter(item =>
            item &&
            typeof item.systolic === "number" &&
            typeof item.diastolic === "number" &&
            typeof item.pulse === "number"
          ).map(item => ({
            id: item.id || `imported-${Math.random().toString(36).slice(2, 11)}`,
            timestamp: item.timestamp || new Date().toISOString(),
            systolic: item.systolic,
            diastolic: item.diastolic,
            pulse: item.pulse,
            spo2: typeof item.spo2 === "number" ? item.spo2 : undefined,
            remarks: item.remarks || ""
          }));

          if (validated.length > 0) {
            onImportRecords(validated);
            alert(`${validated.length} mesures importées avec succès !`);
          } else {
            alert("Aucune mesure valide trouvée dans le fichier.");
          }
        } else {
          alert("Format JSON invalide. Doit être un tableau de mesures.");
        }
      } catch (err) {
        alert("Erreur lors de la lecture du fichier. Veuillez importer un fichier de sauvegarde JSON valide.");
      }
    };
    reader.readAsText(file);
  };

  const isInSelectedPeriod = (timestamp: string) => {
    if (periodFilter === "all") return true;

    const recordDate = getValidDate(timestamp);
    if (!recordDate) return false;

    if (periodFilter === "day") {
      const now = new Date();
      return recordDate.toDateString() === now.toDateString();
    }

    if (periodFilter === "month") {
      const monthKey = selectedMonthKey || availableMonths[0]?.key;
      return monthKey ? getMonthKey(recordDate) === monthKey : true;
    }

    if (periodFilter === "week") {
      const weekKey = selectedWeekKey || availableWeeks[0]?.key;
      return weekKey ? getWeekInfo(recordDate).key === weekKey : true;
    }

    return true;
  };

  // Filter records by selected calendar period, then by search term.
  const filteredRecords = records.filter(r => {
    if (!isInSelectedPeriod(r.timestamp)) return false;

    const term = searchTerm.toLowerCase();
    if (!term.trim()) return true;

    const remarksMatch = (r.remarks || "").toLowerCase().includes(term);
    const dateMatch = formatDateFr(r.timestamp, true).toLowerCase().includes(term);
    const classification = classifyBloodPressure(r.systolic, r.diastolic).category.toLowerCase();
    const spo2Match = typeof r.spo2 === "number" ? String(r.spo2).includes(term) : false;
    const classMatch = classification.includes(term);

    return remarksMatch || dateMatch || classMatch || spo2Match;
  });

  return (
    <div className="bg-natural-surface rounded-lg border border-natural-border/50 overflow-hidden" id="spreadsheet-container">
      {/* Header and Toolbar */}
      <div className="p-4 border-b border-natural-border bg-natural-bg/30 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-natural-primary" />
            <h2 className="text-base font-bold text-natural-dark" id="spreadsheet-title">Historique des mesures</h2>
          </div>
          <p className="text-sm text-natural-secondary mt-0.5">Consultez et modifiez vos constantes</p>
        </div>

        {/* Toolbar controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period Filter Tabs */}
          <div className="flex bg-natural-bg p-0.5 rounded-lg border border-natural-border/40 text-sm" id="period-filter-tabs">
            {(["all", "month", "week", "day"] as PeriodFilter[]).map((period) => (
              <button
                key={period}
                onClick={() => {
                  setPeriodFilter(period);
                  if (period === "month" && !selectedMonthKey) {
                    setSelectedMonthKey(availableMonths[0]?.key || "");
                  }
                  if (period === "week" && !selectedWeekKey) {
                    setSelectedWeekKey(availableWeeks[0]?.key || "");
                  }
                }}
                className={`px-4 py-2 rounded-md transition-all ${
                  periodFilter === period
                    ? "bg-natural-primary text-white"
                    : "text-natural-secondary hover:text-natural-dark"
                }`}
              >
                {period === "all" && "Tout"}
                {period === "month" && "Mois"}
                {period === "week" && "Semaine"}
                {period === "day" && "Jour"}
              </button>
            ))}
          </div>

          {periodFilter === "month" && (
            <select
              value={selectedMonthKey || availableMonths[0]?.key || ""}
              onChange={(event) => setSelectedMonthKey(event.target.value)}
              className="h-9 rounded-lg border border-natural-border/50 bg-natural-surface px-3 text-sm font-medium text-natural-dark outline-none transition-all focus:border-natural-primary focus:ring-2 focus:ring-natural-primary/15"
              aria-label="Choisir un mois"
            >
              {availableMonths.length === 0 ? (
                <option value="">Aucun mois</option>
              ) : (
                availableMonths.map((month) => (
                  <option key={month.key} value={month.key}>
                    {month.label}
                  </option>
                ))
              )}
            </select>
          )}

          {periodFilter === "week" && (
            <select
              value={selectedWeekKey || availableWeeks[0]?.key || ""}
              onChange={(event) => setSelectedWeekKey(event.target.value)}
              className="h-9 rounded-lg border border-natural-border/50 bg-natural-surface px-3 text-sm font-medium text-natural-dark outline-none transition-all focus:border-natural-primary focus:ring-2 focus:ring-natural-primary/15"
              aria-label="Choisir une semaine"
            >
              {availableWeeks.length === 0 ? (
                <option value="">Aucune semaine</option>
              ) : (
                availableWeeks.map((week) => (
                  <option key={week.key} value={week.key}>
                    {week.label}
                  </option>
                ))
              )}
            </select>
          )}

          {/* Import / Export Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={exportToCSV}
              disabled={records.length === 0}
              className="p-2 px-3 bg-natural-surface border border-natural-border hover:bg-natural-bg text-natural-primary rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
              title="Exporter l'historique au format CSV"
              id="export-csv-btn"
            >
              <Download className="h-4 w-4" />
              <span>Exporter</span>
            </button>

            <label
              className="p-2 px-3 bg-natural-surface border border-natural-border hover:bg-natural-bg text-natural-primary rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Importer une sauvegarde JSON"
              id="import-json-label"
            >
              <Upload className="h-4 w-4" />
              <span>Importer</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="px-4 py-3 border-b border-natural-border/50 flex items-center gap-2">
        <Search className="h-4 w-4 text-natural-secondary/60 shrink-0" />
        <input
          type="text"
          placeholder="Rechercher date, remarques, classification..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 text-sm text-natural-dark focus:outline-none placeholder-natural-secondary/40 bg-transparent"
          id="search-input"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="text-xs bg-natural-bg hover:bg-natural-border text-natural-primary px-2.5 py-1 rounded-md"
          >
            Effacer
          </button>
        )}
      </div>

      {/* Simplified Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" id="spreadsheet-table" role="table" aria-label="Historique des mesures de tension, pouls et saturation">
          <thead>
            <tr className="border-b border-natural-border/50 bg-natural-bg/20 text-xs font-semibold text-natural-secondary" role="row">
              <th className="py-3 px-4" scope="col" id="col-date">Date</th>
              <th className="py-3 px-4 text-center" scope="col" id="col-bp">Tension (mmHg)</th>
              <th className="py-3 px-4 text-center" scope="col" id="col-pulse">Pouls (bpm)</th>
              <th className="py-3 px-4" scope="col" id="col-status">État</th>
              <th className="py-3 px-4 text-right" scope="col" id="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-natural-border/30 text-sm text-natural-dark" role="rowgroup">
            {filteredRecords.length === 0 ? (
              <tr role="row">
                <td colSpan={5} className="py-16 text-center text-natural-secondary" role="cell">
                  <FileText className="h-10 w-10 mx-auto mb-3 text-natural-secondary/30" />
                  <p className="font-semibold text-sm">Aucune mesure enregistrée</p>
                  <p className="text-xs mt-1 text-natural-secondary/60">Utilisez la saisie vocale ou manuelle pour commencer</p>
                </td>
              </tr>
            ) : (
              filteredRecords.map((r) => {
                const isEditing = editingRowId === r.id;
                const isExpanded = expandedRows.has(r.id);
                const cls = classifyBloodPressure(r.systolic, r.diastolic);

                // Determine overall status (single indicator)
                const hasAnyAbnormality = (
                  r.systolic >= settings.systolicHigh ||
                  r.systolic <= settings.systolicLow ||
                  r.diastolic >= settings.diastolicHigh ||
                  r.diastolic <= settings.diastolicLow ||
                  r.pulse >= settings.pulseHigh ||
                  r.pulse <= settings.pulseLow ||
                  (settings.spo2Enabled && typeof r.spo2 === "number" && r.spo2 <= settings.spo2Low)
                );

                // Color coding for blood pressure display
                const bpColor = r.systolic >= 140 || r.diastolic >= 90
                  ? "text-rose-600 font-semibold"
                  : r.systolic <= 90 || r.diastolic <= 60
                  ? "text-blue-600 font-semibold"
                  : "text-natural-dark";

                // Color coding for pulse
                const pulseColor = r.pulse >= settings.pulseHigh || r.pulse <= settings.pulseLow
                  ? "text-rose-600 font-semibold"
                  : "text-natural-dark";

                return (
                  <React.Fragment key={r.id}>
                    <tr
                      className={`hover:bg-natural-bg/40 transition-colors ${isEditing ? "bg-natural-bg/60" : ""}`}
                      role="row"
                      aria-labelledby={`row-${r.id}`}
                    >
                      {/* Date - always visible */}
                      <td className="py-3 px-4" role="cell" headers="col-date">
                        <div className="flex flex-col">
                          <span className="font-medium text-natural-dark">
                            {formatDateFr(r.timestamp, false)}
                          </span>
                          <span className="text-xs text-natural-secondary/60 font-mono">
                            {new Date(r.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </td>

                      {/* Blood Pressure - Combined SYS/DIA */}
                      <td className="py-3 px-4 text-center" role="cell" headers="col-bp">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              value={inlineSys}
                              onChange={(e) => setInlineSys(parseInt(e.target.value) || 0)}
                              className="w-16 px-2 py-1 border border-natural-border rounded text-center focus:ring-1 focus:ring-natural-primary bg-natural-surface text-sm font-mono"
                              aria-label={`Modifier la tension systolique`}
                            />
                            <span className="text-natural-secondary/40">/</span>
                            <input
                              type="number"
                              value={inlineDia}
                              onChange={(e) => setInlineDia(parseInt(e.target.value) || 0)}
                              className="w-16 px-2 py-1 border border-natural-border rounded text-center focus:ring-1 focus:ring-natural-primary bg-natural-surface text-sm font-mono"
                              aria-label={`Modifier la tension diastolique`}
                            />
                          </div>
                        ) : (
                          <span className={`font-mono ${bpColor}`}>
                            {r.systolic}/{r.diastolic}
                          </span>
                        )}
                      </td>

                      {/* Pulse */}
                      <td className="py-3 px-4 text-center" role="cell" headers="col-pulse">
                        {isEditing ? (
                          <input
                            type="number"
                            value={inlinePulse}
                            onChange={(e) => setInlinePulse(parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 border border-natural-border rounded text-center focus:ring-1 focus:ring-natural-primary bg-natural-surface text-sm font-mono"
                            aria-label={`Modifier le pouls`}
                          />
                        ) : (
                          <span className={`font-mono ${pulseColor}`}>
                            {r.pulse}
                          </span>
                        )}
                      </td>

                      {/* Status - Single indicator */}
                      <td className="py-3 px-4" role="cell" headers="col-status">
                        {isEditing ? (
                          <span className="text-xs text-natural-secondary/60 italic">En modification...</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            {/* Classification badge - simplified */}
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                              cls.category === "Optimale" ? "bg-emerald-100 text-emerald-700" :
                              cls.category === "Normale" ? "bg-green-50 text-green-600" :
                              cls.category === "Élevée" || cls.category === "HTA" ? "bg-rose-100 text-rose-700" :
                              "bg-amber-100 text-amber-700"
                            }`}>
                              {cls.category}
                            </span>

                            {/* Single warning indicator */}
                            {hasAnyAbnormality && (
                              <span className="text-amber-500" title="Hors recommandations">
                                <AlertTriangle className="h-4 w-4" />
                              </span>
                            )}

                            {/* Expand button for details */}
                            {(r.remarks || (settings.spo2Enabled && r.spo2)) && (
                              <button
                                onClick={() => toggleRowExpand(r.id)}
                                className="p-1 hover:bg-natural-bg rounded transition-colors text-natural-secondary/40 hover:text-natural-secondary"
                                title={isExpanded ? "Masquer les détails" : "Voir les détails"}
                              >
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" role="cell" headers="col-actions">
                        <div className="flex items-center justify-end gap-1">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSaveInlineEdit(r)}
                                className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded transition-colors"
                                title="Sauvegarder"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setEditingRowId(null)}
                                className="p-1.5 hover:bg-rose-50 text-rose-600 rounded transition-colors"
                                title="Annuler"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleStartInlineEdit(r)}
                                className="p-1.5 hover:bg-natural-bg text-natural-secondary/60 hover:text-natural-primary rounded transition-colors"
                                title="Modifier"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteRequest(r.id)}
                                className="p-1.5 hover:bg-rose-50 text-natural-secondary/60 hover:text-rose-600 rounded transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded row for details */}
                    {isExpanded && !isEditing && (
                      <tr className="bg-natural-bg/30" role="row">
                        <td colSpan={5} className="px-4 py-3" role="cell">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {/* SpO2 if enabled */}
                            {settings.spo2Enabled && typeof r.spo2 === "number" && (
                            <div className="flex items-center gap-3">
                              <span className="text-natural-secondary/60 text-xs uppercase tracking-wide">SpO2</span>
                              <span className={`font-mono font-semibold ${
                                r.spo2 <= settings.spo2Low ? "text-amber-600" : "text-natural-dark"
                              }`}>
                                {r.spo2}%
                              </span>
                            </div>
                            )}

                            {/* Remarks */}
                            {r.remarks && (
                              <div className="md:col-span-2">
                                <span className="text-natural-secondary/60 text-xs uppercase tracking-wide block mb-1">Remarques</span>
                                <p className="text-natural-dark italic">{r.remarks}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer statistics indicator */}
      <div className="px-4 py-3 border-t border-natural-border/50 bg-natural-bg/20 text-xs text-natural-secondary flex justify-between items-center">
        <span>
          <strong className="text-natural-dark">{filteredRecords.length}</strong> sur <strong className="text-natural-dark">{records.length}</strong> mesures
        </span>
        <span className="flex items-center gap-1.5 text-xs">
          <AlertTriangle className="h-3.5 w-3.5 text-natural-primary" />
          Stockage local sécurisé
        </span>
      </div>
    </div>
  );
}
