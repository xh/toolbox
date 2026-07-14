import {HoistModel, XH} from '@xh/hoist/core';
import {action, computed, makeObservable, observable} from '@xh/hoist/mobx';
import {executeIfFunction, throwIf} from '@xh/hoist/utils/js';
import {isEmpty} from 'lodash';
import {ReactElement} from 'react';
import {ColorAllocator} from './ColorAllocator';
import {
    ChooserEntry,
    ChooserGroupEntry,
    ChooserNode,
    Entry,
    EntryInput,
    GroupedItemChooserValue,
    GroupNode,
    ItemKind,
    ItemNode,
    ItemRef,
    ProvidedGroupDef,
    Transform
} from './Types';

/**
 * Configuration for a {@link GroupedItemChooserModel}.
 */
export interface GroupedItemChooserConfig {
    //--- Content ---
    /** Injected leaf kinds (presentation + typeahead source). Order drives add-menu sections. */
    kinds: ItemKind[];

    /** Host-supplied groups, offered in the add-menu and rendered locked when added. */
    providedGroups?: ProvidedGroupDef[];

    /** Initial comparison contents, or a function to produce them. */
    initialValue?: EntryInput[] | (() => EntryInput[]);

    /**
     * Optional single pinned anchor item, rendered first and immutable. The anchor sits entirely
     * outside the container system: it is never selectable, removable, draggable, or groupable,
     * and any occurrence of its id within provided groups or initial group members is stripped
     * (with a warning).
     */
    anchorItem?: ItemRef;

    //--- Features (component-wide, not per-kind) ---
    /** Enable grouping: checkboxes, action bar, nesting. Default true. */
    enableGrouping?: boolean;

    /** Enable drag-reorder (grips) at both levels. Default true. */
    enableReordering?: boolean;

    /** Transform library. Empty/absent disables the transform feature entirely. */
    transforms?: Transform[];

    /** Transform key adopted by a newly user-defined group. Null = Individual. Default null. */
    defaultTransform?: string | null;

    //--- Icons & color ---
    /**
     * Per-node icon override. Return `null` to omit the icon element entirely, or `undefined`
     * to fall back to the default (the kind's base icon for items; no icon for groups).
     */
    getIcon?: (node: ChooserNode) => ReactElement | null | undefined;

    /** Per-node series color. Return null/undefined to fall back to the pooled allocator. */
    getColor?: (node: ChooserNode) => string | null;

    /** Palette the model-bound allocator draws from (pooled; released on removal). */
    palette?: string[];

    //--- Placement ---
    /** Render inline as a docked panel (default), or floating from a trigger button. */
    displayMode?: 'inline' | 'popover';

    //--- Emit-only callbacks (the component never persists anything itself) ---
    /** Called whenever `value` changes. Apps may instead observe `model.value` directly. */
    onChange?: (value: GroupedItemChooserValue) => void;
}

/** Default palette for series colors - override via `palette`. */
export const DEFAULT_PALETTE = [
    '#4fc3f7',
    '#7e57c2',
    '#26a69a',
    '#ef6c00',
    '#ab47bc',
    '#5c6bc0',
    '#66bb6a',
    '#ec407a',
    '#8d6e63',
    '#42a5f5',
    '#d4a11e',
    '#00897b'
];

/** Default series color for the anchor item - override via `getColor`. */
export const DEFAULT_ANCHOR_COLOR = '#f68d2e';

/**
 * Model for a control that allows users to assemble and organize an ordered comparison set of
 * leaf items, optionally organized into single-level groups, each with an optional per-group
 * transform. Emits the result as a structured, ordered, colored {@link GroupedItemChooserValue}.
 *
 * The model performs no data computation and no plotting - transforms are recorded as keys only,
 * and any chart/legend is a consumer of `value`, not part of this component.
 *
 * Key invariants (see `docs/grouped-item-chooser/spec.md`):
 * - Per-container uniqueness only: an item is unique within the top level and within each group,
 *   but may appear in multiple containers simultaneously. No global dedupe, ever.
 * - A group whose last member is removed is auto-removed; a one-member group remains a group.
 * - The anchor is pinned first and is never selectable/removable/draggable/groupable.
 * - Provided groups are membership-locked but their transform remains editable.
 *
 * @see GroupedItemChooser
 */
