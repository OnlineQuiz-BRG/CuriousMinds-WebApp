
import { Question } from '../types';

const DB_NAME = 'CuriousMindsDB';
const DB_VERSION = 3; 
const STORE_NAME = 'questions';
const MASTER_WORDS_STORE = 'master_words';

export interface MasterWord {
  id: string; // stage-wordNum
  stage: string;
  telugu: string;
  english: string;
  hindi: string;
}

export const db = {
  open: (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('level', 'level', { unique: false });
        }
        if (!db.objectStoreNames.contains(MASTER_WORDS_STORE)) {
          const store = db.createObjectStore(MASTER_WORDS_STORE, { keyPath: 'id' });
          store.createIndex('stage', 'stage', { unique: false });
        }
        
        const transaction = (event.target as IDBOpenDBRequest).transaction;
        if (transaction) {
          const qStore = transaction.objectStore(STORE_NAME);
          if (!qStore.indexNames.contains('level')) {
            qStore.createIndex('level', 'level', { unique: false });
          }
        }
      };
    });
  },

  saveQuestions: async (questions: Question[]): Promise<void> => {
    const idb = await db.open();
    return new Promise((resolve, reject) => {
      const transaction = idb.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      questions.forEach(q => store.put(q));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },

  saveMasterWords: async (words: MasterWord[]): Promise<void> => {
    const idb = await db.open();
    return new Promise((resolve, reject) => {
      const transaction = idb.transaction(MASTER_WORDS_STORE, 'readwrite');
      const store = transaction.objectStore(MASTER_WORDS_STORE);
      words.forEach(w => store.put(w));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },

  getMasterWordsByStage: async (stageId: string): Promise<MasterWord[]> => {
    const idb = await db.open();
    return new Promise((resolve, reject) => {
      const transaction = idb.transaction(MASTER_WORDS_STORE, 'readonly');
      const store = transaction.objectStore(MASTER_WORDS_STORE);
      const index = store.index('stage');
      const request = index.getAll(stageId.toLowerCase());
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  getAllMasterWords: async (): Promise<MasterWord[]> => {
    const idb = await db.open();
    return new Promise((resolve, reject) => {
      const transaction = idb.transaction(MASTER_WORDS_STORE, 'readonly');
      const store = transaction.objectStore(MASTER_WORDS_STORE);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  getQuestionsByLevel: async (levelId: string): Promise<Question[]> => {
    const idb = await db.open();
    return new Promise((resolve, reject) => {
      const transaction = idb.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('level');
      const request = index.getAll(levelId.toLowerCase());
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  getAllQuestions: async (): Promise<Question[]> => {
    const idb = await db.open();
    return new Promise((resolve, reject) => {
      const transaction = idb.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  clearLevel: async (levelId: string): Promise<void> => {
    const idb = await db.open();
    const questions = await db.getQuestionsByLevel(levelId);
    return new Promise((resolve, reject) => {
      const transaction = idb.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      questions.forEach(q => store.delete(q.id));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
};
