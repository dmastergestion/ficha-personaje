import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ACCION_CRITICA = "bg-gold text-black hover:bg-yellow-300 font-semibold";
