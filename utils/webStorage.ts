import { Army, Collection } from '@/types/army';

const DB_NAME = 'heroscape-builder';
const DB_VERSION = 1;

interface DBOrm {
  armies: Army[];
  armyCards: { armyId: string; cardId: string; quantity: number }[];
  collection: { cardId: string; quantity: number }[];
  collectionMeta: { updatedAt: string };
}

let db: IDBDatabase | null = null;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      if (!database.objectStoreNames.contains('armies')) {
        database.createObjectStore('armies', { keyPath: 'id' });
      }

      if (!database.objectStoreNames.contains('armyCards')) {
        const armyCardsStore = database.createObjectStore('armyCards', { keyPath: ['armyId', 'cardId'] });
        armyCardsStore.createIndex('armyId', 'armyId', { unique: false });
      }

      if (!database.objectStoreNames.contains('collection')) {
        database.createObjectStore('collection', { keyPath: 'cardId' });
      }

      if (!database.objectStoreNames.contains('collectionMeta')) {
        database.createObjectStore('collectionMeta', { keyPath: 'id' });
      }
    };
  });
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export async function getArmies(): Promise<Army[]> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['armies', 'armyCards'], 'readonly');
    const armiesStore = transaction.objectStore('armies');
    const armyCardsStore = transaction.objectStore('armyCards');
    const index = armyCardsStore.index('armyId');

    const armiesRequest = armiesStore.getAll();

    armiesRequest.onsuccess = () => {
      const armyRows = armiesRequest.result as Army[];

      if (armyRows.length === 0) {
        resolve([]);
        return;
      }

      const armies: Army[] = [];
      let processed = 0;

      armyRows.forEach((army) => {
        const cardsRequest = index.getAll(army.id);

        cardsRequest.onsuccess = () => {
          const cards = cardsRequest.result as { armyId: string; cardId: string; quantity: number }[];
          armies.push({
            ...army,
            cards: cards.map(c => ({ cardId: c.cardId, quantity: c.quantity })),
          });

          processed++;
          if (processed === armyRows.length) {
            armies.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            resolve(armies);
          }
        };

        cardsRequest.onerror = () => {
          armies.push({ ...army, cards: [] });
          processed++;
          if (processed === armyRows.length) {
            armies.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            resolve(armies);
          }
        };
      });
    };

    armiesRequest.onerror = () => reject(armiesRequest.error);
  });
}

export async function saveArmies(armies: Army[]): Promise<void> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['armies', 'armyCards'], 'readwrite');
    const armiesStore = transaction.objectStore('armies');
    const armyCardsStore = transaction.objectStore('armyCards');

    const clearArmiesRequest = armiesStore.clear();
    const clearCardsRequest = armyCardsStore.clear();

    let pending = 2;

    const checkComplete = () => {
      pending--;
      if (pending === 0) {
        let cardsPending = 0;

        armies.forEach((army) => {
          armiesStore.put(army);
          army.cards.forEach((card) => {
            cardsPending++;
            armyCardsStore.put({ armyId: army.id, cardId: card.cardId, quantity: card.quantity });
          });
        });

        if (cardsPending === 0) {
          resolve();
        } else {
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        }
      }
    };

    clearArmiesRequest.onsuccess = checkComplete;
    clearCardsRequest.onsuccess = checkComplete;
    clearArmiesRequest.onerror = () => reject(clearArmiesRequest.error);
    clearCardsRequest.onerror = () => reject(clearCardsRequest.error);
  });
}

export async function createArmy(
  name: string = 'New Army',
  pointTotal: number = 500,
  contemporaryOnly: boolean = true
): Promise<Army> {
  const database = await openDatabase();
  const now = new Date().toISOString();

  const army: Army = {
    id: generateId(),
    name,
    pointTotal,
    contemporaryOnly,
    cards: [],
    createdAt: now,
    updatedAt: now,
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['armies'], 'readwrite');
    const armiesStore = transaction.objectStore('armies');

    const request = armiesStore.put(army);

    request.onsuccess = () => resolve(army);
    request.onerror = () => reject(request.error);
  });
}

