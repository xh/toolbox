import {DropResult} from '@hello-pangea/dnd';
import {HoistModel, lookup} from '@xh/hoist/core';
import {action, bindable, computed, makeObservable, observable} from '@xh/hoist/mobx';
import {createObservableRef} from '@xh/hoist/utils/react';
import {isEmpty} from 'lodash';
import {GroupedItemChooserModel} from '../GroupedItemChooserModel';
import {ItemKind, ItemOption, ItemRef, ProvidedGroupDef} from '../Types';

/** A selected row - either a top-level entry or a member of an (editable) group. */
export type SelectionRef =
    | {type: 'top'; id: string; isGroup: boolean; item?: ItemRef}
    | {type: 'member'; groupId: string; item: ItemRef};

export interface AddMenuKindSection {
    kind: ItemKind;
    options: Array<ItemOption & {added: boolean}>;
}

export interface AddMenuGroupSection {
    defs: Array<{def: ProvidedGroupDef; added: boolean}>;
}

/**
 * Local model for GroupedItemChooser components. Holds transient, per-component-instance UI
 * state - open menus, pending queries, selection, and drag-and-drop handling.
 *
 * @internal
 */
export class GroupedItemChooserLocalModel extends HoistModel {
    override xhImpl = true;

    @lookup(GroupedItemChooserModel)
    parentModel: GroupedItemChooserModel;

    //--- Add menu (bottom typeahead) ---
    @observable addMenuOpen = false;
    @bindable query = '';
    @observable.ref addMenuSections: AddMenuKindSection[] = [];

    //--- In-group picker ---
    @observable groupPickerId: string = null;
    @bindable groupQuery = '';
    @observable.ref groupPickerSections: AddMenuKindSection[] = [];

    //--- Menus / popover ---
    @observable rowMenuId: string = null;
    @observable groupIntoOpen = false;
    @observable popoverOpen = false;

    /** Used in popover placement for DnD transform correction (popover positions via transform). */
    popoverRef = createObservableRef<HTMLElement>();

    //--- Selection ---
    @observable.ref selection: Record<string, SelectionRef> = {};

    constructor() {
        super();
        makeObservable(this);
    }

    override onLinked() {
        this.addReaction(
            {
                track: () => [this.query, this.addMenuOpen, this.parentModel.entries],
                run: () => this.refreshAddMenuAsync(),
                fireImmediately: true
            },
            {
                track: () => [this.groupQuery, this.groupPickerId, this.parentModel.entries],
                run: () => this.refreshGroupPickerAsync()
            }
        );
    }

    //------------------------------------------------------------------------------------------
    // Add menu
    //------------------------------------------------------------------------------------------
    @computed
    get providedGroupSection(): AddMenuGroupSection {
        const {parentModel} = this,
            q = this.query.trim().toLowerCase(),
            defs = parentModel.providedGroups
                .filter(def => !q || def.label.toLowerCase().includes(q))
                .map(def => ({def, added: parentModel.hasEntry(def.id)}));
        return {defs};
    }

    @computed
    get addMenuIsEmpty(): boolean {
        return (
            isEmpty(this.providedGroupSection.defs) &&
            this.addMenuSections.every(it => isEmpty(it.options))
        );
    }

    @action
    openAddMenu() {
        this.addMenuOpen = true;
        this.rowMenuId = null;
        this.groupIntoOpen = false;
        this.groupPickerId = null;
    }

    @action
    closeAllMenus() {
        this.addMenuOpen = false;
        this.rowMenuId = null;
        this.groupIntoOpen = false;
        this.groupPickerId = null;
    }

    get anyMenuOpen(): boolean {
        return this.addMenuOpen || !!this.rowMenuId || this.groupIntoOpen || !!this.groupPickerId;
    }

    @action
    addItemFromOption(option: ItemOption, kind: ItemKind) {
        this.parentModel.addItem(this.toItemRef(option, kind));
        this.query = '';
        this.addMenuOpen = false;
    }

    @action
    addProvidedGroup(defId: string) {
        this.parentModel.addProvidedGroup(defId);
        this.query = '';
        this.addMenuOpen = false;
    }

    //------------------------------------------------------------------------------------------
    // In-group picker
    //------------------------------------------------------------------------------------------
    @action
    toggleGroupPicker(groupId: string) {
        this.groupPickerId = this.groupPickerId === groupId ? null : groupId;
        this.groupQuery = '';
        this.addMenuOpen = false;
        this.rowMenuId = null;
        this.groupIntoOpen = false;
    }

