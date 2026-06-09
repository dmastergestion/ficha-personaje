import type { CharacterCurrency } from "@/schemas/character";

/** 50 monedas = 1 lb (SRD). */
export function pesoMonedas(currency: CharacterCurrency): number {
  const total =
    currency.pp + currency.gp + currency.ep + currency.sp + currency.cp;
  return total / 50;
}

/** Valor total en piezas de oro (conversión estándar). */
export function totalEnPo(currency: CharacterCurrency): number {
  return (
    currency.pp * 10 +
    currency.gp +
    currency.ep / 2 +
    currency.sp / 10 +
    currency.cp / 100
  );
}
