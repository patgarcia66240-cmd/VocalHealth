/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MeasurementRecord } from "./types";

const DB_NAME = "VocalTensionDB";
const STORE_NAME = "records";
const DB_VERSION = 1;

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
        reject(request.error);
      };
    });
  } catch (error) {
    console.error("Failed to read from IndexedDB:", error);
    return [];
  }
}

/**
 * Insert or update a single record in the database
 */
export async function saveRecord(record: MeasurementRecord): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to save to IndexedDB:", error);
  }
}

/**
 * Delete a single record from the database by ID
 */
export async function deleteRecord(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to delete from IndexedDB:", error);
  }
}

/**
 * Clear all records from the database
 */
export async function clearAllRecords(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to clear IndexedDB:", error);
  }
}

/**
 * Save multiple records to the database sequentially (for backups or bulk updates)
 */
export async function saveMultipleRecords(records: MeasurementRecord[]): Promise<void> {
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
          req.onerror = () => reject(req.error);
        } else {
          resolve();
        }
      }
      putNext();
    });
  } catch (error) {
    console.error("Failed to save multiple records to IndexedDB:", error);
  }
}
