import {ReactElement} from 'react';

/**
 * Core data types for {@link GroupedItemChooserModel} - see that class and the package spec docs
 * (`docs/grouped-item-chooser/`) for full behavioral semantics.
 */

/**
 * A leaf item, opaque to the component. Supplied by a kind's typeahead source and tracked by a
 * stable `id` + its `kind`. `data` is the app's own payload, round-tripped untouched into `value`
 * and into the icon/color callbacks.
 */
export interface ItemRef {
    /** Stable identity - color allocation, reordering, and uniqueness all key on this. */
    id: string;

    /** Key of the {@link ItemKind} this item belongs to. */
    kind: string;

    /** Display label (from the typeahead source). */
    label: string;

    /** Optional secondary display label, shown on the meta line. */
    sublabel?: string;

    /** Opaque app payload (e.g. the domain record). */
    data?: unknown;
}

/**
 * A leaf item *kind* - injected via config. Carries presentation base + its typeahead source.
 * Kinds have no behavioral flags - grouping/transforms are component-wide.
 */
export interface ItemKind {
    key: string;

    /** Section header label in the add-menu (e.g. "Companies"). */
    label: string;

    /** Type-level base icon: shown in add-menu section headers and as the node fallback. */
    icon?: ReactElement;

    /** Typeahead source for this kind. Return options matching the query (sync or async). */
    querySource: (query: string) => ItemOption[] | Promise<ItemOption[]>;
}

/** An option returned by a kind's typeahead source. */
export interface ItemOption {
    id: string;
    label: string;
    sublabel?: string;
    data?: unknown;
}

/**
 * Developer-supplied transform, selectable per-group. The component records the selected key
 * only - it performs NO computation. An empty/absent `transforms` library disables the transform
 * feature entirely. "Individual" (= show members) is represented as `transformKey: null`, not as
 * a transform in this library.
 */
export interface Transform {
    /** Key recorded in `value`. */
    key: string;

    /** Menu label. */
    label: string;

    /** Compact tag shown on a group's meta line (e.g. "AVG"). Defaults to `label`, uppercased. */
    shortLabel?: string;

    /**
     * Hint consumed only by the default `getColor` - for an aggregate group the group itself is
     * the series, so member colors are muted. Drives no computation and does not hide members.
     */
    isAggregate?: boolean;
}

/** A host-supplied group, offered in the add-menu and rendered locked when added. */
export interface ProvidedGroupDef {
    /** Stable id - also used as the entry id when added to the comparison. */
    id: string;
    label: string;
    members: ItemRef[];

    /** Initial transform for the group. Default null (Individual). */
    transformKey?: string | null;
}

/** Compact form accepted by `initialValue` - either a leaf item or a group. */
export type EntryInput =
    | {type: 'item'; item: ItemRef}
    | {
          type: 'group';
          id?: string;
          label: string;
          source?: 'provided' | 'user';
          transformKey?: string | null;
          members: ItemRef[];
          expanded?: boolean;
      };

//------------------------------------------------------------------------------------------------
// Internal (observable) entry state - the model's working representation of the comparison.
// Includes per-group view state (`expanded`) that is deliberately NOT part of the emitted value.
//------------------------------------------------------------------------------------------------
export type ChooserEntry = ChooserItemEntry | ChooserGroupEntry;

export interface ChooserItemEntry {
    type: 'item';
    item: ItemRef;
}

export interface ChooserGroupEntry {
    type: 'group';
    id: string;
    /** Raw label - may be empty for an unnamed user group. Display via model.getGroupDisplayName. */
    label: string;
    /** Sequence number used for "Untitled group N" placeholder naming of user groups. */
    seq?: number;
    source: 'provided' | 'user';
    transformKey: string | null;
    members: ItemRef[];
    expanded: boolean;
}

//------------------------------------------------------------------------------------------------
// Observable value - the deliverable output. An ordered top level mixing leaf entries and group
// entries (anchor first if present); each group an ordered member list plus its transform key.
// Ordering at both levels is significant. Every series carries its resolved color. The component
// never dedupes and never computes - consuming apps own any flatten/dedupe.
//------------------------------------------------------------------------------------------------
export type GroupedItemChooserValue = Entry[];

export type Entry = LeafEntry | GroupEntry;

export interface LeafEntry {
    type: 'item';
    id: string;
    kind: string;
    item: ItemRef;
    /** Resolved series color - emitted so consumer visualizations match the control. */
    color: string;
    isAnchor?: boolean;
}

export interface GroupEntry {
    type: 'group';
    id: string;
    label: string;
    source: 'provided' | 'user';
    /** Selected transform key, or null = Individual / show members. */
    transformKey: string | null;
    /** Ordered members, each with its own resolved series color. */
    members: Array<{id: string; kind: string; item: ItemRef; color: string}>;
    /** The group's own series color (used by consumers when a transform is active). */
    color: string;
}

//------------------------------------------------------------------------------------------------
// Node context passed to the `getIcon` / `getColor` callbacks.
//------------------------------------------------------------------------------------------------
export type ChooserNode = ItemNode | GroupNode;

export interface ItemNode {
    nodeType: 'item';
    kind: string;
    level: 'top' | 'member';
    item: ItemRef;
    isAnchor?: boolean;
    /** Present iff level === 'member'. */
    group?: {id: string; label: string; source: 'provided' | 'user'};
    /** The parent group's active transform, iff a member of a transformed group. */
    transform?: Transform;
}

export interface GroupNode {
    nodeType: 'group';
    group: {id: string; label: string; source: 'provided' | 'user'};
    /** The group's active transform, if any. */
    transform?: Transform;
    members: ItemRef[];
    /** Distinct member kinds - lets an app pick homogeneous vs. mixed glyphs. */
    kinds: string[];
}
