'use client';

import React, { useState, useMemo } from 'react';
import WatchlistStockChip from './WatchlistStockChip';
import TradingViewWatchlist from './TradingViewWatchlist';
import { Button } from '@/components/ui/button';
import { ArrowDownAZ, ArrowUpZA, ArrowUpDown } from 'lucide-react';
import { WatchlistItem } from '@/database/models/watchlist.model';
import { filterWatchlist, type WatchlistFilter } from '@/lib/filterWatchlist';

interface WatchlistManagerProps {
    initialItems: WatchlistItem[]; // Using the DB model type directly or a simplified version
    userId: string;
}

const FILTER_OPTIONS: { value: WatchlistFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'gainers', label: 'Gainers' },
    { value: 'losers', label: 'Losers' },
];

export default function WatchlistManager({ initialItems, userId }: WatchlistManagerProps) {
    // Sort state: 'asc' (A-Z), 'desc' (Z-A), or null (added order/default)
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
    const [filter, setFilter] = useState<WatchlistFilter>('all');

    const toggleSort = () => {
        if (sortOrder === null) setSortOrder('asc');
        else if (sortOrder === 'asc') setSortOrder('desc');
        else setSortOrder(null);
    };

    const sortedItems = useMemo(() => {
        if (!sortOrder) return initialItems;

        return [...initialItems].sort((a, b) => {
            if (sortOrder === 'asc') {
                return a.symbol.localeCompare(b.symbol);
            } else {
                return b.symbol.localeCompare(a.symbol);
            }
        });
    }, [initialItems, sortOrder]);

    const filteredItems = useMemo(
        () => filterWatchlist(sortedItems, filter),
        [sortedItems, filter]
    );

    const watchlistSymbols = filteredItems.map((item) => item.symbol);

    return (
        <div className="space-y-6">
            <div className="bg-gray-800 border border-gray-600 rounded-none p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center">
                        <span className="mr-2">Manage Symbols</span>
                        <span className="text-xs bg-gray-900 text-gray-500 px-2 py-0.5 rounded-none">
                            {watchlistSymbols.length}
                        </span>
                    </h3>
                    <div className="flex items-center gap-3">
                        <div className="seg">
                            {FILTER_OPTIONS.map((option) => (
                                <label key={option.value} className="seg-opt">
                                    <input
                                        type="radio"
                                        name="watchlist-filter"
                                        value={option.value}
                                        checked={filter === option.value}
                                        onChange={() => setFilter(option.value)}
                                        className="sr-only"
                                    />
                                    {option.label}
                                </label>
                            ))}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleSort}
                            className="h-8 px-2 rounded-none text-gray-400 hover:text-gray-100 hover:bg-gray-700"
                            title={
                                sortOrder === 'asc'
                                    ? 'Sorted A-Z'
                                    : sortOrder === 'desc'
                                        ? 'Sorted Z-A'
                                        : 'Default Order'
                            }
                        >
                            {sortOrder === 'asc' && <ArrowDownAZ className="w-4 h-4 mr-2" />}
                            {sortOrder === 'desc' && <ArrowUpZA className="w-4 h-4 mr-2" />}
                            {sortOrder === null && <ArrowUpDown className="w-4 h-4 mr-2" />}
                            <span className="text-xs">
                                {sortOrder === 'asc'
                                    ? 'A-Z'
                                    : sortOrder === 'desc'
                                        ? 'Z-A'
                                        : 'Sort'}
                            </span>
                        </Button>
                    </div>
                </div>

                {watchlistSymbols.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {filteredItems.map((item) => (
                            <WatchlistStockChip
                                key={item.symbol}
                                symbol={item.symbol}
                                userId={userId}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 italic">No stocks match this filter.</p>
                )}
            </div>

            <div className="min-h-[550px]">
                <TradingViewWatchlist symbols={watchlistSymbols} />
            </div>
        </div>
    );
}
