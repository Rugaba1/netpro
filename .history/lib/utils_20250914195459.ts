import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}


// lib/utils.ts
export function convertDecimalsToNumbers(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'object') {
    if (obj.constructor.name === 'Decimal') {
      return Number(obj.toString());
    }
    
    if (Array.isArray(obj)) {
      return obj.map(convertDecimalsToNumbers);
    }
    
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = convertDecimalsToNumbers(obj[key]);
      }
    }
    return result;
  }
  
  return obj;
}