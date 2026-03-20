import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { WiseFieldGroup } from '@/api/buyer';

/**
 * Generic renderer for Wise account-requirements JSON → form fields.
 *
 * Handles every field type Wise can return:
 *   text   → <Input>
 *   select → <Select> dropdown
 *   radio  → true/false toggle | multi-option dropdown
 *   date   → <Input type="date">
 *
 * Single-option selects are auto-selected and hidden.
 * Empty-key options are filtered to prevent Radix errors.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface WiseFieldDef {
    name: string;
    group: WiseFieldGroup[];
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface WiseFormRendererProps {
    fields: WiseFieldDef[];
    values: Record<string, string>;
    onChange: (key: string, value: string) => void;
    /** Keys to completely hide (e.g. 'type' when auto-selected via tabs) */
    hiddenKeys?: Set<string>;
    /** Called when a field with refreshRequirementsOnChange changes — parent should re-fetch requirements */
    onRefreshNeeded?: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function WiseFormRenderer({ fields, values, onChange, hiddenKeys, onRefreshNeeded }: WiseFormRendererProps) {
    return (
        <div className="space-y-4">
            {fields.map((field, idx) => (
                <WiseFieldRow key={idx} field={field} values={values} onChange={onChange} hiddenKeys={hiddenKeys} onRefreshNeeded={onRefreshNeeded} />
            ))}
        </div>
    );
}

function WiseFieldRow({
    field,
    values,
    onChange,
    hiddenKeys,
    onRefreshNeeded,
}: {
    field: WiseFieldDef;
    values: Record<string, string>;
    onChange: (key: string, value: string) => void;
    hiddenKeys?: Set<string>;
    onRefreshNeeded?: () => void;
}) {
    return (
        <>
            {field.group.map((g) => (
                <WiseField key={g.key} fieldName={field.name} def={g} values={values} onChange={onChange} hiddenKeys={hiddenKeys} onRefreshNeeded={onRefreshNeeded} />
            ))}
        </>
    );
}

// ─── Individual field renderer ──────────────────────────────────────────────

function WiseField({
    fieldName,
    def,
    values,
    onChange,
    hiddenKeys,
    onRefreshNeeded,
}: {
    fieldName: string;
    def: WiseFieldGroup;
    values: Record<string, string>;
    onChange: (key: string, value: string) => void;
    hiddenKeys?: Set<string>;
    onRefreshNeeded?: () => void;
}) {
    const value = values[def.key] || '';

    // Wrap onChange to trigger refresh when needed
    const handleChange = (key: string, val: string) => {
        onChange(key, val);
        if (def.refreshRequirementsOnChange && onRefreshNeeded) {
            // Small delay so the value is committed before re-fetch
            setTimeout(onRefreshNeeded, 100);
        }
    };

    // Hidden keys (e.g. 'type')
    if (hiddenKeys?.has(def.key)) return null;

    // ── Radio with null valuesAllowed → boolean toggle (default false) ───
    if (def.type === 'radio' && !def.valuesAllowed) {
        return <ToggleField label={fieldName} required={def.required} checked={value === 'true'} onToggle={(v) => handleChange(def.key, v ? 'true' : 'false')} />;
    }

    // ── Radio with true/false options → toggle ──────────────────────────
    if (def.type === 'radio' && def.valuesAllowed && def.valuesAllowed.length === 2 && def.valuesAllowed.every(v => v.key === 'true' || v.key === 'false')) {
        const label = def.valuesAllowed.find(v => v.key === 'true')?.name || fieldName;
        return <ToggleField label={label} required={def.required} checked={value === 'true'} onToggle={(v) => handleChange(def.key, v ? 'true' : 'false')} />;
    }

    // ── Select / radio with options → dropdown ──────────────────────────
    if ((def.type === 'select' || def.type === 'radio') && def.valuesAllowed) {
        const options = def.valuesAllowed.filter(v => v.key !== '');
        if (options.length === 0) return null;
        return <AutoSelectDropdown fieldName={fieldName} defKey={def.key} required={def.required} options={options} value={value} onChange={handleChange} />;
    }

    // ── Date ────────────────────────────────────────────────────────────
    if (def.type === 'date') {
        return (
            <div className="space-y-2">
                <Label>{fieldName}{def.required && ' *'}</Label>
                <Input type="date" value={value} onChange={(e) => handleChange(def.key, e.target.value)} />
            </div>
        );
    }

    // ── Text (default) ──────────────────────────────────────────────────
    return (
        <div className="space-y-2">
            <Label>{fieldName}{def.required && ' *'}</Label>
            <Input
                value={value}
                onChange={(e) => handleChange(def.key, e.target.value)}
                placeholder={def.example || `Enter ${fieldName.toLowerCase()}`}
                maxLength={def.maxLength || undefined}
            />
            {def.validationRegexp && value && !new RegExp(def.validationRegexp).test(value) && (
                <p className="text-xs text-destructive">Invalid format</p>
            )}
        </div>
    );
}

// ─── Toggle sub-component ───────────────────────────────────────────────────

function ToggleField({ label, required, checked, onToggle }: { label: string; required: boolean; checked: boolean; onToggle: (v: boolean) => void }) {
    return (
        <div className="flex items-center justify-between rounded-lg border p-3">
            <Label className="text-sm font-normal cursor-pointer">
                {label}{required && ' *'}
            </Label>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onToggle(!checked)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${checked ? 'bg-primary' : 'bg-muted'}`}
            >
                <span className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
        </div>
    );
}

// ─── Auto-select dropdown (hides single-option fields) ─────────────────────

function AutoSelectDropdown({
    fieldName,
    defKey,
    required,
    options,
    value,
    onChange,
}: {
    fieldName: string;
    defKey: string;
    required: boolean;
    options: Array<{ key: string; name: string }>;
    value: string;
    onChange: (key: string, value: string) => void;
}) {
    // Auto-select if only one valid option
    useEffect(() => {
        if (options.length === 1 && value !== options[0].key) {
            onChange(defKey, options[0].key);
        }
    }, [options, value, defKey, onChange]);

    // Hide single-option fields since they're auto-selected
    if (options.length === 1) return null;

    return (
        <div className="space-y-2">
            <Label>{fieldName}{required && ' *'}</Label>
            <Select value={value} onValueChange={(val) => onChange(defKey, val)}>
                <SelectTrigger>
                    <SelectValue placeholder={`Select ${fieldName.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                    {options.map(v => (
                        <SelectItem key={v.key} value={v.key}>{v.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