export class GroupedItemChooserModel extends HoistModel {
    readonly kinds: ItemKind[];
    readonly providedGroups: ProvidedGroupDef[];
    readonly anchorItem: ItemRef;
    readonly enableGrouping: boolean;
    readonly enableReordering: boolean;
    readonly transforms: Transform[];
    readonly defaultTransform: string | null;
    readonly getIcon: GroupedItemChooserConfig['getIcon'];
    readonly getColor: GroupedItemChooserConfig['getColor'];
    readonly displayMode: 'inline' | 'popover';

    /** Pooled allocator backing default series colors. Exposed for custom `getColor` impls. */
    readonly colorAllocator: ColorAllocator;

    /** Ordered top-level entries (anchor excluded - see `anchorItem`). */
    @observable.ref entries: ChooserEntry[] = [];

    private groupSeq = 0;

    /** The emitted value: ordered, colored, anchor first if present. */
    @computed.struct
    get value(): GroupedItemChooserValue {
        const {anchorItem} = this,
            ret: Entry[] = [];

        if (anchorItem) {
            ret.push({
                type: 'item',
                id: anchorItem.id,
                kind: anchorItem.kind,
                item: anchorItem,
                color: this.resolveColor(this.itemNode(anchorItem, 'top', null, true)),
                isAnchor: true
            });
        }

        this.entries.forEach(e => {
            if (e.type === 'item') {
                ret.push({
                    type: 'item',
                    id: e.item.id,
                    kind: e.item.kind,
                    item: e.item,
                    color: this.resolveColor(this.itemNode(e.item, 'top', null))
                });
            } else {
                ret.push({
                    type: 'group',
                    id: e.id,
                    label: this.getGroupDisplayName(e),
                    source: e.source,
                    transformKey: e.transformKey,
                    members: e.members.map(m => ({
                        id: m.id,
                        kind: m.kind,
                        item: m,
                        color: this.resolveColor(this.itemNode(m, 'member', e))
                    })),
                    color: this.resolveColor(this.groupNode(e))
                });
            }
        });

        return ret;
    }

    @computed
    get userGroups(): ChooserGroupEntry[] {
        return this.entries.filter(e => e.type === 'group' && e.source === 'user') as any;
    }

    get transformsEnabled(): boolean {
        return !isEmpty(this.transforms);
    }

    constructor({
        kinds,
        providedGroups = [],
        initialValue = [],
        anchorItem = null,
        enableGrouping = true,
        enableReordering = true,
        transforms = [],
        defaultTransform = null,
        getIcon = null,
        getColor = null,
        palette = DEFAULT_PALETTE,
        displayMode = 'inline',
        onChange = null
    }: GroupedItemChooserConfig) {
        super();
        makeObservable(this);

        throwIf(isEmpty(kinds), 'GroupedItemChooserModel requires at least one ItemKind.');

        this.kinds = kinds;
        this.anchorItem = anchorItem;
        this.providedGroups = providedGroups.map(def => {
            if (!def.members.some(m => m.id === anchorItem?.id)) return def;
            this.logWarn(
                `Stripped anchor item '${anchorItem.id}' from provided group '${def.id}' - the anchor is never groupable.`
            );
            return {...def, members: def.members.filter(m => m.id !== anchorItem.id)};
        });
        this.enableGrouping = enableGrouping;
        this.enableReordering = enableReordering;
        this.transforms = transforms;
        this.defaultTransform = defaultTransform;
        this.getIcon = getIcon;
        this.getColor = getColor;
        this.displayMode = displayMode;
        this.colorAllocator = new ColorAllocator(palette);

        this.setEntries(this.parseEntryInputs(executeIfFunction(initialValue)));

        if (onChange) {
            this.addReaction({
                track: () => this.value,
                run: value => onChange(value)
            });
        }
    }

    //------------------------------------------------------------------------------------------
    // Lookups & helpers
    //------------------------------------------------------------------------------------------
    getKind(key: string): ItemKind {
        return this.kinds.find(it => it.key === key);
    }

    getTransform(key: string): Transform {
        return key != null ? this.transforms.find(it => it.key === key) : null;
    }

    findGroup(groupId: string): ChooserGroupEntry {
        const ret = this.entries.find(e => e.type === 'group' && e.id === groupId);
        return ret as ChooserGroupEntry;
    }

    getGroupDisplayName(group: ChooserGroupEntry): string {
        return group.label?.trim() ? group.label : `Untitled group ${group.seq ?? 1}`;
    }

    isProvidedGroup(groupId: string): boolean {
        return this.findGroup(groupId)?.source === 'provided';
    }

    /** True if the item is present as a loose top-level entry (anchor excluded). */
    hasTopLevelItem(itemId: string): boolean {
        return this.entries.some(e => e.type === 'item' && e.item.id === itemId);
    }

