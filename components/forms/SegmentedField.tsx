import React from 'react'
import { Label } from "@/components/ui/label";
import { Controller } from "react-hook-form";

const SegmentedField = ({ name, label, options, control, error, required = false }: SegmentedFieldProps) => {
    return (
        <div className="space-y-2">
            <Label htmlFor={name} className="form-label">{label}</Label>
            <Controller
                name={name}
                control={control}
                rules={{ required: required ? `Please select ${label.toLowerCase()}` : false }}
                render={({ field }) => (
                    <div className="seg">
                        {options.map((option) => (
                            <label key={option.value} className="seg-opt">
                                <input
                                    type="radio"
                                    name={name}
                                    value={option.value}
                                    checked={field.value === option.value}
                                    onChange={() => field.onChange(option.value)}
                                    className="sr-only"
                                />
                                {option.label}
                            </label>
                        ))}
                    </div>
                )}
            />
            {error && <p className="text-red-600 text-sm">{error.message}</p>}
        </div>
    )
}
export default SegmentedField
