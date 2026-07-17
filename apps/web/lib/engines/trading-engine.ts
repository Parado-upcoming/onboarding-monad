export const ASSETS = [
  { symbol: "MON", name: "Monad", basePrice: 2.5, volatility: 0.02 },
  { symbol: "ETH", name: "Ethereum", basePrice: 3400, volatility: 0.015 },
  { symbol: "BTC", name: "Bitcoin", basePrice: 65000, volatility: 0.01 },
] as const;

export type AssetSymbol = (typeof ASSETS)[number]["symbol"];

const EPOCH = Date.UTC(2026, 6, 1); // fixed reference point so prices are reproducible
const BUCKET_MS = 15 * 60 * 1000; // 15-minute buckets

function hash32(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededUniform(seed: number): number {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Deterministic pseudo-random log-return for one bucket, via Box-Muller on hash-derived uniforms. */
function bucketLogReturn(symbol: string, bucketIndex: number, volatility: number): number {
  const seed = hash32(`${symbol}:${bucketIndex}`);
  const u1 = Math.max(seededUniform(seed), 1e-9);
  const u2 = seededUniform(seed ^ 0x9e3779b9);
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z * volatility;
}

function assetConfig(symbol: AssetSymbol) {
  const asset = ASSETS.find((a) => a.symbol === symbol);
  if (!asset) throw new Error(`Unknown asset: ${symbol}`);
  return asset;
}

function nowBucket(at: Date): number {
  return Math.floor((at.getTime() - EPOCH) / BUCKET_MS);
}

/** Current simulated price for an asset, as a pure deterministic function of time. */
export function priceAt(symbol: AssetSymbol, at: Date = new Date()): number {
  const asset = assetConfig(symbol);
  const targetBucket = Math.max(0, nowBucket(at));
  let logPrice = Math.log(asset.basePrice);
  for (let b = 0; b <= targetBucket; b++) {
    logPrice += bucketLogReturn(symbol, b, asset.volatility);
  }
  return Math.exp(logPrice);
}

export function currentPrices(at: Date = new Date()): Record<AssetSymbol, number> {
  return Object.fromEntries(
    ASSETS.map((a) => [a.symbol, priceAt(a.symbol, at)]),
  ) as Record<AssetSymbol, number>;
}

/** Trailing price series for charting, `count` buckets back from `at`. */
export function priceSeries(
  symbol: AssetSymbol,
  count: number,
  at: Date = new Date(),
): { time: number; price: number }[] {
  const asset = assetConfig(symbol);
  const targetBucket = Math.max(0, nowBucket(at));
  const startBucket = Math.max(0, targetBucket - count);
  let logPrice = Math.log(asset.basePrice);
  const series: { time: number; price: number }[] = [];
  for (let b = 0; b <= targetBucket; b++) {
    logPrice += bucketLogReturn(symbol, b, asset.volatility);
    if (b >= startBucket) {
      series.push({ time: EPOCH + b * BUCKET_MS, price: Math.exp(logPrice) });
    }
  }
  return series;
}

export const STARTING_CAPITAL = 10_000;

export interface TradeLike {
  asset: string;
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
  portfolioValueAfter: number;
  createdAt: Date;
}

export interface HoldingSummary {
  asset: string;
  quantity: number;
  value: number;
  avgCost: number;
}

export interface ArenaStats {
  portfolioValue: number;
  roi: number;
  totalTrades: number;
  winRate: number | null;
  avgHoldingHours: number | null;
  maxDrawdownPct: number;
  holdings: HoldingSummary[];
}

/** FIFO lot accounting: win rate, avg holding time, and realized P&L come from matching sells to the oldest buys. */
export function computeArenaStats(
  trades: TradeLike[],
  prices: Record<string, number>,
  cashBalance: number,
): ArenaStats {
  const lots: Record<string, { quantity: number; price: number; createdAt: Date }[]> = {};
  let realizedWins = 0;
  let realizedTotal = 0;
  let holdingHoursSum = 0;
  let holdingCount = 0;

  const sorted = [...trades].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  for (const trade of sorted) {
    lots[trade.asset] ??= [];
    if (trade.side === "BUY") {
      lots[trade.asset].push({
        quantity: trade.quantity,
        price: trade.price,
        createdAt: trade.createdAt,
      });
    } else {
      let remaining = trade.quantity;
      while (remaining > 1e-9 && lots[trade.asset].length) {
        const lot = lots[trade.asset][0];
        const matched = Math.min(lot.quantity, remaining);
        const pnl = (trade.price - lot.price) * matched;
        realizedTotal++;
        if (pnl > 0) realizedWins++;
        holdingHoursSum += (trade.createdAt.getTime() - lot.createdAt.getTime()) / 3_600_000;
        holdingCount++;
        lot.quantity -= matched;
        remaining -= matched;
        if (lot.quantity <= 1e-9) lots[trade.asset].shift();
      }
    }
  }

  const holdings: HoldingSummary[] = Object.entries(lots)
    .map(([asset, assetLots]) => {
      const quantity = assetLots.reduce((s, l) => s + l.quantity, 0);
      const costBasis = assetLots.reduce((s, l) => s + l.quantity * l.price, 0);
      const price = prices[asset] ?? 0;
      return {
        asset,
        quantity,
        value: quantity * price,
        avgCost: quantity > 0 ? costBasis / quantity : 0,
      };
    })
    .filter((h) => h.quantity > 1e-9);

  const portfolioValue = cashBalance + holdings.reduce((s, h) => s + h.value, 0);

  const series = [STARTING_CAPITAL, ...sorted.map((t) => t.portfolioValueAfter), portfolioValue];
  let peak = series[0];
  let maxDrawdownPct = 0;
  for (const v of series) {
    peak = Math.max(peak, v);
    const dd = peak > 0 ? (peak - v) / peak : 0;
    maxDrawdownPct = Math.max(maxDrawdownPct, dd);
  }

  return {
    portfolioValue,
    roi: (portfolioValue - STARTING_CAPITAL) / STARTING_CAPITAL,
    totalTrades: trades.length,
    winRate: realizedTotal > 0 ? realizedWins / realizedTotal : null,
    avgHoldingHours: holdingCount > 0 ? holdingHoursSum / holdingCount : null,
    maxDrawdownPct,
    holdings,
  };
}
