import {chip} from '@xh/hoist/cmp/chip';
import {div, hbox, span} from '@xh/hoist/cmp/layout';
import type {Intent} from '@xh/hoist/core';
import type {ReactElement} from 'react';

/**
 * A group's heading over a list of cards, which sticks to the top of its scrolling container until
 * its group ends. A div, not a box, whose inline position would undo the sticky one.
 */
export function band(title: string, count?: number): ReactElement {
    return div({
        className: 'tb-band',
        children: [
            span(title),
            count != null ? span({className: 'tb-band__count', children: count}) : null
        ]
    });
}

/** A small mono chip naming a type, role or annotation, with an optional tooltip. */
export function tag(text: string, intent?: Intent, title?: string): ReactElement {
    return span({
        key: `tag-${text}`,
        title,
        children: chip({
            className: 'xh-font-family-mono',
            minimal: true,
            size: 'compact',
            intent,
            children: text
        })
    });
}

export interface ChipSpec {
    text: string;
    title?: string;
    /** As for the kind of thing it names: `success` for a dataset or source, none for an element. */
    intent?: Intent;
    onClick?: () => void;
}

/** A wrapping row of chips. */
export function chips(specs: ChipSpec[]): ReactElement {
    return hbox({
        className: 'tb-chips',
        children: specs.map((it, idx) => factChip({...it, key: `${idx}-${it.text}`}))
    });
}

/** A chip for a fact, clickable when given an `onClick`, with its title as a tooltip. */
function factChip({key, text, title, intent, onClick}: ChipSpec & {key?: string}) {
    return span({
        key,
        className: 'tb-chips__chip',
        title,
        // Keeps a card behind the chip from taking the click.
        onClick: onClick ? e => e.stopPropagation() : undefined,
        children: chip({
            className: 'xh-font-family-mono',
            minimal: true,
            size: 'compact',
            intent,
            onClick: onClick ? () => onClick() : undefined,
            children: text
        })
    });
}