    @action
    addToGroupFromOption(option: ItemOption, kind: ItemKind, groupId: string) {
        this.parentModel.addMemberToGroup(this.toItemRef(option, kind), groupId);
        this.groupQuery = '';
        this.clearSelection();
    }

    //------------------------------------------------------------------------------------------
    // Row "..." menu / group-into popup
    //------------------------------------------------------------------------------------------
    @action
    toggleRowMenu(groupId: string) {
        this.rowMenuId = this.rowMenuId === groupId ? null : groupId;
        this.addMenuOpen = false;
        this.groupIntoOpen = false;
        this.groupPickerId = null;
    }

    @action
    toggleGroupInto() {
        this.groupIntoOpen = !this.groupIntoOpen;
        this.rowMenuId = null;
        this.addMenuOpen = false;
    }

    //------------------------------------------------------------------------------------------
    // Popover placement
    //------------------------------------------------------------------------------------------
    @action
    togglePopover() {
        this.popoverOpen = !this.popoverOpen;
        if (!this.popoverOpen) this.closeAllMenus();
    }

    @action
    closePopover() {
        this.popoverOpen = false;
        this.closeAllMenus();
    }

    //------------------------------------------------------------------------------------------
    // Selection
    //------------------------------------------------------------------------------------------
    @computed
    get selectionRefs(): SelectionRef[] {
        return Object.values(this.selection);
    }

    @computed
    get selectionCount(): number {
        return this.selectionRefs.length;
    }

    /** Selected refs that are items (top-level leaves or members) - not groups. */
    @computed
    get selectedItemRefs(): SelectionRef[] {
        return this.selectionRefs.filter(r => r.type === 'member' || !r.isGroup);
    }

    @computed
    get selectedMemberRefs(): SelectionRef[] {
        return this.selectionRefs.filter(r => r.type === 'member');
    }

    @computed
    get hasGroupSelected(): boolean {
        return this.selectionRefs.some(r => r.type === 'top' && r.isGroup);
    }

    @computed
    get showGroupButton(): boolean {
        const {parentModel, selectedItemRefs, hasGroupSelected} = this;
        return parentModel.enableGrouping && selectedItemRefs.length >= 1 && !hasGroupSelected;
    }

    @computed
    get showMoveOutButton(): boolean {
        return this.selectedMemberRefs.length >= 1;
    }

    /**
     * True to disable the Group button: a single selected item with no existing editable group
     * to move it into. Creating a group of one is not offered via the action bar - the button's
     * tooltip nudges the user to select more.
     */
    @computed
    get groupButtonDisabled(): boolean {
        return this.selectedItemRefs.length === 1 && isEmpty(this.parentModel.userGroups);
    }

    selectionKey(ref: SelectionRef): string {
        return ref.type === 'member' ? `m:${ref.groupId}:${ref.item.id}` : ref.id;
    }

    isSelected(ref: SelectionRef): boolean {
        return !!this.selection[this.selectionKey(ref)];
    }

    @action
    toggleSelected(ref: SelectionRef) {
        const key = this.selectionKey(ref),
            selection = {...this.selection};
        if (selection[key]) {
            delete selection[key];
        } else {
            selection[key] = ref;
        }
        this.selection = selection;
    }

    @action
    clearSelection() {
        this.selection = {};
        this.groupIntoOpen = false;
    }

    //--- Selection-driven bulk actions ---
    @action
    groupSelectionIntoNew() {
        this.parentModel.createGroupFromItems(this.selectedItemRefs.map(r => r.item));
        this.clearSelection();
    }

    @action
    moveSelectionInto(groupId: string) {
        const {parentModel} = this;
        this.selectedItemRefs.forEach(r => {
            if (r.type === 'member') {
                parentModel.moveMember(r.item, r.groupId, groupId);
            } else {
                parentModel.addMemberToGroup(r.item, groupId);
            }
        });
        this.clearSelection();
    }

    @action
    moveSelectionOut() {
        this.selectedMemberRefs.forEach(r => {
            if (r.type === 'member') this.parentModel.promoteMemberToTop(r.item, r.groupId);
        });
        this.clearSelection();
    }

    @action
    removeSelection() {
        const {parentModel} = this;
        this.selectionRefs.forEach(r => {
            if (r.type === 'member') {
                parentModel.removeMember(r.groupId, r.item.id);
            } else {
                parentModel.removeEntry(r.id);
            }
        });
        this.clearSelection();
    }

