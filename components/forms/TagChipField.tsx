import React from 'react'
import { Label } from "@/components/ui/label";
import { Controller } from "react-hook-form";
import { cn } from "@/lib/utils";

const TagChipField = ({ name, label, options, control, error, required = false }: TagChipFieldProps) => {
    return (
        <div className="space-y-3">
            <Label htmlFor={name} className="text-xl font-extrabold text-gray-100">{label}</Label>
            <Controller
                name={name}
                control={control}
                rules={{ required: required ? `Please select at least one ${label.toLowerCase()}` : false }}
                render={({ field }) => {
                    const selected: string[] = field.value ?? [];
                    return (
                        <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
                            {options.map((option) => {
                                const isSelected = selected.includes(option.value);
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => field.onChange(
                                            isSelected
                                                ? selected.filter((value) => value !== option.value)
                                                : [...selected, option.value]
                                        )}
                                        aria-pressed={isSelected}
                                        className={cn('tag', isSelected ? 'tag-accent' : 'tag-neutral')}
                                    >
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                    );
                }}
            />
            {error && <p className="text-red-600 text-sm">{error.message}</p>}
        </div>
    )
}
export default TagChipField
