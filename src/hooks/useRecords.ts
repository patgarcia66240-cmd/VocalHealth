import { useEffect, useState } from "react";
import { MeasurementRecord } from "../types";
import {
  clearAllRecords,
  DatabaseError,
  deleteRecord,
  getAllRecords,
  saveMultipleRecords,
  saveRecord,
} from "../db";

const STATUS_TIMEOUT_MS = 5000;

function sortNewestFirst(records: MeasurementRecord[]) {
  return [...records].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getRecordDateKey(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp.slice(0, 10);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function useRecords(onStatusMessage: (message: string | null) => void) {
  const [records, setRecords] = useState<MeasurementRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const showStatus = (message: string) => {
    onStatusMessage(message);
    setTimeout(() => onStatusMessage(null), STATUS_TIMEOUT_MS);
  };

  useEffect(() => {
    async function loadIndexedData() {
      try {
        const startTime = Date.now();
        const stored = await getAllRecords();
        setRecords(sortNewestFirst(stored));

        const elapsedTime = Date.now() - startTime;
        const minLoadTime = 800;
        if (elapsedTime < minLoadTime) {
          await new Promise((resolve) => setTimeout(resolve, minLoadTime - elapsedTime));
        }
      } catch (error) {
        console.error("Erreur de chargement d'IndexedDB :", error);
        if (error instanceof DatabaseError) {
          showStatus("Impossible de charger les données. Veuillez actualiser la page.");
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadIndexedData();
  }, []);

  const addRecord = async (newRecordData: Omit<MeasurementRecord, "id">) => {
    const newRecord: MeasurementRecord = {
      ...newRecordData,
      id: `rec-${Math.random().toString(36).slice(2, 11)}`,
    };

    await saveRecord(newRecord);
    setRecords((prev) => [newRecord, ...prev]);
    return newRecord;
  };

  const editRecord = async (updatedRecord: MeasurementRecord) => {
    await saveRecord(updatedRecord);
    setRecords((prev) => prev.map((record) => (record.id === updatedRecord.id ? updatedRecord : record)));
  };

  const removeRecord = async (id: string) => {
    await deleteRecord(id);
    setRecords((prev) => prev.filter((record) => record.id !== id));
  };

  const replaceImportedRecords = async (
    imported: MeasurementRecord[],
    replaceDateKeys = new Set<string>(),
    patientId?: string,
  ) => {
    const isInScope = (record: MeasurementRecord) => !patientId || record.patientId === patientId;
    const remainingRecords = records.filter((record) => !(isInScope(record) && replaceDateKeys.has(getRecordDateKey(record.timestamp))));
    const nextRecords = sortNewestFirst([...imported, ...remainingRecords]);

    for (const record of records) {
      if (isInScope(record) && replaceDateKeys.has(getRecordDateKey(record.timestamp))) {
        await deleteRecord(record.id);
      }
    }

    await saveMultipleRecords(nextRecords);
    setRecords(nextRecords);
    showStatus(`${imported.length} mesure(s) importée(s).`);
  };

  const clearRecords = async (patientId?: string) => {
    if (patientId) {
      const recordsToDelete = records.filter((record) => record.patientId === patientId);
      for (const record of recordsToDelete) {
        await deleteRecord(record.id);
      }
      setRecords((prev) => prev.filter((record) => record.patientId !== patientId));
      return;
    }

    await clearAllRecords();
    setRecords([]);
  };

  return {
    records,
    isLoading,
    addRecord,
    editRecord,
    removeRecord,
    replaceImportedRecords,
    clearRecords,
    showStatus,
  };
}
