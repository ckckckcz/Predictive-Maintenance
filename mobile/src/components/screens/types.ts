import type { UserPublic } from '@/api/types';

export interface ScreenProps {
  themeMode: 'light' | 'dark';
  setThemeMode?: (mode: 'light' | 'dark') => void;
  onNavigate: (screenName: string, params?: any) => void;
  user?: UserPublic | null;
}
