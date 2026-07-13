/**
 * Pooled series-color allocator bound to a {@link GroupedItemChooserModel}.
 *
 * Colors are drawn from a developer-supplied palette and keyed to stable series identity, so
 * reordering never recolors an existing series. Released colors return to the pool and are
 * reused, keeping long-lived comparisons from drifting off the end of the palette. If demand
 * exceeds the palette, colors are recycled round-robin.
 */
export class ColorAllocator {
    readonly palette: string[];

    private assigned = new Map<string, string>();
    private pool: string[];
    private overflowCursor = 0;

    constructor(palette: string[]) {
        this.palette = palette;
        this.pool = [...palette];
    }

    /** Return the color for `key`, assigning the next pooled color on first request. */
    allocate(key: string): string {
        const {assigned} = this;
        if (assigned.has(key)) return assigned.get(key);

        const color =
            this.pool.shift() ?? this.palette[this.overflowCursor++ % this.palette.length];
        assigned.set(key, color);
        return color;
    }

    /** Return the color for `key` to the pool. No-op if `key` has no assignment. */
    release(key: string) {
        const color = this.assigned.get(key);
        if (!color) return;
        this.assigned.delete(key);
        if (!this.pool.includes(color)) this.pool.push(color);
    }

    /**
     * Sync assignments against the complete set of live identity keys, in display order.
     * Releases dropped keys first so their colors are immediately reusable by new keys.
     */
    reconcile(liveKeys: string[]) {
        const live = new Set(liveKeys);
        for (const key of [...this.assigned.keys()]) {
            if (!live.has(key)) this.release(key);
        }
        liveKeys.forEach(key => this.allocate(key));
    }
}
