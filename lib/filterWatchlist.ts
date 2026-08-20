export type WatchlistFilter = 'all' | 'gainers' | 'losers';

export function filterWatchlist<T extends { symbol: string; changePercent?: number }>(
    items: T[],
    filter: WatchlistFilter
): T[] {
    if (filter === 'all') return items;
    if (filter === 'gainers') return items.filter((item) => (item.changePercent ?? 0) > 0);
    return items.filter((item) => (item.changePercent ?? 0) < 0);
}
