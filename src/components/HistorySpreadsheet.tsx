/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Download, Upload, Search, Trash2, Edit3, Calendar, FileSpreadsheet, ShieldAlert, FileText, Check, AlertTriangle, X } from "lucide-react";
import { MeasurementRecord, PeriodFilter } from "../types";
import { formatDateFr, classifyBloodPressure, checkMedicalThresholds } from "../utils";
import { motion } from "motion/react";

interface HistorySpreadsheetProps {
  records: MeasurementRecord[];
  filter: PeriodFilter;
  onFilterChange: (filter: PeriodFilter) => void;
  onDeleteRecord: (id: string) => void;
  onEditRecord?: (record: MeasurementRecord) => void;
  onImportRecords: (imported: MeasurementRecord[]) => void;
}

export default function HistorySpreadsheet({
  records,
  filter,
  onFilterChange,
  onDeleteRecord,
  onEditRecord,
  onImportRecords,
}: HistorySpreadsheetProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  
  // Quick inline edit state
  const [inlineSys, setInlineSys] = useState<number>(120);
  const [inlineDia, setInlineDia] = useState<number>(80);
  const [inlinePulse, setInlinePulse] = useState<number>(70);
  const [inlineRemarks, setInlineRemarks] = useState<string>("");

  const handleStartInlineEdit = (r: MeasurementRecord) => {
    setEditingRowId(r.id);
    setInlineSys(r.systolic);
    setInlineDia(r.diastolic);
    setInlinePulse(r.pulse);
    setInlineRemarks(r.remarks || "");
  };

  const handleSaveInlineEdit = (r: MeasurementRecord) => {
    if (onEditRecord) {
      onEditRecord({
        ...r,
        systolic: inlineSys,
        diastolic: inlineDia,
        pulse: inlinePulse,
        remarks: inlineRemarks,
      });
    }
    setEditingRowId(null);
  };

  // Export to CSV
  const exportToCSV = () => {
    if (records.length === 0) return;
    
    // Header
    const headers = ["ID", "Date & Heure", "Systolique (mmHg)", "Diastolique (mmHg)", "Pouls (bpm)", "Classification", "Remarques"];
    
    // Rows
    const rows = records.map(r => {
      const cls = classifyBloodPressure(r.systolic, r.diastolic);
      return [
        r.id,
        formatDateFr(r.timestamp, true),
        r.systolic,
        r.diastolic,
        r.pulse,
        cls.category,
        r.remarks || ""
      ];
    });

    // Content assembly
    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    // File download
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
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
        // Attempt to parse as JSON
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          // Quick schema validation
          const validated: MeasurementRecord[] = parsed.filter(item => 
            item && 
            typeof item.systolic === "number" && 
            typeof item.diastolic === "number" && 
            typeof item.pulse === "number"
          ).map(item => ({
            id: item.id || `imported-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: item.timestamp || new Date().toISOString(),
            systolic: item.systolic,
            diastolic: item.diastolic,
            pulse: item.pulse,
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

  // Filter records based on search term and period
  const filteredRecords = records.filter(r => {
    const term = searchTerm.toLowerCase();
    const remarksMatch = (r.remarks || "").toLowerCase().includes(term);
    const dateMatch = formatDateFr(r.timestamp, true).toLowerCase().includes(term);
    const classification = classifyBloodPressure(r.systolic, r.diastolic).category.toLowerCase();
    const classMatch = classification.includes(term);
    
    return remarksMatch || dateMatch || classMatch;
  });

  return (
    <div className="bg-natural-surface rounded-[32px] border border-natural-border shadow-sm overflow-hidden" id="spreadsheet-container">
      {/* Header and Toolbar */}
      <div className="p-6 border-b border-natural-border bg-natural-bg/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-natural-primary" />
            <h2 className="text-base font-bold text-natural-primary" id="spreadsheet-title">Feuille de calcul des mesures</h2>
          </div>
          <p className="text-[11px] text-natural-secondary">Visualisez, filtrez, modifiez ou exportez l'historique complet de vos constantes</p>
        </div>

        {/* Toolbar controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Period Filter Tabs */}
          <div className="flex bg-natural-bg p-1 rounded-xl border border-natural-border/60 text-xs font-bold" id="period-filter-tabs">
            {(["all", "month", "week", "day"] as PeriodFilter[]).map((p) => (
              <button
                key={p}
                onClick={() => onFilterChange(p)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filter === p
                    ? "bg-natural-primary text-white shadow-sm"
                    : "text-natural-secondary hover:text-natural-primary"
                }`}
              >
                {p === "all" && "Tout"}
                {p === "month" && "Mois"}
                {p === "week" && "Semaine"}
                {p === "day" && "Jour"}
              </button>
            ))}
          </div>

          {/* Import / Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              disabled={records.length === 0}
              className="p-2 px-3.5 bg-natural-surface border border-natural-border hover:bg-natural-bg text-natural-primary rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              title="Exporter l'historique au format CSV"
              id="export-csv-btn"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Exporter CSV</span>
            </button>
            
            <label
              className="p-2 px-3.5 bg-natural-surface border border-natural-border hover:bg-natural-bg text-natural-primary rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Importer une sauvegarde JSON"
              id="import-json-label"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Importer JSON</span>
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
      <div className="px-6 py-4 border-b border-natural-border flex items-center gap-2 bg-natural-surface">
        <Search className="h-4 w-4 text-natural-secondary shrink-0" />
        <input
          type="text"
          placeholder="Rechercher une remarque, une date, ou une classification..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-xs text-natural-dark focus:outline-none placeholder-natural-secondary/60 bg-transparent"
          id="search-input"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="text-[10px] bg-natural-bg hover:bg-natural-border text-natural-primary px-2.5 py-1 rounded-lg font-bold cursor-pointer"
          >
            Effacer
          </button>
        )}
      </div>

      {/* Spreadsheet Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" id="spreadsheet-table">
          <thead>
            <tr className="border-b border-natural-border bg-natural-bg/25 text-[9px] font-bold text-natural-secondary uppercase tracking-widest font-mono">
              <th className="py-3 px-6">Date & Heure</th>
              <th className="py-3 px-4 text-center">Systolique (SYS)</th>
              <th className="py-3 px-4 text-center">Diastolique (DIA)</th>
              <th className="py-3 px-4 text-center">Pouls (FC)</th>
              <th className="py-3 px-4">Classification</th>
              <th className="py-3 px-6 w-1/3">Remarques & Commentaires</th>
              <th className="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-natural-border text-xs text-natural-dark">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-natural-secondary">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-natural-secondary/50" />
                  <p className="font-bold">Aucune mesure enregistrée pour ce filtre</p>
                  <p className="text-[11px] mt-0.5">Utilisez la commande vocale ou l'enregistrement manuel ci-dessus !</p>
                </td>
              </tr>
            ) : (
              filteredRecords.map((r) => {
                const isEditing = editingRowId === r.id;
                const cls = classifyBloodPressure(r.systolic, r.diastolic);
                
                // Real-time medical threshold checks
                const isSysAbnormal = r.systolic >= 140 || r.systolic <= 90;
                const sysColor = r.systolic >= 180 ? "text-red-600 font-extrabold" : r.systolic >= 140 ? "text-rose-500" : r.systolic <= 90 ? "text-blue-500" : "text-natural-primary";
                
                const isDiaAbnormal = r.diastolic >= 90 || r.diastolic <= 60;
                const diaColor = r.diastolic >= 110 ? "text-red-600 font-extrabold" : r.diastolic >= 90 ? "text-rose-500" : r.diastolic <= 60 ? "text-blue-500" : "text-natural-primary";
                
                const isPulseAbnormal = r.pulse >= 100 || r.pulse <= 50;
                const pulseColor = r.pulse >= 120 ? "text-red-600 font-extrabold" : r.pulse >= 100 ? "text-rose-500" : r.pulse <= 50 ? "text-blue-500" : "text-natural-primary";
                
                return (
                  <tr
                    key={r.id}
                    className={`hover:bg-natural-bg/15 transition-colors ${isEditing ? "bg-natural-bg/40" : ""}`}
                  >
                    {/* Timestamp */}
                    <td className="py-3.5 px-6 font-mono text-natural-secondary">
                      {formatDateFr(r.timestamp, true)}
                    </td>

                    {/* Systolic */}
                    <td className="py-3.5 px-4 text-center font-bold">
                      {isEditing ? (
                        <input
                          type="number"
                          value={inlineSys}
                          onChange={(e) => setInlineSys(parseInt(e.target.value) || 0)}
                          className="w-16 px-1.5 py-1 border border-natural-border rounded-lg text-center focus:ring-1 focus:ring-natural-primary bg-natural-surface text-xs"
                        />
                      ) : (
                        <span className={`inline-flex items-center justify-center gap-1.5 font-bold ${sysColor}`}>
                          <span>{r.systolic}</span>
                          <span className="text-[10px] text-natural-secondary font-normal font-sans">mmHg</span>
                          {isSysAbnormal && (
                            <span 
                              className={`h-2 w-2 rounded-full ${r.systolic >= 180 ? "bg-red-500 animate-pulse" : "bg-rose-400"}`} 
                              title={r.systolic >= 140 ? "Tension systolique élevée" : "Tension systolique basse"}
                            />
                          )}
                        </span>
                      )}
                    </td>

                    {/* Diastolic */}
                    <td className="py-3.5 px-4 text-center font-bold">
                      {isEditing ? (
                        <input
                          type="number"
                          value={inlineDia}
                          onChange={(e) => setInlineDia(parseInt(e.target.value) || 0)}
                          className="w-16 px-1.5 py-1 border border-natural-border rounded-lg text-center focus:ring-1 focus:ring-natural-primary bg-natural-surface text-xs"
                        />
                      ) : (
                        <span className={`inline-flex items-center justify-center gap-1.5 font-bold ${diaColor}`}>
                          <span>{r.diastolic}</span>
                          <span className="text-[10px] text-natural-secondary font-normal font-sans">mmHg</span>
                          {isDiaAbnormal && (
                            <span 
                              className={`h-2 w-2 rounded-full ${r.diastolic >= 110 ? "bg-red-500 animate-pulse" : "bg-rose-400"}`} 
                              title={r.diastolic >= 90 ? "Tension diastolique élevée" : "Tension diastolique basse"}
                            />
                          )}
                        </span>
                      )}
                    </td>

                    {/* Pulse */}
                    <td className="py-3.5 px-4 text-center font-mono">
                      {isEditing ? (
                        <input
                          type="number"
                          value={inlinePulse}
                          onChange={(e) => setInlinePulse(parseInt(e.target.value) || 0)}
                          className="w-16 px-1.5 py-1 border border-natural-border rounded-lg text-center focus:ring-1 focus:ring-natural-primary bg-natural-surface text-xs"
                        />
                      ) : (
                        <span className={`inline-flex items-center justify-center gap-1.5 font-bold ${pulseColor}`}>
                          <span>{r.pulse}</span>
                          <span className="text-[10px] text-natural-secondary font-normal font-sans">bpm</span>
                          {isPulseAbnormal && (
                            <span 
                              className={`h-2 w-2 rounded-full ${r.pulse >= 120 ? "bg-red-500 animate-pulse" : "bg-rose-400"}`} 
                              title={r.pulse >= 100 ? "Rythme cardiaque élevé (Tachycardie)" : "Rythme cardiaque bas (Bradycardie)"}
                            />
                          )}
                        </span>
                      )}
                    </td>

                    {/* Classification */}
                    <td className="py-3.5 px-4">
                      {isEditing ? (
                        <span className="text-[11px] text-natural-secondary italic">Calculé</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border border-natural-border/30 ${cls.bgColor} ${cls.color}`}>
                            {cls.category}
                          </span>
                          {(isSysAbnormal || isDiaAbnormal || isPulseAbnormal) && (
                            <span className="text-amber-500 font-bold text-xs shrink-0" title="Une ou plusieurs constantes dépassent les recommandations normales">⚠️</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Remarks */}
                    <td className="py-3.5 px-6 text-natural-dark font-sans">
                      {isEditing ? (
                        <input
                          type="text"
                          value={inlineRemarks}
                          onChange={(e) => setInlineRemarks(e.target.value)}
                          className="w-full px-2.5 py-1 border border-natural-border rounded-lg focus:ring-1 focus:ring-natural-primary bg-natural-surface text-xs"
                        />
                      ) : (
                        <span className="italic block max-w-sm truncate" title={r.remarks}>
                          {r.remarks || "—"}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveInlineEdit(r)}
                              className="p-1.5 hover:bg-natural-bg text-natural-primary rounded-lg transition-all cursor-pointer"
                              title="Sauvegarder"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingRowId(null)}
                              className="p-1.5 hover:bg-rose-50 text-rose-700 rounded-lg transition-all cursor-pointer"
                              title="Annuler"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartInlineEdit(r)}
                              className="p-1.5 hover:bg-natural-bg text-natural-secondary hover:text-natural-primary rounded-lg transition-all cursor-pointer"
                              title="Modifier"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Voulez-vous vraiment supprimer cette mesure de l'historique ?")) {
                                  onDeleteRecord(r.id);
                                }
                              }}
                              className="p-1.5 hover:bg-rose-50/50 text-natural-secondary hover:text-rose-600 rounded-lg transition-all cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Footer statistics indicator */}
      <div className="p-5 border-t border-natural-border bg-natural-bg/30 text-[10px] text-natural-secondary flex justify-between items-center font-sans">
        <span>Affichage de <strong className="text-natural-primary">{filteredRecords.length}</strong> sur <strong className="text-natural-primary">{records.length}</strong> entrées</span>
        <span className="flex items-center gap-1">
          <AlertTriangle className="h-3.5 w-3.5 text-natural-primary" />
          Les données médicales sont stockées localement en toute sécurité.
        </span>
      </div>
    </div>
  );
}
