'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export default function RefreshFeedButton() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    return (
        <button
            onClick={() => {
                startTransition(() => {
                    router.refresh();
                });
            }}
            className="stitch-button secondary"
            style={{ width: 'auto', padding: '0.75rem 2rem' }}
            disabled={isPending}
        >
            {isPending ? 'Refreshing...' : 'Refresh Feed'}
        </button>
    );
}