import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatowanie daty
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    // Jeśli ma godziny, pokaż je
    if (hours !== 0 || parseInt(minutes) !== 0) {
      return `${day}-${month}-${year} ${hours}:${minutes}`;
    }
    
    return `${day}-${month}-${year}`;
  } catch {
    return "-";
  }
}

// Kolory statusów
export const getStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case "zaplanowany":
      return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
    case "w trakcie":
      return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800";
    case "zakończony":
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
    case "zawieszony":
      return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700";
  }
}

// Funkcja pomocnicza do sprawdzania wartości "Yes"
export const isYes = (value: any): boolean => {
  if (value === true || value === "true") return true;
  if (typeof value === "string" && (value.toLowerCase() === "yes" || value === "Yes")) return true;
  if (value === 1 || value === "1") return true;
  return false;
};
