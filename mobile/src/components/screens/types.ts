export interface ScreenProps {
  themeMode: 'light' | 'dark';
  setThemeMode?: (mode: 'light' | 'dark') => void;
  onNavigate: (screenName: string, params?: any) => void;
  demoIncidents?: any[];
  addDemoIncident?: (incident: any) => void;
}
