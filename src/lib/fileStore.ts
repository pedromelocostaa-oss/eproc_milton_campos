// Armazenamento de arquivos (documentos de processos) em IndexedDB.
// Usado em vez do localStorage porque PDFs estouram a cota do localStorage (~5MB).

const DB_NAME = 'eproc-arquivos';
const STORE = 'documentos';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Salva o conteúdo (Blob) de um documento sob a chave informada. */
export async function saveArquivo(id: string, blob: Blob): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(blob, id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

/** Recupera o Blob de um documento (ou null se não existir). */
export async function getArquivo(id: string): Promise<Blob | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => { db.close(); resolve((req.result as Blob) ?? null); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

/** Remove o arquivo de um documento. */
export async function deleteArquivo(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

/** Abre o documento numa nova aba (gera uma URL temporária a partir do Blob). */
export async function abrirArquivo(id: string): Promise<boolean> {
  const blob = await getArquivo(id);
  if (!blob) return false;
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  // Libera a URL depois de um tempo para não vazar memória.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}
