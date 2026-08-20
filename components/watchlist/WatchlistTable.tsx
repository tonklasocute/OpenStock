"use client";

import React, { useEffect, useState } from "react";
import { formatCurrency, getChangeColorClass } from "@/lib/utils";

interface WatchlistTableProps {
    data: any[];
}

export default function WatchlistTable({ data }: WatchlistTableProps) {
    const [stocks, setStocks] = useState(data);

    useEffect(() => {
        setStocks(data);
    }, [data]);

    useEffect(() => {
        if (!stocks || stocks.length === 0) return;

        // Poll for price updates every 15 seconds
        const interval = setInterval(async () => {
            try {
                const symbols = stocks.map(s => s.symbol);
                if (symbols.length === 0) return;

                const { getWatchlistData } = await import('@/lib/actions/finnhub.actions');
                const updatedData = await getWatchlistData(symbols);

                if (updatedData && updatedData.length > 0) {
                    setStocks(current => {
                        const map = new Map(updatedData.map(item => [item.symbol, item]));
                        return current.map(existing => {
                            const fresh = map.get(existing.symbol);
                            if (fresh) {
                                return {
                                    ...existing,
                                    price: fresh.price,
                                    change: fresh.change,
                                    changePercent: fresh.changePercent,
                                    open: fresh.open,
                                    high: fresh.high,
                                    low: fresh.low,
                                    previousClose: fresh.previousClose,
                                };
                            }
                            return existing;
                        });
                    });
                }
            } catch (err) {
                console.error("Failed to poll watchlist prices", err);
            }
        }, 15000);

        return () => clearInterval(interval);
    }, [stocks]);

    if (!stocks || stocks.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-800 rounded-none border border-gray-600">
                <h3 className="text-xl font-medium text-gray-300 mb-2">Your watchlist is empty</h3>
                <p className="text-gray-500 mb-6">Add stocks to track their performance and set alerts.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-none border border-gray-600 bg-gray-800">
            <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-transparent text-gray-500 font-normal border-b-2 border-gray-600">
                    <tr>
                        <th className="px-4 py-3 font-semibold tracking-wide">Name</th>
                        <th className="px-4 py-3 font-semibold tracking-wide text-right">Value</th>
                        <th className="px-4 py-3 font-semibold tracking-wide text-right">Change</th>
                        <th className="px-4 py-3 font-semibold tracking-wide text-right">Chg%</th>
                        <th className="px-4 py-3 font-semibold tracking-wide text-right">Open</th>
                        <th className="px-4 py-3 font-semibold tracking-wide text-right">High</th>
                        <th className="px-4 py-3 font-semibold tracking-wide text-right">Low</th>
                        <th className="px-4 py-3 font-semibold tracking-wide text-right">Prev</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {stocks.map((stock: any) => {
                        const changeColor = getChangeColorClass(stock.changePercent);
                        return (
                            <tr key={stock.symbol} className="hover:bg-gray-900/60 transition-colors">
                                <td className="px-4 py-3 font-semibold text-gray-100">{stock.symbol}</td>
                                <td className="px-4 py-3 text-right text-gray-100 font-medium">{formatCurrency(stock.price)}</td>
                                <td className={`px-4 py-3 text-right font-medium ${changeColor}`}>
                                    {stock.change >= 0 ? '+' : ''}{stock.change?.toFixed(2)}
                                </td>
                                <td className={`px-4 py-3 text-right font-medium ${changeColor}`}>
                                    {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent?.toFixed(2)}%
                                </td>
                                <td className="px-4 py-3 text-right text-gray-400">{formatCurrency(stock.open)}</td>
                                <td className="px-4 py-3 text-right text-gray-400">{formatCurrency(stock.high)}</td>
                                <td className="px-4 py-3 text-right text-gray-400">{formatCurrency(stock.low)}</td>
                                <td className="px-4 py-3 text-right text-gray-400">{formatCurrency(stock.previousClose)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