    /** True if an entry (item or group) with this id is present at the top level. */
    hasEntry(entryId: string): boolean {
        return this.entries.some(e => (e.type === 'item' ? e.item.id : e.id) === entryId);
    }

    isItemInGroup(groupId: string, itemId: string): boolean {
        return !!this.findGroup(groupId)?.members.some(m => m.id === itemId);
    }

    //------------------------------------------------------------------------------------------
    // Mutation actions
    //------------------------------------------------------------------------------------------
    /** Add a leaf item at the top level. No-op if already present there. */
    @action
    addItem(item: ItemRef) {
        if (this.hasTopLevelItem(item.id) || item.id === this.anchorItem?.id) return;
        this.setEntries([...this.entries, {type: 'item', item}]);
    }

    /** Add a provided group (as a membership-locked copy). No-op if already present. */
    @action
    addProvidedGroup(defId: string) {
        const def = this.providedGroups.find(it => it.id === defId);
        if (!def || this.hasEntry(def.id)) return;
        this.setEntries([
            ...this.entries,
            {
                type: 'group',
                id: def.id,
                label: def.label,
                source: 'provided',
                transformKey: def.transformKey ?? null,
                members: [...def.members],
                expanded: false
            }
        ]);
    }

    /** Remove a top-level entry - a leaf item (by item id) or a group (by group id). */
    @action
    removeEntry(entryId: string) {
        this.setEntries(
            this.entries.filter(e => (e.type === 'item' ? e.item.id : e.id) !== entryId)
        );
    }

    /**
     * Add an item to an editable group. If the item exists as a loose top-level entry it is
     * removed from the top level - but never from any other group it belongs to.
     */
    @action
    addMemberToGroup(item: ItemRef, groupId: string) {
        if (this.isProvidedGroup(groupId) || item.id === this.anchorItem?.id) return;
        let entries = this.entries.map(e =>
            e.type === 'group' && e.id === groupId && !e.members.some(m => m.id === item.id)
                ? {...e, members: [...e.members, item]}
                : e
        );
        entries = entries.filter(e => !(e.type === 'item' && e.item.id === item.id));
        this.setEntries(entries);
    }

    /** Move a member between two editable groups. */
    @action
    moveMember(item: ItemRef, fromGroupId: string, toGroupId: string) {
        if (
            fromGroupId === toGroupId ||
            this.isProvidedGroup(fromGroupId) ||
            this.isProvidedGroup(toGroupId)
        ) {
            return;
        }
        let entries = this.entries.map(e => {
            if (e.type !== 'group') return e;
            if (e.id === fromGroupId) {
                return {...e, members: e.members.filter(m => m.id !== item.id)};
            }
            if (e.id === toGroupId && !e.members.some(m => m.id === item.id)) {
                return {...e, members: [...e.members, item]};
            }
            return e;
        });
        this.setEntries(this.pruneEmptyGroups(entries));
    }

    /**
     * Promote a member of an editable group to the top level, at `toIndex` if given (else
     * appended). No-op at the top level if the item is already present there.
     */
    @action
    promoteMemberToTop(item: ItemRef, fromGroupId: string, toIndex: number = null) {
        if (this.isProvidedGroup(fromGroupId)) return;
        let entries = this.entries.map(e =>
            e.type === 'group' && e.id === fromGroupId
                ? {...e, members: e.members.filter(m => m.id !== item.id)}
                : e
        );
        entries = this.pruneEmptyGroups(entries);
        if (!entries.some(e => e.type === 'item' && e.item.id === item.id)) {
            const entry: ChooserEntry = {type: 'item', item},
                idx = toIndex != null && toIndex >= 0 && toIndex <= entries.length ? toIndex : null;
            entries =
                idx != null
                    ? [...entries.slice(0, idx), entry, ...entries.slice(idx)]
                    : [...entries, entry];
        }
        this.setEntries(entries);
    }

    /** Remove a member from an editable group, auto-removing the group if left empty. */
    @action
    removeMember(groupId: string, itemId: string) {
        if (this.isProvidedGroup(groupId)) return;
        const entries = this.entries.map(e =>
            e.type === 'group' && e.id === groupId
                ? {...e, members: e.members.filter(m => m.id !== itemId)}
                : e
        );
        this.setEntries(this.pruneEmptyGroups(entries));
    }

