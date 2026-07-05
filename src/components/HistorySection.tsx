import { Suspense, lazy } from "react";
import { MeasurementRecord, MedicalSettings } from "../types";
import { SkeletonSpreadsheet } from "./SkeletonSpreadsheet";

const HistorySpreadsheet = lazy(() => import("./HistorySpreadsheet"));

interface HistorySectionProps {
  isLoading: boolean;
  records: MeasurementRecord[];
  medicalSettings: MedicalSettings;
  onDeleteRequest: (id: string) => void;
  onEditRecord: (record: MeasurementRecord) => void;
  onImportRecords: (records: MeasurementRecord[]) => void;
  onClearAll: () => void;
}

export default function HistorySection({
  isLoading,
  records,
  medicalSettings,
  onDeleteRequest,
  onEditRecord,
  onImportRecords,
  onClearAll,
}: HistorySectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          </div>

        {records.length > 0 && !isLoading && (
          <button
            onClick={onClearAll}
            className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg font-medium transition-colors border border-rose-200"
            id="clear-all-data-btn"
            title="Supprimer tout l'historique"
          >
            Vider tout
          </button>
        )}
      </div>

      {isLoading ? (
        <SkeletonSpreadsheet />
      ) : (
        <Suspense fallback={<SkeletonSpreadsheet />}>
          <HistorySpreadsheet
            records={records}
            onDeleteRequest={onDeleteRequest}
            onEditRecord={onEditRecord}
            onImportRecords={onImportRecords}
            settings={medicalSettings}
          />
        </Suspense>
      )}
    </div>
  );
}