    //------------------------------------------------------------------------------------------
    // Drag and drop
    //------------------------------------------------------------------------------------------
    onDragEnd(result: DropResult) {
        const {parentModel} = this,
            {draggableId, destination, combine} = result,
            src = this.parseDraggableId(draggableId);
        if (!src) return;

        // Combine = dropped onto a top-level row: nest into that row's group if editable.
        if (combine) {
            const target = this.parseDraggableId(combine.draggableId);
            if (
                target?.type === 'top' &&
                target.isGroup &&
                !parentModel.isProvidedGroup(target.id) &&
                src !== target
            ) {
                if (src.type === 'member') {
                    parentModel.moveMember(src.item, src.groupId, target.id);
                } else if (!src.isGroup) {
                    parentModel.addMemberToGroup(src.item, target.id);
                }
            }
            return;
        }

        if (!destination) return;
        const destGroupId = this.droppableGroupId(destination.droppableId);

        if (destGroupId == null) {
            // Dropped in the top-level list.
            if (src.type === 'top') {
                parentModel.moveEntry(src.id, destination.index);
            } else {
                parentModel.promoteMemberToTop(src.item, src.groupId, destination.index);
            }
        } else {
            // Dropped in a group's member list.
            if (src.type === 'member') {
                if (src.groupId === destGroupId) {
                    parentModel.moveMemberWithinGroup(destGroupId, src.item.id, destination.index);
                } else {
                    parentModel.moveMember(src.item, src.groupId, destGroupId);
                }
            } else if (!src.isGroup) {
                parentModel.addMemberToGroup(src.item, destGroupId);
            }
        }
    }

    entryDraggableId(entryId: string): string {
        return `top|${entryId}`;
    }

    memberDraggableId(groupId: string, itemId: string): string {
        return `member|${groupId}|${itemId}`;
    }

    groupDroppableId(groupId: string): string {
        return `group|${groupId}`;
    }

    //------------------------------------------------------------------------------------------
    // Implementation
    //------------------------------------------------------------------------------------------
    private parseDraggableId(id: string): SelectionRef {
        const {parentModel} = this,
            parts = id.split('|');
        if (parts[0] === 'top') {
            const entry = parentModel.entries.find(
                e => (e.type === 'item' ? e.item.id : e.id) === parts[1]
            );
            if (!entry) return null;
            return entry.type === 'item'
                ? {type: 'top', id: entry.item.id, isGroup: false, item: entry.item}
                : {type: 'top', id: entry.id, isGroup: true};
        }
        if (parts[0] === 'member') {
            const item = parentModel.findGroup(parts[1])?.members.find(m => m.id === parts[2]);
            return item ? {type: 'member', groupId: parts[1], item} : null;
        }
        return null;
    }

    private droppableGroupId(droppableId: string): string {
        const parts = droppableId.split('|');
        return parts[0] === 'group' ? parts[1] : null;
    }

    private toItemRef(option: ItemOption, kind: ItemKind): ItemRef {
        return {
            id: option.id,
            kind: kind.key,
            label: option.label,
            sublabel: option.sublabel,
            data: option.data
        };
    }

    private async refreshAddMenuAsync() {
        if (!this.addMenuOpen) return;
        const {parentModel, query} = this,
            {anchorItem} = parentModel,
            sections = await Promise.all(
                parentModel.kinds.map(async kind => {
                    const options = await kind.querySource(query);
                    return {
                        kind,
                        options: options.map(opt => ({
                            ...opt,
                            added: parentModel.hasTopLevelItem(opt.id) || opt.id === anchorItem?.id
                        }))
                    };
                })
            );
        this.setAddMenuSections(sections);
    }

    private async refreshGroupPickerAsync() {
        const {parentModel, groupPickerId, groupQuery} = this;
        if (!groupPickerId) return;
        const {anchorItem} = parentModel,
            sections = await Promise.all(
                parentModel.kinds.map(async kind => {
                    const options = await kind.querySource(groupQuery);
                    return {
                        kind,
                        options: options
                            .filter(
                                opt =>
                                    !parentModel.isItemInGroup(groupPickerId, opt.id) &&
                                    opt.id !== anchorItem?.id
                            )
                            .map(opt => ({...opt, added: false}))
                    };
                })
            );
        this.setGroupPickerSections(sections);
    }

    @action
    private setAddMenuSections(sections: AddMenuKindSection[]) {
        this.addMenuSections = sections;
    }

    @action
    private setGroupPickerSections(sections: AddMenuKindSection[]) {
        this.groupPickerSections = sections;
    }
}