    /**
     * Gather items into a new user-defined group, seeded with `defaultTransform`. Each item is
     * removed from the top level and from any editable group it belongs to (never from provided
     * groups). The new group is inserted where the first gathered top-level entry sat, and is
     * created expanded with an editable, initially-empty name.
     */
    @action
    createGroupFromItems(items: ItemRef[]) {
        items = items.filter(it => it.id !== this.anchorItem?.id);
        if (isEmpty(items)) return;
        const seen = new Set<string>(),
            deduped = items.filter(it => !seen.has(it.id) && seen.add(it.id) !== null),
            ids = new Set(deduped.map(it => it.id));

        // Insertion index = position of first gathered top-level entry among surviving entries.
        let insertAt: number = null,
            survivorCount = 0;
        for (const e of this.entries) {
            if (e.type === 'item' && ids.has(e.item.id)) {
                insertAt = insertAt ?? survivorCount;
            } else {
                survivorCount++;
            }
        }

        let entries = this.entries.map(e =>
            e.type === 'group' && e.source === 'user'
                ? {...e, members: e.members.filter(m => !ids.has(m.id))}
                : e
        );
        entries = entries.filter(e => !(e.type === 'item' && ids.has(e.item.id)));
        entries = this.pruneEmptyGroups(entries);

        const group: ChooserGroupEntry = {
            type: 'group',
            id: XH.genId(),
            label: '',
            seq: ++this.groupSeq,
            source: 'user',
            transformKey: this.defaultTransform,
            members: deduped,
            expanded: true
        };
        const idx = insertAt != null ? Math.min(insertAt, entries.length) : entries.length;
        this.setEntries([...entries.slice(0, idx), group, ...entries.slice(idx)]);
    }

    /** Dissolve a user-defined group, spilling members not already at the top level in place. */
    @action
    ungroup(groupId: string) {
        const group = this.findGroup(groupId);
        if (!group || group.source === 'provided') return;
        const idx = this.entries.indexOf(group),
            spilled: ChooserEntry[] = group.members
                .filter(m => !this.hasTopLevelItem(m.id))
                .map(m => ({type: 'item', item: m}));
        this.setEntries([
            ...this.entries.slice(0, idx),
            ...spilled,
            ...this.entries.slice(idx + 1)
        ]);
    }

    /** Duplicate a provided group as an editable user copy, inserted directly below it. */
    @action
    duplicateProvidedGroup(groupId: string) {
        const group = this.findGroup(groupId);
        if (!group) return;
        const idx = this.entries.indexOf(group),
            copy: ChooserGroupEntry = {
                type: 'group',
                id: XH.genId(),
                label: `${this.getGroupDisplayName(group)} (copy)`,
                seq: ++this.groupSeq,
                source: 'user',
                transformKey: group.transformKey,
                members: group.members.map(m => ({...m})),
                expanded: true
            };
        this.setEntries([...this.entries.slice(0, idx + 1), copy, ...this.entries.slice(idx + 1)]);
    }

    /** Set a group's transform key (null = Individual). Allowed on provided groups. */
    @action
    setGroupTransform(groupId: string, transformKey: string | null) {
        this.updateGroup(groupId, g => ({...g, transformKey}));
    }

    /** Rename a user-defined group. */
    @action
    renameGroup(groupId: string, label: string) {
        if (this.isProvidedGroup(groupId)) return;
        this.updateGroup(groupId, g => ({...g, label}));
    }

    @action
    toggleExpanded(groupId: string) {
        this.updateGroup(groupId, g => ({...g, expanded: !g.expanded}));
    }

    /** Move a top-level entry to a new index (drag-reorder). */
    @action
    moveEntry(entryId: string, toIndex: number) {
        const entries = [...this.entries],
            fromIdx = entries.findIndex(e => (e.type === 'item' ? e.item.id : e.id) === entryId);
        if (fromIdx < 0 || toIndex < 0 || toIndex >= entries.length) return;
        const [entry] = entries.splice(fromIdx, 1);
        entries.splice(toIndex, 0, entry);
        this.setEntries(entries);
    }

    /** Reorder a member within its (editable) group. */
    @action
    moveMemberWithinGroup(groupId: string, itemId: string, toIndex: number) {
        if (this.isProvidedGroup(groupId)) return;
        this.updateGroup(groupId, g => {
            const members = [...g.members],
                fromIdx = members.findIndex(m => m.id === itemId);
            if (fromIdx < 0 || toIndex < 0 || toIndex >= members.length) return g;
            const [member] = members.splice(fromIdx, 1);
            members.splice(toIndex, 0, member);
            return {...g, members};
        });
    }

