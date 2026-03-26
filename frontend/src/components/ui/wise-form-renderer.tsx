import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';
import type { WiseFieldGroup } from '@/api/buyer';

/**
 * Generic renderer for Wise account-requirements JSON -> form fields.
 *
 * Handles every field type Wise can return:
 *   text   -> <Input>
 *   select -> <Select> dropdown
 *   radio  -> true/false toggle | multi-option dropdown
 *   date   -> <Input type="date">
 *
 * Single-option selects are auto-selected and hidden.
 * Empty-key options are filtered to prevent Radix errors.
 */

// Types
export interface WiseFieldDef {
    name: string;
    group: WiseFieldGroup[];
}

// Props
interface WiseFormRendererProps {
    fields: WiseFieldDef[];
    values: Record<string, string>;
    onChange: (key: string, value: string) => void;
    /** Keys to completely hide (e.g. 'type' when auto-selected via tabs) */
    hiddenKeys?: Set<string>;
    /** Called when a field with refreshRequirementsOnChange changes */
    onRefreshNeeded?: () => void;
}

// Component
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

// Individual field renderer
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

    // Radio with null valuesAllowed -> boolean toggle
    if (def.type === 'radio' && !def.valuesAllowed) {
        return <ToggleField label={fieldName} required={def.required} checked={value === 'true'} onToggle={(v) => handleChange(def.key, v ? 'true' : 'false')} />;
    }

    // Radio with true/false options -> toggle
    if (def.type === 'radio' && def.valuesAllowed && def.valuesAllowed.length === 2 && def.valuesAllowed.every(v => v.key === 'true' || v.key === 'false')) {
        const label = def.valuesAllowed.find(v => v.key === 'true')?.name || fieldName;
        return <ToggleField label={label} required={def.required} checked={value === 'true'} onToggle={(v) => handleChange(def.key, v ? 'true' : 'false')} />;
    }

    // Select / radio with options -> dropdown
    if ((def.type === 'select' || def.type === 'radio') && def.valuesAllowed) {
        const options = def.valuesAllowed.filter(v => v.key !== '');
        if (options.length === 0) return null;
        return <AutoSelectDropdown fieldName={fieldName} defKey={def.key} required={def.required} options={options} value={value} onChange={handleChange} />;
    }

    // Date
    if (def.type === 'date') {
        return (
            <FieldWrapper label={fieldName} required={def.required}>
                <Input
                    type="date"
                    value={value}
                    onChange={(e) => handleChange(def.key, e.target.value)}
                    className="h-10"
                />
            </FieldWrapper>
        );
    }

    // Text (default)
    const hasValidationError = !!(def.validationRegexp && value && !new RegExp(def.validationRegexp).test(value));

    return (
        <FieldWrapper label={fieldName} required={def.required}>
            <Input
                value={value}
                onChange={(e) => handleChange(def.key, e.target.value)}
                placeholder={def.example || `Enter ${fieldName.toLowerCase()}`}
                maxLength={def.maxLength || undefined}
                className={`h-10 ${hasValidationError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            />
            {hasValidationError && (
                <p className="flex items-center gap-1 text-xs text-destructive mt-1.5">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    Invalid format{def.example ? ` — e.g. ${def.example}` : ''}
                </p>
            )}
        </FieldWrapper>
    );
}

/** Consistent label + field wrapper */
function FieldWrapper({ label, required, children }: { label: string; required: boolean; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label className="text-sm font-medium">
                {label}
                {required && <span className="text-destructive ml-0.5">*</span>}
            </Label>
            {children}
        </div>
    );
}

/** Toggle field using the Radix Switch component */
function ToggleField({ label, required, checked, onToggle }: { label: string; required: boolean; checked: boolean; onToggle: (v: boolean) => void }) {
    return (
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3">
            <Label className="text-sm font-normal cursor-pointer pr-4">
                {label}
                {required && <span className="text-destructive ml-0.5">*</span>}
            </Label>
            <Switch checked={checked} onCheckedChange={onToggle} />
        </div>
    );
}

/** Auto-select dropdown — hides single-option fields */
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
        <FieldWrapper label={fieldName} required={required}>
            <Select value={value} onValueChange={(val) => onChange(defKey, val)}>
                <SelectTrigger className="h-10">
                    <SelectValue placeholder={`Select ${fieldName.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                    {options.map(v => (
                        <SelectItem key={v.key} value={v.key}>{v.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </FieldWrapper>
    );
}
