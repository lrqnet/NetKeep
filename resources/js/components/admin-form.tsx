import { useId } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function PageSection({
    icon: Icon,
    title,
    description,
    children,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-4">
            <div className="flex items-start gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600">
                    <Icon className="size-4" />
                </span>
                <div>
                    <h2 className="font-semibold">{title}</h2>
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                </div>
            </div>
            {children}
        </section>
    );
}

export function FormField({
    label,
    error,
    ...props
}: React.ComponentProps<typeof Input> & {
    label: string;
    error?: string;
}) {
    const generatedId = useId();
    const id = props.id ?? generatedId;

    return (
        <div className="space-y-1.5">
            <Label htmlFor={id}>{label}</Label>
            <Input {...props} id={id} aria-invalid={error ? true : undefined} />
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

export function NativeSelect({
    label,
    name,
    options,
    error,
    id: providedId,
    ...props
}: Omit<React.ComponentProps<'select'>, 'children' | 'name'> & {
    label: string;
    name: string;
    options: Array<[string, string]>;
    error?: string;
}) {
    const generatedId = useId();
    const id = providedId ?? generatedId;

    return (
        <div className="space-y-1.5">
            <Label htmlFor={id}>{label}</Label>
            <select
                {...props}
                id={id}
                name={name}
                aria-invalid={error ? true : undefined}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            >
                {options.map(([value, text]) => (
                    <option key={value} value={value}>
                        {text}
                    </option>
                ))}
            </select>
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
