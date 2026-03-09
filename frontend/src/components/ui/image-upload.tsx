import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
    file?: File | null;
    onChange: (file: File | null) => void;
    disabled?: boolean;
    maxSizeMB?: number;
    className?: string;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function ImageUpload({
    file,
    onChange,
    disabled = false,
    maxSizeMB = 5,
    className,
}: ImageUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Create and revoke blob URL for local preview
    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
        setPreviewUrl(null);
    }, [file]);

    const validateFile = (f: File): string | null => {
        if (!ACCEPTED_TYPES.includes(f.type)) {
            return 'Only JPEG, PNG, WebP, and GIF images are allowed.';
        }
        if (f.size > maxSizeMB * 1024 * 1024) {
            return `File size must be under ${maxSizeMB}MB.`;
        }
        return null;
    };

    const handleFile = (f: File) => {
        const validationError = validateFile(f);
        if (validationError) {
            setError(validationError);
            return;
        }
        setError(null);
        onChange(f);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) handleFile(f);
        if (inputRef.current) inputRef.current.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled) return;
        const f = e.dataTransfer.files?.[0];
        if (f) handleFile(f);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleRemove = () => {
        onChange(null);
        setError(null);
    };

    // Show local preview when file is selected
    if (previewUrl && file) {
        return (
            <div className={cn('relative', className)}>
                <div className="relative rounded-lg border border-border overflow-hidden bg-muted/30">
                    <img
                        src={previewUrl}
                        alt="Selected preview"
                        className="w-full h-32 object-contain p-2"
                    />
                    {!disabled && (
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute top-1.5 right-1.5 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm hover:bg-destructive/90 transition-colors"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">{file.name}</p>
            </div>
        );
    }

    return (
        <div className={cn('space-y-1.5', className)}>
            <div
                role="button"
                tabIndex={0}
                onClick={() => !disabled && inputRef.current?.click()}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (!disabled) inputRef.current?.click();
                    }
                }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                    'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer',
                    isDragging
                        ? 'border-primary bg-primary/5'
                        : 'border-muted-foreground/25 hover:border-muted-foreground/50',
                    disabled && 'cursor-not-allowed opacity-50',
                )}
            >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                        Drag & drop or click to upload
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                        JPEG, PNG, WebP, or GIF (max {maxSizeMB}MB)
                    </p>
                </div>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled}
            />

            {error && (
                <p className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    {error}
                </p>
            )}
        </div>
    );
}
