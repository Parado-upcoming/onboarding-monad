/** Simulated fee APR per asset -- higher volatility pairs see more trading volume, more fees. */
export const LAB_FEE_APR: Record<string, number> = {
  MON: 0.35,
  ETH: 0.18,
  BTC: 0.09,
};

export interface LpSimulationResult {
  entryPrice: number;
  exitPrice: number;
  priceChangePct: number;
  impermanentLossPct: number;
  feesEarnedUsd: number;
  holdValueUsd: number;
  lpValueUsd: number;
  netResultUsd: number;
  netResultPct: number;
}

/**
 * Constant-product (x*y=k) impermanent loss for a 50/50 pool against a stable numeraire:
 * IL = 2*sqrt(r)/(1+r) - 1, where r is the price ratio at exit vs entry.
 */
export function simulateLiquidityPool(
  depositValueUsd: number,
  entryPrice: number,
  exitPrice: number,
  asset: string,
  horizonDays: number,
): LpSimulationResult {
  const r = exitPrice / entryPrice;
  const impermanentLossPct = r > 0 ? (2 * Math.sqrt(r)) / (1 + r) - 1 : 0;

  const halfUsd = depositValueUsd / 2;
  const assetQty = halfUsd / entryPrice;
  const holdValueUsd = halfUsd + assetQty * exitPrice;

  const lpValueUsd = holdValueUsd * (1 + impermanentLossPct);

  const feeApr = LAB_FEE_APR[asset] ?? 0.15;
  const feesEarnedUsd = depositValueUsd * feeApr * (horizonDays / 365);

  const netResultUsd = lpValueUsd + feesEarnedUsd - depositValueUsd;

  return {
    entryPrice,
    exitPrice,
    priceChangePct: r - 1,
    impermanentLossPct,
    feesEarnedUsd,
    holdValueUsd,
    lpValueUsd,
    netResultUsd,
    netResultPct: netResultUsd / depositValueUsd,
  };
}