    //------------------------------------------------------------------------------------------
    // Icon & color resolution
    //------------------------------------------------------------------------------------------
    itemNode(
        item: ItemRef,
        level: 'top' | 'member',
        group: ChooserGroupEntry = null,
        isAnchor = false
    ): ItemNode {
        const ret: ItemNode = {nodeType: 'item', kind: item.kind, level, item};
        if (isAnchor) ret.isAnchor = true;
        if (group) {
            ret.group = {
                id: group.id,
                label: this.getGroupDisplayName(group),
                source: group.source
            };
            const transform = this.getTransform(group.transformKey);
            if (transform) ret.transform = transform;
        }
        return ret;
    }

    groupNode(group: ChooserGroupEntry): GroupNode {
        const ret: GroupNode = {
            nodeType: 'group',
            group: {id: group.id, label: this.getGroupDisplayName(group), source: group.source},
            members: group.members,
            kinds: [...new Set(group.members.map(m => m.kind))]
        };
        const transform = this.getTransform(group.transformKey);
        if (transform) ret.transform = transform;
        return ret;
    }

    /**
     * Resolve the icon for a node: custom callback first (`null` = omit entirely, `undefined` =
     * no opinion), falling back to the kind's base icon for items. Groups have no base icon.
     */
    resolveIcon(node: ChooserNode): ReactElement {
        if (this.getIcon) {
            const ret = this.getIcon(node);
            if (ret !== undefined) return ret;
        }
        return node.nodeType === 'item' ? (this.getKind(node.kind)?.icon ?? null) : null;
    }

    /** Resolve the series color for a node: custom callback first, else the pooled allocator. */
    resolveColor(node: ChooserNode): string {
        const custom = this.getColor?.(node);
        if (custom) return custom;

        if (node.nodeType === 'group') {
            return this.colorAllocator.allocate(`g:${node.group.id}`);
        }
        if (node.isAnchor) return DEFAULT_ANCHOR_COLOR;

        const color = this.colorAllocator.allocate(`i:${node.item.id}`);
        return node.level === 'member' && node.transform?.isAggregate
            ? this.muteColor(color)
            : color;
    }

    //------------------------------------------------------------------------------------------
    // Implementation
    //------------------------------------------------------------------------------------------
    private setEntries(entries: ChooserEntry[]) {
        this.entries = entries;
        this.reconcileColors();
    }

    private updateGroup(groupId: string, fn: (g: ChooserGroupEntry) => ChooserGroupEntry) {
        this.setEntries(
            this.entries.map(e => (e.type === 'group' && e.id === groupId ? fn(e) : e))
        );
    }

    /** Drop user-defined groups whose last member has been removed. Provided groups persist. */
    private pruneEmptyGroups(entries: ChooserEntry[]): ChooserEntry[] {
        return entries.filter(
            e => !(e.type === 'group' && e.source === 'user' && isEmpty(e.members))
        );
    }

    /** Sync the allocator with all live series identities, in display order. */
    private reconcileColors() {
        const keys: string[] = [];
        this.entries.forEach(e => {
            if (e.type === 'item') {
                keys.push(`i:${e.item.id}`);
            } else {
                keys.push(`g:${e.id}`);
                e.members.forEach(m => keys.push(`i:${m.id}`));
            }
        });
        this.colorAllocator.reconcile([...new Set(keys)]);
    }

    private muteColor(color: string): string {
        return /^#[0-9a-fA-F]{6}$/.test(color) ? `${color}99` : color;
    }

    private parseEntryInputs(inputs: EntryInput[]): ChooserEntry[] {
        const anchorId = this.anchorItem?.id,
            warnAnchor = (where: string) =>
                this.logWarn(
                    `Stripped anchor item '${anchorId}' from initialValue ${where} - the anchor is pinned separately and never groupable.`
                );

        return (inputs ?? []).flatMap(input => {
            if (input.type === 'item') {
                if (input.item.id === anchorId) {
                    warnAnchor('top-level entries');
                    return [];
                }
                return [{type: 'item', item: input.item} as ChooserEntry];
            }

            let {members} = input;
            if (members.some(m => m.id === anchorId)) {
                warnAnchor(`group '${input.label}' members`);
                members = members.filter(m => m.id !== anchorId);
            }

            const source = input.source ?? 'user';
            return [
                {
                    type: 'group',
                    id: input.id ?? XH.genId(),
                    label: input.label,
                    seq: source === 'user' ? ++this.groupSeq : undefined,
                    source,
                    transformKey: input.transformKey ?? null,
                    members: [...members],
                    expanded: input.expanded ?? false
                } as ChooserEntry
            ];
        });
    }
}
