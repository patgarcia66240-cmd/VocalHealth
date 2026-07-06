import { MeasurementRecord, PatientProfile } from "./types";

const DB_NAME = "VocalTensionDB";
const STORE_NAME = "records";
const PATIENTS_STORE_NAME = "patients";
const APP_STATE_STORE_NAME = "app_state";
const DB_VERSION = 2;

interface AppStateEntry {
  key: string;
  value: string | null;
}

/**
 * Custom error class for database operations
 */
export class DatabaseError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Open/Initialize connection to IndexedDB
 */
export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(PATIENTS_STORE_NAME)) {
        db.createObjectStore(PATIENTS_STORE_NAME, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(APP_STATE_STORE_NAME)) {
        db.createObjectStore(APP_STATE_STORE_NAME, { keyPath: "key" });
      }
    };
  });
}

function requestToPromise<T>(request: IDBRequest<T>, errorMessage: string): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new DatabaseError(errorMessage, request.error || undefined));
  });
}

/**
 * Load all stored blood pressure records
 * @throws {DatabaseError} If the database cannot be accessed or read operation fails
 */
export async function getAllRecords(): Promise<MeasurementRecord[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new DatabaseError("Failed to read records from IndexedDB", request.error || undefined));
      };
    });
  } catch (error) {
    throw new DatabaseError("Failed to open database for reading", error instanceof Error ? error : undefined);
  }
}

export async function getAllPatients(): Promise<PatientProfile[]> {
  try {
    const db = await openDB();
    const transaction = db.transaction(PATIENTS_STORE_NAME, "readonly");
    const store = transaction.objectStore(PATIENTS_STORE_NAME);
    return await requestToPromise<PatientProfile[]>(store.getAll(), "Failed to read patients from IndexedDB");
  } catch (error) {
    throw new DatabaseError("Failed to open database for patient reading", error instanceof Error ? error : undefined);
  }
}

export async function savePatient(profile: PatientProfile): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(PATIENTS_STORE_NAME, "readwrite");
    const store = transaction.objectStore(PATIENTS_STORE_NAME);
    await requestToPromise(store.put(profile), "Failed to save patient to IndexedDB");
  } catch (error) {
    throw new DatabaseError("Failed to open database for patient writing", error instanceof Error ? error : undefined);
  }
}

export async function savePatients(profiles: PatientProfile[]): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(PATIENTS_STORE_NAME, "readwrite");
      const store = transaction.objectStore(PATIENTS_STORE_NAME);

      profiles.forEach((profile) => store.put(profile));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new DatabaseError("Failed to save patients to IndexedDB", transaction.error || undefined));
    });
  } catch (error) {
    throw new DatabaseError("Failed to open database for patient bulk writing", error instanceof Error ? error : undefined);
  }
}

export async function deletePatient(id: string): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(PATIENTS_STORE_NAME, "readwrite");
    const store = transaction.objectStore(PATIENTS_STORE_NAME);
    await requestToPromise(store.delete(id), "Failed to delete patient from IndexedDB");
  } catch (error) {
    throw new DatabaseError("Failed to open database for patient deletion", error instanceof Error ? error : undefined);
  }
}

export async function getAppStateValue(key: string): Promise<string | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction(APP_STATE_STORE_NAME, "readonly");
    const store = transaction.objectStore(APP_STATE_STORE_NAME);
    const entry = await requestToPromise<AppStateEntry | undefined>(store.get(key), "Failed to read app state from IndexedDB");
    return entry?.value ?? null;
  } catch (error) {
    throw new DatabaseError("Failed to open database for app state reading", error instanceof Error ? error : undefined);
  }
}

export async function setAppStateValue(key: string, value: string | null): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(APP_STATE_STORE_NAME, "readwrite");
    const store = transaction.objectStore(APP_STATE_STORE_NAME);

    if (value === null) {
      await requestToPromise(store.delete(key), "Failed to delete app state from IndexedDB");
      return;
    }

    await requestToPromise(store.put({ key, value }), "Failed to save app state to IndexedDB");
  } catch (error) {
    throw new DatabaseError("Failed to open database for app state writing", error instanceof Error ? error : undefined);
  }
}

/**
 * Insert or update a single record in the database
 * @throws {DatabaseError} If the save operation fails
 */
export async function saveRecord(record: MeasurementRecord): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new DatabaseError("Failed to save record to IndexedDB", request.error || undefined));
    });
  } catch (error) {
    throw new DatabaseError("Failed to open database for writing", error instanceof Error ? error : undefined);
  }
}

/**
 * Delete a single record from the database by ID
 * @throws {DatabaseError} If the delete operation fails
 */
export async function deleteRecord(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new DatabaseError("Failed to delete record from IndexedDB", request.error || undefined));
    });
  } catch (error) {
    throw new DatabaseError("Failed to open database for deletion", error instanceof Error ? error : undefined);
  }
}

/**
 * Clear all records from the database
 * @throws {DatabaseError} If the clear operation fails
 */
export async function clearAllRecords(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new DatabaseError("Failed to clear records from IndexedDB", request.error || undefined));
    });
  } catch (error) {
    throw new DatabaseError("Failed to open database for clearing", error instanceof Error ? error : undefined);
  }
}

/**
 * Save multiple records to the database sequentially (for backups or bulk updates)
 * @throws {DatabaseError} If any save operation fails
 */
export async function saveMultipleRecords(records: MeasurementRecord[]): Promise<void> {
  if (records.length === 0) {
    return;
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      let index = 0;
      function putNext() {
        if (index < records.length) {
          const req = store.put(records[index]);
          req.onsuccess = () => {
            index++;
            putNext();
          };
          req.onerror = () => reject(new DatabaseError(`Failed to save record ${index + 1}/${records.length} to IndexedDB`, req.error || undefined));
        } else {
          resolve();
        }
      }
      putNext();
    });
  } catch (error) {
    throw new DatabaseError("Failed to open database for bulk write", error instanceof Error ? error : undefined);
  }
}
