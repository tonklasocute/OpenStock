"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { createAlert, deleteAlert } from "@/lib/actions/alert.actions";
import { getAlertStatus } from "@/lib/getAlertStatus";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner"; // Assuming sonner is available or use existing toast
import ConnectLineCard from "./ConnectLineCard";

interface CreateAlertModalProps {
    userId: string;
    symbol: string;
    currentPrice: number;
    companyName?: string; // Optional prop for better display
    existingAlerts?: any[];
    lineConnected?: boolean;
    onAlertCreated?: () => void;
    children?: React.ReactNode;
    // Controlled props
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export default function CreateAlertModal({
    userId,
    symbol,
    currentPrice,
    companyName = "",
    existingAlerts = [],
    lineConnected = true,
    onAlertCreated,
    children,
    open: controlledOpen,
    onOpenChange: setControlledOpen
}: CreateAlertModalProps) {
    const router = useRouter();
    const [internalOpen, setInternalOpen] = useState(false);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? setControlledOpen : setInternalOpen;

    const [targetPrice, setTargetPrice] = useState<string>(currentPrice.toString());
    const [condition, setCondition] = useState<"ABOVE" | "BELOW">("ABOVE");
    const [alertName, setAlertName] = useState("");
    const [loading, setLoading] = useState(false);

    // Update target price when currentPrice changes (e.g. freshly fetched)
    React.useEffect(() => {
        setTargetPrice(currentPrice.toString());
    }, [currentPrice]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createAlert({
                userId,
                symbol,
                targetPrice: parseFloat(targetPrice),
                condition,
            });
            toast.success("Alert created successfully");
            setOpen?.(false);
            if (onAlertCreated) onAlertCreated();
        } catch (error) {
            console.error(error);
            toast.error("Failed to create alert");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAlert = async (alertId: string) => {
        try {
            await deleteAlert(alertId);
            toast.success("Alert deleted");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete alert");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {children && (
                <DialogTrigger asChild>
                    {children}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px] bg-gray-800 border-2 border-gray-600 text-gray-100">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-extrabold tracking-tight text-gray-100 mb-2">Price Alert</DialogTitle>
                </DialogHeader>

                {existingAlerts.length > 0 && (
                    <div className="space-y-2 pb-2">
                        {existingAlerts.map((alert) => {
                            const status = getAlertStatus(alert);
                            const statusTagClass =
                                status === 'active' ? 'tag-accent' : status === 'triggered' ? 'tag-outline' : 'tag-neutral';
                            return (
                                <div
                                    key={alert._id}
                                    className="flex items-center justify-between bg-gray-900 border border-gray-600 px-3 py-2 text-sm"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={`tag ${statusTagClass}`}>{status}</span>
                                        <span className="text-gray-300">
                                            {alert.condition.toLowerCase()} {formatCurrency(alert.targetPrice)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteAlert(alert._id)}
                                        className="text-gray-500 hover:text-teal-500 transition-colors p-1"
                                        title="Delete alert"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {!lineConnected && <ConnectLineCard userId={userId} initiallyConnected={false} />}

                <form onSubmit={handleSubmit} className="space-y-5 py-2 relative z-10">

                    {/* Alert Name */}
                    <div className="grid gap-2">
                        <Label className="text-gray-400 text-sm font-medium">Alert Name</Label>
                        <Input
                            value={alertName}
                            onChange={(e) => setAlertName(e.target.value)}
                            placeholder="e.g. Apple at Discount"
                            className="bg-gray-900 border-gray-600 text-gray-100 placeholder:text-gray-500 focus:border-teal-500 focus:ring-0 rounded-none h-10"
                        />
                    </div>

                    {/* Stock Identifier */}
                    <div className="grid gap-2">
                        <Label className="text-gray-400 text-sm font-medium">Stock identifier</Label>
                        <div className="relative">
                            <Input
                                disabled
                                value={`${companyName || symbol} (${symbol})`}
                                className="bg-gray-900 border border-gray-600 text-gray-500 rounded-none h-10"
                            />
                        </div>
                    </div>

                    {/* Condition */}
                    <div className="grid gap-2">
                        <Label className="text-gray-400 text-sm font-medium">Condition</Label>
                        <div className="seg">
                            <label className="seg-opt">
                                <input
                                    type="radio"
                                    name="alert-condition"
                                    value="ABOVE"
                                    checked={condition === "ABOVE"}
                                    onChange={() => setCondition("ABOVE")}
                                    className="sr-only"
                                />
                                Above
                            </label>
                            <label className="seg-opt">
                                <input
                                    type="radio"
                                    name="alert-condition"
                                    value="BELOW"
                                    checked={condition === "BELOW"}
                                    onChange={() => setCondition("BELOW")}
                                    className="sr-only"
                                />
                                Below
                            </label>
                        </div>
                    </div>

                    {/* Threshold Value */}
                    <div className="grid gap-2">
                        <Label className="text-gray-400 text-sm font-medium">Threshold value</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-500 font-semibold">$</span>
                            <Input
                                type="number"
                                step="0.01"
                                value={targetPrice}
                                onChange={(e) => setTargetPrice(e.target.value)}
                                placeholder="eg: 140"
                                className="pl-7 bg-gray-900 border-gray-600 text-gray-100 placeholder:text-gray-500 focus:border-teal-500 focus:ring-0 transition-all rounded-none h-10 font-mono"
                            />
                        </div>
                    </div>

                    {/* Expiry Note */}
                    <div className="pt-1">
                        <p className="text-xs text-gray-500 flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500/50 mr-2"></span>
                            Alert expires automatically in 90 days
                        </p>
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-teal-500 hover:bg-teal-600 text-gray-900 font-extrabold h-11 text-base rounded-none"
                        >
                            {loading ? "Creating Alert..." : "Create Alert"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