export async function updateArmy(army: Army): Promise<Army> {
  const database = await openDatabase();

  const now = new Date().toISOString();
  army.updatedAt = now;

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['armies'], 'readwrite');
    const armiesStore = transaction.objectStore('armies');

    const request = armiesStore.put(army);

    request.onsuccess = () => resolve(army);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteArmy(armyId: string): Promise<void> {
  console.log('deleteArmy called with:', armyId);
  const database = await openDatabase();
  console.log('database opened');

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['armies', 'armyCards'], 'readwrite');
    const armiesStore = transaction.objectStore('armies');
    const armyCardsStore = transaction.objectStore('armyCards');
    const index = armyCardsStore.index('armyId');
    const cardsRequest = index.getAll(armyId);

    cardsRequest.onsuccess = () => {
      const cards = cardsRequest.result as { armyId: string; cardId: string; quantity: number }[];
      console.log('Found cards to delete:', cards.length);

      if (cards.length === 0) {
        const armyReq = armiesStore.delete(armyId);
        armyReq.onsuccess = () => {
          console.log('Army deleted successfully');
          resolve();
        };
        armyReq.onerror = () => {
          console.error('Army delete error:', armyReq.error);
          reject(armyReq.error);
        };
        return;
      }

      let completed = 0;
      const total = cards.length;

      cards.forEach((card) => {
        const deleteReq = armyCardsStore.delete([armyId, card.cardId]);
        deleteReq.onsuccess = () => {
          completed++;
          console.log('Card deleted, progress:', completed, '/', total);
          if (completed === total) {
            const armyReq = armiesStore.delete(armyId);
            armyReq.onsuccess = () => {
              console.log('Army deleted after cards');
              resolve();
            };
            armyReq.onerror = () => reject(armyReq.error);
          }
        };
        deleteReq.onerror = () => reject(deleteReq.error);
      });
    };

    cardsRequest.onerror = () => reject(cardsRequest.error);
  });
}

export async function addCardToArmy(armyId: string, cardId: string, quantity: number = 1): Promise<Army> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['armyCards', 'armies'], 'readwrite');
    const armyCardsStore = transaction.objectStore('armyCards');
    const armiesStore = transaction.objectStore('armies');

    const index = armyCardsStore.index('armyId');
    const existingRequest = index.getAll(armyId);

    existingRequest.onsuccess = () => {
      const allCards = existingRequest.result as { armyId: string; cardId: string; quantity: number }[];
      const existing = allCards.find((r) => r.cardId === cardId);

      if (existing) {
        const updateRequest = armyCardsStore.put({
          armyId,
          cardId,
          quantity: existing.quantity + quantity,
        });

        updateRequest.onsuccess = () => {
          const armyRequest = armiesStore.get(armyId);
          armyRequest.onsuccess = () => resolve(armyRequest.result);
          armyRequest.onerror = () => reject(armyRequest.error);
        };

        updateRequest.onerror = () => reject(updateRequest.error);
      } else {
        const addRequest = armyCardsStore.put({ armyId, cardId, quantity });

        addRequest.onsuccess = () => {
          const armyRequest = armiesStore.get(armyId);
          armyRequest.onsuccess = () => resolve(armyRequest.result);
          armyRequest.onerror = () => reject(armyRequest.error);
        };

        addRequest.onerror = () => reject(addRequest.error);
      }
    };

    existingRequest.onerror = () => reject(existingRequest.error);
  });
}

export async function removeCardFromArmy(armyId: string, cardId: string): Promise<Army> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['armyCards', 'armies'], 'readwrite');
    const armyCardsStore = transaction.objectStore('armyCards');
    const armiesStore = transaction.objectStore('armies');

    const deleteReq = armyCardsStore.delete([armyId, cardId]);
    deleteReq.onsuccess = () => {
      const armyRequest = armiesStore.get(armyId);
      armyRequest.onsuccess = () => resolve(armyRequest.result);
      armyRequest.onerror = () => reject(armyRequest.error);
    };
    deleteReq.onerror = () => reject(deleteReq.error);
  });
}

export async function decrementCardInArmy(armyId: string, cardId: string): Promise<Army> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['armyCards', 'armies'], 'readwrite');
    const armyCardsStore = transaction.objectStore('armyCards');
    const armiesStore = transaction.objectStore('armies');
    const index = armyCardsStore.index('armyId');
    const existingRequest = index.getAll(armyId);

    existingRequest.onsuccess = () => {
      const allCards = existingRequest.result as { armyId: string; cardId: string; quantity: number }[];
      const existing = allCards.find((r) => r.cardId === cardId);

      if (!existing) {
        resolve(undefined as unknown as Army);
        return;
      }

      if (existing.quantity <= 1) {
        const deleteReq = armyCardsStore.delete([armyId, cardId]);
        deleteReq.onsuccess = () => {
          const armyRequest = armiesStore.get(armyId);
          armyRequest.onsuccess = () => resolve(armyRequest.result);
          armyRequest.onerror = () => reject(armyRequest.error);
        };
      } else {
        const putReq = armyCardsStore.put({
          armyId,
          cardId,
          quantity: existing.quantity - 1,
        });
        putReq.onsuccess = () => {
          const armyRequest = armiesStore.get(armyId);
          armyRequest.onsuccess = () => resolve(armyRequest.result);
          armyRequest.onerror = () => reject(armyRequest.error);
        };
      }
    };

    existingRequest.onerror = () => reject(existingRequest.error);
  });
}

