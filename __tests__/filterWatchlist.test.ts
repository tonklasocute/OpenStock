import { describe, expect, it } from 'vitest';
import { filterWatchlist } from '@/lib/filterWatchlist';

const items = [
    { symbol: 'AAPL', changePercent: 1.5 },
    { symbol: 'TSLA', changePercent: -2.1 },
    { symbol: 'MSFT', changePercent: 0 },
];

describe('filterWatchlist', () => {
    it('returns all items unchanged for "all"', () => {
        expect(filterWatchlist(items, 'all')).toEqual(items);
    });

    it('returns only items with a positive change for "gainers"', () => {
        expect(filterWatchlist(items, 'gainers').map((i) => i.symbol)).toEqual(['AAPL']);
    });

    it('returns only items with a negative change for "losers"', () => {
        expect(filterWatchlist(items, 'losers').map((i) => i.symbol)).toEqual(['TSLA']);
    });

    it('treats a zero change as neither a gainer nor a loser', () => {
        expect(filterWatchlist(items, 'gainers')).not.toContainEqual(expect.objectContaining({ symbol: 'MSFT' }));
        expect(filterWatchlist(items, 'losers')).not.toContainEqual(expect.objectContaining({ symbol: 'MSFT' }));
    });

    it('treats a missing changePercent as neither a gainer nor a loser', () => {
        const withMissing = [...items, { symbol: 'NOPE' }];
        expect(filterWatchlist(withMissing, 'gainers').map((i) => i.symbol)).not.toContain('NOPE');
        expect(filterWatchlist(withMissing, 'losers').map((i) => i.symbol)).not.toContain('NOPE');
    });
});
