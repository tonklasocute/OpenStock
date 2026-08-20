import React from 'react'
import { Label } from "@/components/ui/label";
import { Controller } from "react-hook-form";
import { cn } from "@/lib/utils";

const TagChipField = ({ name, label, options, control, error, required = false }: TagChipFieldProps) => {
    return (
        <div className="space-y-2">
            <Label htmlFor={name} className="form-label">{label}</Label>
            <Controller
                name={name}
                control={control}
                rules={{ required: required ? `Please select ${label.toLowerCase()}` : false }}
                render={({ field }) => (
                    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => field.onChange(option.value)}
                                role="radio"
                                aria-checked={field.value === option.value}
                                className={cn('tag', field.value === option.value ? 'tag-accent' : 'tag-neutral')}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                )}
            />
            {error && <p className="text-red-600 text-sm">{error.message}</p>}
        </div>
    )
}
export default TagChipField
