import { MangaPill, AsuraScans } from '@consumet/extensions';
import { MangaHere } from './providers/mangahere'; // Import our custom fixed file

// Initialize providers
const mangapill = new MangaPill();
const asurascans = new AsuraScans();
const mangahere = new MangaHere();

export const PROVIDERS = {
  mangapill: mangapill,
  mangahere: mangahere,
  asurascans: asurascans
};

export type ProviderName = keyof typeof PROVIDERS;

export function getProvider(name: string) {
  return PROVIDERS[name as ProviderName] || PROVIDERS.mangapill;
}
