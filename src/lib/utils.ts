import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ACCION_CRITICA =
  "bg-accent text-ink hover:bg-accent-hover font-semibold";
