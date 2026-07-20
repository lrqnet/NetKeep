import type { ComponentType } from 'react';
import { Card, CardContent } from '@/components/ui/card';

export function SummaryCard({
    icon: Icon,
    label,
    value,
    tone,
}: {
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: number;
    tone: 'success' | 'neutral' | 'danger';
}) {
    const toneClass = {
        success: 'bg-emerald-500/10 text-emerald-600',
        neutral: 'bg-muted text-muted-foreground',
        danger: 'bg-red-500/10 text-red-600 dark:text-red-400',
    }[tone];

    return (
        <Card className="gap-0 py-0">
            <CardContent className="flex items-center gap-4 p-5">
                <span
                    className={`grid size-10 place-items-center rounded-xl ${toneClass}`}
                >
                    <Icon className="size-5" />
                </span>
                <div>
                    <p className="text-2xl font-semibold tabular-nums">
                        {value}
                    </p>
                    <p className="text-sm text-muted-foreground">{label}</p>
                </div>
            </CardContent>
        </Card>
    );
}
