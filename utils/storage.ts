import { Platform } from 'react-native';
import { Army, Collection } from '@/types/army';

const isWeb = Platform.OS === 'web';

type ArmyStorageModule = typeof import('./armyStorage');
type CollectionStorageModule = typeof import('./collectionStorage');

let armyStorageModule: ArmyStorageModule | null = null;
let collectionStorageModule: CollectionStorageModule | null = null;
let webStorageModule: typeof import('./webStorage') | null = null;

async function getWebStorage() {
  if (!webStorageModule) {
    webStorageModule = await import('./webStorage');
  }
  return webStorageModule;
}

async function getNativeArmyStorage() {
  if (!armyStorageModule) {
    armyStorageModule = await import('./armyStorage');
  }
  return armyStorageModule;
}

async function getNativeCollectionStorage() {
  if (!collectionStorageModule) {
    collectionStorageModule = await import('./collectionStorage');
  }
  return collectionStorageModule;
}

export async function getArmies(): Promise<Army[]> {
  if (isWeb) {
    const ws = await getWebStorage();
    return ws.getArmies();
  }
  const ns = await getNativeArmyStorage();
  return ns.getArmies();
}

export async function saveArmies(armies: Army[]): Promise<void> {
  if (isWeb) {
    const ws = await getWebStorage();
    return ws.saveArmies(armies);
  }
  const ns = await getNativeArmyStorage();
  return ns.saveArmies(armies);
}

export async function createArmy(
  name: string = 'New Army',
  pointTotal: number = 500,
  contemporaryOnly: boolean = true
): Promise<Army> {
  if (isWeb) {
    const ws = await getWebStorage();
    return ws.createArmy(name, pointTotal, contemporaryOnly);
  }
  const ns = await getNativeArmyStorage();
  return ns.createArmy(name, pointTotal, contemporaryOnly);
}

export async function updateArmy(army: Army): Promise<Army> {
  if (isWeb) {
    const ws = await getWebStorage();
    return ws.updateArmy(army);
  }
  const ns = await getNativeArmyStorage();
  return ns.updateArmy(army);
}

export async function deleteArmy(armyId: string): Promise<void> {
  if (isWeb) {
    const ws = await getWebStorage();
    return ws.deleteArmy(armyId);
  }
  const ns = await getNativeArmyStorage();
  return ns.deleteArmy(armyId);
}

export async function addCardToArmy(armyId: string, cardId: string, quantity: number = 1): Promise<Army> {
  if (isWeb) {
    const ws = await getWebStorage();
    return ws.addCardToArmy(armyId, cardId, quantity);
  }
  const ns = await getNativeArmyStorage();
  return ns.addCardToArmy(armyId, cardId, quantity);
}

export async function removeCardFromArmy(armyId: string, cardId: string): Promise<Army> {
  if (isWeb) {
    const ws = await getWebStorage();
    return ws.removeCardFromArmy(armyId, cardId);
  }
  const ns = await getNativeArmyStorage();
  return ns.removeCardFromArmy(armyId, cardId);
}

export async function decrementCardInArmy(armyId: string, cardId: string): Promise<Army> {
  if (isWeb) {
    const ws = await getWebStorage();
    return ws.decrementCardInArmy(armyId, cardId);
  }
  const ns = await getNativeArmyStorage();
  return ns.decrementCardInArmy(armyId, cardId);
}

export async function updateCardQuantity(armyId: string, cardId: string, quantity: number): Promise<Army> {
  if (isWeb) {
    const ws = await getWebStorage();
    return ws.updateCardQuantity(armyId, cardId, quantity);
  }
  const ns = await getNativeArmyStorage();
  return ns.updateCardQuantity(armyId, cardId, quantity);
}

export async function getCollection(): Promise<Collection> {
  if (isWeb) {
    const ws = await getWebStorage();
    return ws.getCollection();
  }
  const ns = await getNativeCollectionStorage();
  return ns.getCollection();
}

export async function saveCollection(collection: Collection): Promise<void> {
  if (isWeb) {
    const ws = await getWebStorage();
    return ws.saveCollection(collection);
  }
  const ns = await getNativeCollectionStorage();
  return ns.saveCollection(collection);
}

export async function addCardToCollection(cardId: string, quantity: number = 1): Promise<Collection> {
  if (isWeb) {
    const ws = await getWebStorage();
    return ws.addCardToCollection(cardId, quantity);
  }
  const ns = await getNativeCollectionStorage();
  return ns.addCardToCollection(cardId, quantity);
}

export async function removeCardFromCollection(cardId: string): Promise<Collection> {
  if (isWeb) {
    const ws = await getWebStorage();
    return ws.removeCardFromCollection(cardId);
  }
  const ns = await getNativeCollectionStorage();
  return ns.removeCardFromCollection(cardId);
}

export async function updateCardQuantityInCollection(cardId: string, quantity: number): Promise<Collection> {
  if (isWeb) {
    const ws = await getWebStorage();
    return ws.updateCardQuantityInCollection(cardId, quantity);
  }
  const ns = await getNativeCollectionStorage();
  return ns.updateCardQuantityInCollection(cardId, quantity);
}

export async function getCollectionCardQuantity(cardId: string): Promise<number> {
  if (isWeb) {
    const ws = await getWebStorage();
    return ws.getCollectionCardQuantity(cardId);
  }
  const ns = await getNativeCollectionStorage();
  return ns.getCollectionCardQuantity(cardId);
}

export { isWeb };