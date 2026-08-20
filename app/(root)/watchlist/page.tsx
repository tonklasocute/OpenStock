import React, { Suspense } from 'react';
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUserWatchlist } from '@/lib/actions/watchlist.actions';
import { getUserAlerts } from '@/lib/actions/alert.actions';
import { getNews, getWatchlistData } from '@/lib/actions/finnhub.actions';
import { getLineLinkStatus } from '@/lib/actions/line.actions';
import WatchlistManager from '@/components/watchlist/WatchlistManager';
import NewsGrid from '@/components/watchlist/NewsGrid';
import SearchCommand from '@/components/SearchCommand';
import { Loader2 } from 'lucide-react';

export default async function WatchlistPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect('/sign-in');
    }

    const userId = session.user.id;

    // Parallel data fetching
    const [watchlistItems, alerts, news, lineStatus] = await Promise.all([
        getUserWatchlist(userId),
        getUserAlerts(userId),
        getNews(), // Initial news fetch
        getLineLinkStatus()
    ]);

    const watchlistSymbols = watchlistItems.map((item: any) => item.symbol);

    // Fallback news if watchlist has items
    const [relevantNews, priceData] = await Promise.all([
        watchlistSymbols.length > 0 ? getNews(watchlistSymbols) : Promise.resolve(news),
        getWatchlistData(watchlistSymbols)
    ]);

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-6 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 pb-6 border-b-2 border-gray-600">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-100">
                        Watchlist
                    </h1>
                    <p className="text-gray-500 mt-1">Track your favorite stocks and manage alerts.</p>
                </div>
                <div className="flex items-center space-x-4">
                    <SearchCommand renderAs="button" label="Add Stock" initialStocks={[]} />
                </div>
            </div>

            <div className="space-y-8">
                <WatchlistManager
                    initialItems={watchlistItems}
                    userId={userId}
                    alerts={alerts}
                    lineConnected={lineStatus.connected}
                    priceData={priceData}
                />

                {/* News Section */}
                <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="animate-spin text-gray-500" /></div>}>
                    <NewsGrid news={relevantNews || []} />
                </Suspense>
            </div>
        </div>
    );
}
