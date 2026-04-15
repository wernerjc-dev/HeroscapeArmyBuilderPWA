export interface ArmyCardEntry {
  cardId: string;
  quantity: number;
}

export interface Army {
  id: string;
  name: string;
  pointTotal: number;
  contemporaryOnly: boolean;
  cards: ArmyCardEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface ArmyWithStats extends Army {
  totalPoints: number;
  cardCount: number;
}

export interface CollectionEntry {
  cardId: string;
  quantity: number;
}

export interface Collection {
  cards: CollectionEntry[];
  updatedAt: string;
}
