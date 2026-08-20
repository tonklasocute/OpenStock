"use client";

import React from "react";
import { Trash2, Bell } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { deleteAlert } from "@/lib/actions/alert.actions";
import { getAlertStatus } from "@/lib/getAlertStatus";
import ConnectLineCard from "./ConnectLineCard";

interface AlertsPanelProps {
    alerts: any[];
    userId: string;
    lineConnected: boolean;
    onRefresh?: () => void;
}

export default function AlertsPanel({ alerts, userId, lineConnected, onRefresh }: AlertsPanelProps) {
    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this alert?")) {
            await deleteAlert(id);
            if (onRefresh) onRefresh();
        }
    };

    return (
        <div className="bg-gray-800 rounded-none border border-gray-600 p-4 h-full">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-100 flex items-center">
                    <Bell className="w-5 h-5 mr-2 text-teal-500" />
                    Alerts
                </h2>
            </div>

            <ConnectLineCard userId={userId} initiallyConnected={lineConnected} />

            <div className="space-y-3">
                {alerts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        No active alerts. Add one from the watchlist.
                    </div>
                ) : (
                    alerts.map((alert) => {
                        const status = getAlertStatus(alert);
                        const statusTagClass =
                            status === 'active' ? 'tag-accent' : status === 'triggered' ? 'tag-outline' : 'tag-neutral';
                        return (
                            <div key={alert._id} className="bg-gray-900 rounded-none p-3 border border-gray-600 relative group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-8 h-8 bg-teal-500 flex items-center justify-center font-bold text-xs text-gray-900 border border-gray-600">
                                                {alert.symbol[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-100 text-sm">{alert.symbol}</div>
                                                <div className="text-xs text-gray-400">Target: {formatCurrency(alert.targetPrice)}</div>
                                            </div>
                                        </div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className={`tag ${statusTagClass}`}>{status}</span>
                                            <span className="text-xs text-gray-500">
                                                {alert.condition.toLowerCase()} {formatCurrency(alert.targetPrice)}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-gray-500 mt-1">
                                            Active until {new Date(new Date(alert.createdAt).getTime() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="flex flex-col space-y-2">
                                        <button
                                            onClick={() => handleDelete(alert._id)}
                                            className="text-gray-500 hover:text-teal-500 transition-colors p-1"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
