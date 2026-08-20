import React from 'react'
import { Label } from "@/components/ui/label";
import { Controller } from "react-hook-form";

const RadioGroupField = ({ name, label, options, control, error, required = false }: RadioGroupFieldProps) => {
    return (
        <div className="space-y-2">
            <Label htmlFor={name} className="form-label">{label}</Label>
            <Controller
                name={name}
                control={control}
                rules={{ required: required ? `Please select ${label.toLowerCase()}` : false }}
                render={({ field }) => (
                    <div className="flex flex-col gap-2">
                        {options.map((option) => (
                            <label key={option.value} className="radio">
                                <input
                                    type="radio"
                                    name={name}
                                    value={option.value}
                                    checked={field.value === option.value}
                                    onChange={() => field.onChange(option.value)}
                                    className="sr-only"
                                />
                                <span className="radio-dot" />
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
export default RadioGroupField