export async function updateCardQuantity(armyId: string, cardId: string, quantity: number): Promise<Army> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['armyCards', 'armies'], 'readwrite');
    const armyCardsStore = transaction.objectStore('armyCards');
    const armiesStore = transaction.objectStore('armies');

    if (quantity <= 0) {
      const deleteReq = armyCardsStore.delete([armyId, cardId]);
      deleteReq.onsuccess = () => {
        const armyRequest = armiesStore.get(armyId);
        armyRequest.onsuccess = () => resolve(armyRequest.result);
        armyRequest.onerror = () => reject(armyRequest.error);
      };
      deleteReq.onerror = () => reject(deleteReq.error);
    } else {
      const putReq = armyCardsStore.put({ armyId, cardId, quantity });
      putReq.onsuccess = () => {
        const armyRequest = armiesStore.get(armyId);
        armyRequest.onsuccess = () => resolve(armyRequest.result);
        armyRequest.onerror = () => reject(armyRequest.error);
      };
      putReq.onerror = () => reject(putReq.error);
    }
  });
}

export async function getCollection(): Promise<Collection> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['collection', 'collectionMeta'], 'readonly');
    const collectionStore = transaction.objectStore('collection');
    const metaStore = transaction.objectStore('collectionMeta');

    const cardsRequest = collectionStore.getAll();
    const metaRequest = metaStore.get('meta');

    let cards: { cardId: string; quantity: number }[] = [];
    let updatedAt = new Date().toISOString();

    cardsRequest.onsuccess = () => {
      cards = cardsRequest.result;
    };

    cardsRequest.onerror = () => reject(cardsRequest.error);

    metaRequest.onsuccess = () => {
      if (metaRequest.result) {
        updatedAt = metaRequest.result.updatedAt;
      }
    };

    metaRequest.onerror = () => reject(metaRequest.error);

    transaction.oncomplete = () => {
      resolve({
        cards: cards.map((c) => ({ cardId: c.cardId, quantity: c.quantity })),
        updatedAt,
      });
    };

    transaction.onerror = () => reject(transaction.error);
  });
}

export async function saveCollection(collection: Collection): Promise<void> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['collection', 'collectionMeta'], 'readwrite');
    const collectionStore = transaction.objectStore('collection');
    const metaStore = transaction.objectStore('collectionMeta');

    collectionStore.clear();
    metaStore.clear();

    collection.cards.forEach((card) => {
      collectionStore.put(card);
    });

    metaStore.put({ id: 'meta', updatedAt: collection.updatedAt });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function addCardToCollection(cardId: string, quantity: number = 1): Promise<Collection> {
  const database = await openDatabase();
  const now = new Date().toISOString();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['collection', 'collectionMeta'], 'readwrite');
    const collectionStore = transaction.objectStore('collection');
    const metaStore = transaction.objectStore('collectionMeta');

    const existingRequest = collectionStore.get(cardId);

    existingRequest.onsuccess = () => {
      if (existingRequest.result) {
        collectionStore.put({
          cardId,
          quantity: existingRequest.result.quantity + quantity,
        });
      } else {
        collectionStore.put({ cardId, quantity });
      }

      metaStore.put({ id: 'meta', updatedAt: now });
    };

    existingRequest.onerror = () => reject(existingRequest.error);

    transaction.oncomplete = () => {
      getCollection().then(resolve).catch(reject);
    };

    transaction.onerror = () => reject(transaction.error);
  });
}

export async function removeCardFromCollection(cardId: string): Promise<Collection> {
  const database = await openDatabase();
  const now = new Date().toISOString();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['collection', 'collectionMeta'], 'readwrite');
    const collectionStore = transaction.objectStore('collection');
    const metaStore = transaction.objectStore('collectionMeta');

    collectionStore.delete(cardId);
    metaStore.put({ id: 'meta', updatedAt: now });

    transaction.oncomplete = () => {
      getCollection().then(resolve).catch(reject);
    };

    transaction.onerror = () => reject(transaction.error);
  });
}

export async function updateCardQuantityInCollection(cardId: string, quantity: number): Promise<Collection> {
  const database = await openDatabase();
  const now = new Date().toISOString();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['collection', 'collectionMeta'], 'readwrite');
    const collectionStore = transaction.objectStore('collection');
    const metaStore = transaction.objectStore('collectionMeta');

    if (quantity <= 0) {
      collectionStore.delete(cardId);
    } else {
      collectionStore.put({ cardId, quantity });
    }

    metaStore.put({ id: 'meta', updatedAt: now });

    transaction.oncomplete = () => {
      getCollection().then(resolve).catch(reject);
    };

    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getCollectionCardQuantity(cardId: string): Promise<number> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['collection'], 'readonly');
    const collectionStore = transaction.objectStore('collection');

    const request = collectionStore.get(cardId);

    request.onsuccess = () => {
      resolve(request.result?.quantity || 0);
    };

    request.onerror = () => reject(request.error);
  });
}