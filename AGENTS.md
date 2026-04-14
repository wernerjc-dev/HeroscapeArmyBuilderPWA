# AGENTS.md

## Run Commands

- `npx expo start` - Start dev server (shows QR for mobile, options for emulator/web)
- `npx expo start --web` - Run web version
- `npm run lint` - ESLint with Expo config
- `npm test` - Jest with jest-expo preset

## Tech Stack

- **Framework**: Expo SDK 54 with expo-router (file-based routing in `app/`)
- **Database**: expo-sqlite for local persistence (`utils/armyStorage.ts`)
- **Types**: Strict TypeScript (`tsconfig.json`)
- **Platforms**: iOS, Android, Web (Expo Go support)

## App Structure

- `app/` - Expo Router screens (index, collection, armies, army-detail, create-army)
- `app/(tabs)/` - Tab-based navigation layout
- `utils/armyStorage.ts` - SQLite CRUD operations for armies
- `data/heroscape-cards.json` - Static card data
- `types/army.ts` - Army and ArmyCardEntry interfaces

## Important Notes

- Do not remove features unless explicitly told to
- Entry point: `expo-router/entry` (configured in `package.json`)
- Android package: `com.jwerner.HeroscapeArmyBuilder`
- Web output builds to `dist/` directory
- Uses `react-native-gesture-handler` and `react-native-reanimated` - ensure proper babel config