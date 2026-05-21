
import { LucideIcon } from "lucide-react";

// --- Chart Data Interfaces ---

export interface ProductionShiftData {
    name: string;
    OK: number;
    NotOK: number;
    [key: string]: any;
}

export interface ProductionGroupData {
    name: string;
    Produksi: number;
    [key: string]: any;
}

export interface InputMethodData {
    name: string;
    value: number;
    [key: string]: any;
}

export interface QualityData {
    name: string;
    value: number;
    [key: string]: any;
}

export interface TrendData {
    name: string;
    Suhu: number;
    Berat: number;
    [key: string]: any;
}

// --- Table Data Interfaces ---

export interface ProductionItem {
    id: number;
    date: string;
    group: string;
    shift: string;
    line: string;
    temperature: string;
    weight: string;
    temperature_val?: number;
    weight_val?: number;
    group_id?: number;
    shift_id?: number;
    production_line_id?: number;
    quality: "OK" | "NOT OK";
    inputMethod: "OCR" | "Manual";
}

// --- Component Props & UI Interfaces ---

export interface OverviewStat {
    title: string;
    value: string;
    change: string;
    positive: boolean;
    icon: LucideIcon;
    color: string;
    bgColor: string;
    borderColor: string;
}

export interface CustomTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string;
    hideLabel?: boolean;
}

export interface SidebarProps {
    className?: string;
}

// --- Master Data Interfaces ---

export interface Group {
    id: number;
    name: string;
    status: 'Aktif' | 'Tidak Aktif';
}

export interface Shift {
    id: number;
    name: string;
    start_time: string; // "08:00"
    end_time: string;   // "16:00"
    status: 'Aktif' | 'Tidak Aktif';
}

export interface ProductionLine {
    id: number;
    name: string;
    status: 'Aktif' | 'Tidak Aktif';
}
