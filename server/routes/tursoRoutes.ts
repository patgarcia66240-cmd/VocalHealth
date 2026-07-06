import { Router } from "express";
import { isTursoConfigured } from "../db/turso";
import { getStorageMode } from "../config/storageMode";
import {
  deletePatientById,
  deleteRecordById,
  getMedicalSettings,
  listPatients,
  listRecords,
  upsertMedicalSettings,
  upsertPatient,
  upsertRecord,
} from "../repositories/tursoRepository";

const router = Router();

router.use((_, res, next) => {
  if (getStorageMode() !== "turso") {
    res.status(409).json({ error: "Cloud storage is disabled. Set APP_STORAGE_MODE=turso to enable these routes." });
    return;
  }

  if (!isTursoConfigured()) {
    res.status(503).json({ error: "Turso is not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN." });
    return;
  }

  next();
});

router.get("/patients", async (_req, res) => {
  try {
    res.json({ patients: await listPatients() });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to list patients" });
  }
});

router.post("/patients", async (req, res) => {
  try {
    res.json({ patient: await upsertPatient(req.body) });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to save patient" });
  }
});

router.put("/patients/:id", async (req, res) => {
  try {
    res.json({ patient: await upsertPatient({ ...req.body, id: req.params.id }) });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update patient" });
  }
});

router.delete("/patients/:id", async (req, res) => {
  try {
    await deletePatientById(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to delete patient" });
  }
});

router.get("/records", async (req, res) => {
  const patientId = String(req.query.patientId || "");
  if (!patientId) {
    res.status(400).json({ error: "patientId is required" });
    return;
  }

  try {
    res.json({ records: await listRecords(patientId) });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to list records" });
  }
});

router.post("/records", async (req, res) => {
  try {
    res.json({ record: await upsertRecord(req.body) });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to save record" });
  }
});

router.put("/records/:id", async (req, res) => {
  try {
    res.json({ record: await upsertRecord({ ...req.body, id: req.params.id }) });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update record" });
  }
});

router.delete("/records/:id", async (req, res) => {
  try {
    await deleteRecordById(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to delete record" });
  }
});

router.get("/medical-settings", async (req, res) => {
  const patientId = String(req.query.patientId || "");
  if (!patientId) {
    res.status(400).json({ error: "patientId is required" });
    return;
  }

  try {
    res.json({ settings: await getMedicalSettings(patientId) });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to load medical settings" });
  }
});

router.put("/medical-settings/:patientId", async (req, res) => {
  try {
    res.json({ settings: await upsertMedicalSettings({ ...req.body, patientId: req.params.patientId }) });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to save medical settings" });
  }
});

export default router;
