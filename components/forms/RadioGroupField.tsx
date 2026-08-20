import React from 'react'
import { Label } from "@/components/ui/label";
import { Controller } from "react-hook-form";

const RadioField = ({ name, label, options, control, error, required = false, variant }: RadioFieldProps) => {
    return (
        <div className="space-y-3">
            <Label htmlFor={name} className="text-xl font-extrabold text-gray-100">{label}</Label>
            <Controller
                name={name}
                control={control}
                rules={{ required: required ? `Please select ${label.toLowerCase()}` : false }}
                render={({ field }) => (
                    <div className={variant === 'segmented' ? 'seg' : 'flex flex-col gap-2'}>
                        {options.map((option) => (
                            <label key={option.value} className={variant === 'segmented' ? 'seg-opt' : 'radio'}>
                                <input
                                    type="radio"
                                    name={name}
                                    value={option.value}
                                    checked={field.value === option.value}
                                    onChange={() => field.onChange(option.value)}
                                    className="sr-only"
                                />
                                {variant === 'stacked' && <span className="radio-dot" />}
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
export default RadioField
