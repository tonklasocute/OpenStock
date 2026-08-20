"use client";

import React from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink } from "lucide-react";

interface NewsGridProps {
    news: any[];
}

export default function NewsGrid({ news }: NewsGridProps) {
    if (!news || news.length === 0) return null;

    return (
        <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-100 mb-4">Market News</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {news.map((item, idx) => (
                    <a
                        key={idx}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-gray-800 border border-gray-600 rounded-none overflow-hidden hover:border-teal-500 transition-colors group"
                    >
                        <div className="p-4 flex flex-col h-full">
                            <div className="flex items-start justify-between mb-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-none ${item.related ? "bg-teal-500 text-gray-900" : "bg-gray-900 text-gray-400"
                                    }`}>
                                    {item.related || "MARKET"}
                                </span>
                                <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-gray-400" />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-200 mb-2 line-clamp-2 group-hover:text-teal-500 transition-colors">
                                {item.headline}
                            </h3>
                            <p className="text-xs text-gray-500 line-clamp-3 mb-4 flex-1">
                                {item.summary}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-gray-500 mt-auto">
                                <span>{item.source}</span>
                                <span>
                                    {item.datetime ? formatDistanceToNow(item.datetime * 1000, { addSuffix: true }) : ''}
                                </span>
                            </div>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}
