import { MeasurementRecord } from "./types";

const DB_NAME = "VocalTensionDB";
const STORE_NAME = "records";
const DB_VERSION = 1;

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
    };
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
