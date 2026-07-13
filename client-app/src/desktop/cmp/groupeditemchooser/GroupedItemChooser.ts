import {library} from '@fortawesome/fontawesome-svg-core';
import {faObjectGroup, faObjectUngroup} from '@fortawesome/pro-regular-svg-icons';
import {badge} from '@xh/hoist/cmp/badge';
import {div, filler, fragment, hbox, input, span, vbox} from '@xh/hoist/cmp/layout';
import {
    hoistCmp,
    HoistProps,
    LayoutProps,
    StyleProps,
    TestSupportProps,
    useLocalModel,
    uses
} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {textInput} from '@xh/hoist/desktop/cmp/input';
import '@xh/hoist/desktop/register';
import {Icon} from '@xh/hoist/icon';
import {menu, menuDivider, menuItem, popover} from '@xh/hoist/kit/blueprint';
import {dragDropContext, draggable, droppable} from '@xh/hoist/kit/react-beautiful-dnd';
import {elemWithin} from '@xh/hoist/utils/js';
import {splitLayoutProps} from '@xh/hoist/utils/react';
import classNames from 'classnames';
import {isEmpty} from 'lodash';
import {ReactNode} from 'react';
import './GroupedItemChooser.scss';
import {GroupedItemChooserModel} from './GroupedItemChooserModel';
import {GroupedItemChooserLocalModel} from './impl/GroupedItemChooserLocalModel';
import {ChooserGroupEntry, ChooserItemEntry} from './Types';

// Group/ungroup glyphs are not in Hoist's enumerated icon set - register them here so they
// travel with the component. Uses the default 'far' (regular) weight.
library.add(faObjectGroup, faObjectUngroup);
const groupActionIcon = () => Icon.icon({iconName: 'object-group'});
const ungroupActionIcon = () => Icon.icon({iconName: 'object-ungroup'});

export interface GroupedItemChooserProps
    extends HoistProps<GroupedItemChooserModel>, LayoutProps, StyleProps, TestSupportProps {
    /** Header title, shown in inline mode. Pass null to suppress the header entirely. */
    title?: ReactNode;

    /** One-line usage hint below the inline header, or null/omitted to suppress. */
    hint?: ReactNode;

    /** Text for the trigger button in popover mode. */
    buttonText?: ReactNode;

    /** Placeholder for the bottom add field. */
    addPlaceholder?: string;

    /** Section header label for provided groups in the add-menu. */
    groupsSectionLabel?: string;

    /** Width in pixels of the popover panel (popover mode only). */
    popoverWidth?: number;

    /** Max height in pixels of the scrolling list in popover mode. */
    popoverMaxHeight?: number;
}

/**
 * A general, domain-neutral item/series picker + grouper. Users assemble an ordered comparison
 * set of leaf items, optionally organize them into single-level groups with per-group transforms,
 * and order everything - the backing model emits a structured, ordered, colored `value`.
 *
 * @see GroupedItemChooserModel
 */
export const [GroupedItemChooser, groupedItemChooser] =
    hoistCmp.withFactory<GroupedItemChooserProps>({
        displayName: 'GroupedItemChooser',
        model: uses(GroupedItemChooserModel),
        className: 'xh-grouped-item-chooser',

        render(
            {
                model,
                className,
                title = 'Comparison',
                hint,
                buttonText = 'Compare',
                addPlaceholder = 'Add...',
                groupsSectionLabel = 'Groups',
                popoverWidth = 320,
                popoverMaxHeight = 500,
                testId,
                ...rest
            },
            ref
        ) {
            const impl = useLocalModel(GroupedItemChooserLocalModel),
                [layoutProps, {style}] = splitLayoutProps(rest);

            if (model.displayMode === 'popover') {
                return div({
                    ref,
                    className: classNames(className, 'xh-grouped-item-chooser--popover'),
                    item: popover({
                        isOpen: impl.popoverOpen,
                        popoverRef: impl.popoverRef,
                        position: 'bottom-right',
                        minimal: false,
                        popoverClassName: 'xh-grouped-item-chooser-popover',
                        item: button({
                            className: 'xh-grouped-item-chooser__button',
                            testId,
                            text: fragment(
                                buttonText,
                                badge({item: model.value.length, intent: 'primary'})
                            ),
                            icon: Icon.treeList(),
                            rightIcon: Icon.angleDown(),
                            active: impl.popoverOpen,
                            onClick: () => impl.togglePopover()
                        }),
                        content: chooserBody({
                            model: impl,
                            title,
                            hint: null,
                            addPlaceholder,
                            groupsSectionLabel,
                            width: popoverWidth,
                            listMaxHeight: popoverMaxHeight
                        }),
                        onInteraction: (nextOpenState, e) => {
                            if (
                                !nextOpenState &&
                                e?.target &&
                                !elemWithin(
                                    e.target as HTMLElement,
                                    'xh-grouped-item-chooser__button'
                                )
                            ) {
                                impl.closePopover();
                            }
                        }
                    })
                });
            }

            return vbox({
                ref,
                className,
                testId,
                style,
                ...layoutProps,
                item: chooserBody({
                    model: impl,
                    title,
                    hint,
                    addPlaceholder,
                    groupsSectionLabel,
                    showHeader: true
                })
            });
        }
    });

//--------------------------------------------------------------------------------------------
// Body - identical in both placements.
//--------------------------------------------------------------------------------------------
const chooserBody = hoistCmp.factory<GroupedItemChooserLocalModel>({
    render({
        model,
        title,
        hint,
        addPlaceholder,
        groupsSectionLabel,
        showHeader = false,
        width = null,
        listMaxHeight = null
    }) {
        const {parentModel} = model;
        return vbox({
            className: 'xh-grouped-item-chooser__body',
            width,
            items: [
                div({
                    omit: !showHeader || (title == null && !hint),
                    className: 'xh-grouped-item-chooser__header',
                    items: [
                        div({
                            className: 'xh-grouped-item-chooser__header__title',
                            items: [
                                span(title),
                                badge({item: parentModel.value.length, intent: 'primary'})
                            ]
                        }),
                        div({
                            omit: !hint,
                            className: 'xh-grouped-item-chooser__header__hint',
                            item: hint
                        })
                    ]
                }),
                dragDropContext({
                    onDragEnd: result => model.onDragEnd(result),
                    item: div({
                        className: 'xh-grouped-item-chooser__list',
                        style: listMaxHeight ? {maxHeight: listMaxHeight, overflowY: 'auto'} : null,
                        items: [anchorRow(), entryList()]
                    })
                }),
                selectionBar(),
                addField({addPlaceholder, groupsSectionLabel})
            ]
        });
    }
});

//--------------------------------------------------------------------------------------------
// Anchor row - pinned, immutable, rendered above (and outside) the reorderable list.
//--------------------------------------------------------------------------------------------
const anchorRow = hoistCmp.factory<GroupedItemChooserLocalModel>({
    render({model}) {
        const {parentModel} = model,
            {anchorItem} = parentModel;
        if (!anchorItem) return null;

        const node = parentModel.itemNode(anchorItem, 'top', null, true),
            icon = parentModel.resolveIcon(node),
            color = parentModel.resolveColor(node);

        return div({
            className: 'xh-grouped-item-chooser__row xh-grouped-item-chooser__row--anchor',
            items: [
                span({
                    omit: !parentModel.enableGrouping,
                    className: 'xh-grouped-item-chooser__row__select'
                }),
                span({
                    className: 'xh-grouped-item-chooser__row__lead',
                    item: Icon.pin({className: 'xh-grouped-item-chooser__pin'})
                }),
                span({className: 'xh-grouped-item-chooser__row__caret'}),
                iconChip({icon, color}),
                div({
                    className: 'xh-grouped-item-chooser__row__name',
                    items: [
                        div({className: 'nm', item: anchorItem.label}),
                        div({
                            omit: !anchorItem.sublabel,
                            className: 'mt',
                            item: anchorItem.sublabel
                        })
                    ]
                }),
                span({className: 'xh-grouped-item-chooser__row__right'})
            ]
        });
    }
});

//--------------------------------------------------------------------------------------------
// Top-level entry list.
//--------------------------------------------------------------------------------------------
const entryList = hoistCmp.factory<GroupedItemChooserLocalModel>({
    render({model}) {
        const {parentModel} = model,
            // Dereference in this observer's render - rbd's children callback is not tracked.
            {entries} = parentModel,
            rows = entries.map((entry, idx) =>
                entry.type === 'item'
                    ? itemEntryRow({entry, idx, key: `i-${entry.item.id}`})
                    : groupEntryRow({entry, idx, key: `g-${entry.id}`})
            );
        return droppable({
            droppableId: 'top',
            type: 'gic',
            isCombineEnabled: parentModel.enableGrouping && parentModel.enableReordering,
            children: dndProps =>
                div({
                    ref: dndProps.innerRef,
                    ...dndProps.droppableProps,
                    className: 'xh-grouped-item-chooser__entries',
                    items: [...rows, dndProps.placeholder]
                })
        });
    }
});

//--------------------------------------------------------------------------------------------
// Top-level leaf item row.
//--------------------------------------------------------------------------------------------
const itemEntryRow = hoistCmp.factory<GroupedItemChooserLocalModel>({
    render({model, entry, idx}) {
        const {parentModel} = model,
            {item} = entry as ChooserItemEntry,
            node = parentModel.itemNode(item, 'top', null),
            icon = parentModel.resolveIcon(node),
            color = parentModel.resolveColor(node),
            selRef = {type: 'top', id: item.id, isGroup: false, item} as const,
            selected = model.isSelected(selRef);

        return draggable({
            key: item.id,
            draggableId: model.entryDraggableId(item.id),
            index: idx,
            isDragDisabled: !parentModel.enableReordering,
            children: (dndProps, dndState) =>
                div({
                    ref: dndProps.innerRef,
                    ...dndProps.draggableProps,
                    style: correctedDragStyle(model, dndProps, dndState),
                    className: classNames(
                        'xh-grouped-item-chooser__row',
                        selected ? 'xh-grouped-item-chooser__row--selected' : null,
                        dndState.isDragging ? 'xh-grouped-item-chooser__row--dragging' : null
                    ),
                    items: [
                        selectBox({selRef, selected}),
                        gripOrSpacer({dndProps}),
                        span({className: 'xh-grouped-item-chooser__row__caret'}),
                        iconChip({icon, color}),
                        div({
                            className: 'xh-grouped-item-chooser__row__name',
                            items: [
                                div({className: 'nm', item: item.label}),
                                div({omit: !item.sublabel, className: 'mt', item: item.sublabel})
                            ]
                        }),
                        span({
                            className: 'xh-grouped-item-chooser__row__right',
                            item: removeBtn({onClick: () => parentModel.removeEntry(item.id)})
                        })
                    ]
                })
        });
    }
});

//--------------------------------------------------------------------------------------------
// Top-level group row + expanded member area.
//--------------------------------------------------------------------------------------------
const groupEntryRow = hoistCmp.factory<GroupedItemChooserLocalModel>({
    render({model, entry, idx}) {
        const {parentModel} = model,
            group = entry as ChooserGroupEntry,
            locked = group.source === 'provided',
            node = parentModel.groupNode(group),
            icon = parentModel.resolveIcon(node),
            color = parentModel.resolveColor(node),
            transform = parentModel.getTransform(group.transformKey),
            selRef = {type: 'top', id: group.id, isGroup: true} as const,
            selected = model.isSelected(selRef);

        return draggable({
            key: group.id,
            draggableId: model.entryDraggableId(group.id),
            index: idx,
            isDragDisabled: !parentModel.enableReordering,
            children: (dndProps, dndState) =>
                div({
                    ref: dndProps.innerRef,
                    ...dndProps.draggableProps,
                    style: correctedDragStyle(model, dndProps, dndState),
                    className: classNames(
                        'xh-grouped-item-chooser__group',
                        dndState.isDragging ? 'xh-grouped-item-chooser__row--dragging' : null,
                        dndState.combineTargetFor && !locked
                            ? 'xh-grouped-item-chooser__group--nest-target'
                            : null
                    ),
                    items: [
                        div({
                            className: classNames(
                                'xh-grouped-item-chooser__row',
                                selected ? 'xh-grouped-item-chooser__row--selected' : null
                            ),
                            items: [
                                selectBox({selRef, selected}),
                                gripOrSpacer({dndProps}),
                                button({
                                    className: 'xh-grouped-item-chooser__row__caret',
                                    minimal: true,
                                    icon: group.expanded ? Icon.chevronDown() : Icon.chevronRight(),
                                    onClick: () => parentModel.toggleExpanded(group.id)
                                }),
                                iconChip({icon, color}),
                                div({
                                    className: 'xh-grouped-item-chooser__row__name',
                                    items: [
                                        locked
                                            ? div({
                                                  className: 'nm',
                                                  item: parentModel.getGroupDisplayName(group)
                                              })
                                            : input({
                                                  className: 'nm nm--editable',
                                                  value: group.label,
                                                  placeholder: `Untitled group ${group.seq ?? 1}`,
                                                  onChange: e =>
                                                      parentModel.renameGroup(
                                                          group.id,
                                                          e.target.value
                                                      )
                                              }),
                                        div({
                                            className: 'mt',
                                            items: [
                                                span(`${group.members.length} items`),
                                                span({
                                                    omit: !transform,
                                                    className: 'xh-grouped-item-chooser__tf-tag',
                                                    item: (
                                                        transform?.shortLabel ??
                                                        transform?.label ??
                                                        ''
                                                    ).toUpperCase()
                                                }),
                                                span({
                                                    omit: !locked,
                                                    className: 'xh-grouped-item-chooser__lock',
                                                    item: Icon.lock()
                                                })
                                            ]
                                        })
                                    ]
                                }),
                                span({
                                    className: 'xh-grouped-item-chooser__row__right',
                                    items: [
                                        groupMenuButton({group}),
                                        removeBtn({
                                            onClick: () => parentModel.removeEntry(group.id)
                                        })
                                    ]
                                })
                            ]
                        }),
                        memberArea({group, omit: !group.expanded})
                    ]
                })
        });
    }
});

//--------------------------------------------------------------------------------------------
// Group "..." structural menu - transforms + duplicate/ungroup.
//--------------------------------------------------------------------------------------------
const groupMenuButton = hoistCmp.factory<GroupedItemChooserLocalModel>({
    render({model, group}) {
        const {parentModel} = model,
            locked = group.source === 'provided',
            {transformsEnabled} = parentModel,
            transformItems = transformsEnabled
                ? [
                      menuDivider({title: 'Transform'}),
                      menuItem({
                          text: 'Individual',
                          icon: transformCheck(group.transformKey == null),
                          onClick: () => parentModel.setGroupTransform(group.id, null)
                      }),
                      ...parentModel.transforms.map(t =>
                          menuItem({
                              text: t.label,
                              icon: transformCheck(group.transformKey === t.key),
                              onClick: () => parentModel.setGroupTransform(group.id, t.key)
                          })
                      ),
                      menuDivider()
                  ]
                : [];

        return popover({
            isOpen: model.rowMenuId === group.id,
            position: 'bottom-right',
            minimal: true,
            item: button({
                className: 'xh-grouped-item-chooser__row__menu-btn',
                minimal: true,
                icon: Icon.ellipsisHorizontal(),
                onClick: () => model.toggleRowMenu(group.id)
            }),
            content: menu({
                items: [
                    ...transformItems,
                    locked
                        ? menuItem({
                              text: 'Duplicate as editable copy',
                              icon: Icon.copy(),
                              onClick: () => parentModel.duplicateProvidedGroup(group.id)
                          })
                        : menuItem({
                              text: 'Ungroup (to top level)',
                              icon: ungroupActionIcon(),
                              onClick: () => parentModel.ungroup(group.id)
                          })
                ]
            }),
            onInteraction: nextOpenState => {
                if (!nextOpenState && model.rowMenuId === group.id) model.toggleRowMenu(group.id);
            }
        });
    }
});

//--------------------------------------------------------------------------------------------
// Expanded member area: member rows + "Add to this group..." + inline picker.
//--------------------------------------------------------------------------------------------
const memberArea = hoistCmp.factory<GroupedItemChooserLocalModel>({
    render({model, group}) {
        const {parentModel} = model,
            locked = group.source === 'provided',
            editable = !locked && parentModel.enableGrouping;

        const rows = group.members.map((member, idx) =>
            memberRow({member, group, idx, editable, key: member.id})
        );

        return div({
            className: 'xh-grouped-item-chooser__members',
            items: [
                locked
                    ? fragment(...rows)
                    : droppable({
                          droppableId: model.groupDroppableId(group.id),
                          type: 'gic',
                          children: dndProps =>
                              div({
                                  ref: dndProps.innerRef,
                                  ...dndProps.droppableProps,
                                  items: [...rows, dndProps.placeholder]
                              })
                      }),
                div({
                    omit: !editable,
                    className: 'xh-grouped-item-chooser__add-member',
                    items: [Icon.plus(), ' Add to this group...'],
                    onClick: () => model.toggleGroupPicker(group.id)
                }),
                groupPicker({group, omit: model.groupPickerId !== group.id})
            ]
        });
    }
});

const memberRow = hoistCmp.factory<GroupedItemChooserLocalModel>({
    render({model, member, group, idx, editable}) {
        const {parentModel} = model,
            node = parentModel.itemNode(member, 'member', group),
            icon = parentModel.resolveIcon(node),
            color = parentModel.resolveColor(node),
            selRef = {type: 'member', groupId: group.id, item: member} as const,
            selected = model.isSelected(selRef),
            draggableEnabled = editable && parentModel.enableReordering;

        const rowContent = (dndProps = null, dndState = null) =>
            div({
                ref: dndProps?.innerRef,
                ...dndProps?.draggableProps,
                style: dndProps ? correctedDragStyle(model, dndProps, dndState) : null,
                className: classNames(
                    'xh-grouped-item-chooser__mrow',
                    selected ? 'xh-grouped-item-chooser__row--selected' : null,
                    dndState?.isDragging ? 'xh-grouped-item-chooser__row--dragging' : null
                ),
                items: [
                    editable
                        ? selectBox({selRef, selected})
                        : span({
                              omit: !parentModel.enableGrouping,
                              className: 'xh-grouped-item-chooser__row__select'
                          }),
                    draggableEnabled
                        ? span({
                              className: 'xh-grouped-item-chooser__row__lead',
                              item: Icon.grip({
                                  prefix: 'fal',
                                  className: 'xh-grouped-item-chooser__grip'
                              }),
                              ...dndProps?.dragHandleProps
                          })
                        : span({className: 'xh-grouped-item-chooser__row__lead'}),
                    span({
                        omit: !icon,
                        className: 'xh-grouped-item-chooser__member-icon',
                        style: {color},
                        item: icon
                    }),
                    div({
                        className: 'xh-grouped-item-chooser__row__name',
                        items: [
                            span({className: 'nm', item: member.label}),
                            span({omit: !member.sublabel, className: 'mt', item: member.sublabel})
                        ]
                    }),
                    span({
                        className: 'xh-grouped-item-chooser__row__right',
                        item: editable
                            ? removeBtn({
                                  onClick: () => parentModel.removeMember(group.id, member.id)
                              })
                            : null
                    })
                ]
            });

        return draggableEnabled
            ? draggable({
                  key: member.id,
                  draggableId: model.memberDraggableId(group.id, member.id),
                  index: idx,
                  children: (dndProps, dndState) => rowContent(dndProps, dndState)
              })
            : rowContent();
    }
});

//--------------------------------------------------------------------------------------------
// In-group typeahead picker.
//--------------------------------------------------------------------------------------------
const groupPicker = hoistCmp.factory<GroupedItemChooserLocalModel>({
    render({model, group}) {
        const sections = model.groupPickerSections,
            isEmptyPicker = sections.every(it => isEmpty(it.options));

        return div({
            className: 'xh-grouped-item-chooser__gpicker',
            items: [
                textInput({
                    bind: 'groupQuery',
                    model,
                    commitOnChange: true,
                    leftIcon: Icon.search(),
                    placeholder: 'Search...',
                    width: null,
                    autoFocus: true
                }),
                div({
                    className: 'xh-grouped-item-chooser__gpicker__list',
                    items: isEmptyPicker
                        ? [
                              div({
                                  className: 'xh-grouped-item-chooser__menu-empty',
                                  item: 'Everything is already in this group.'
                              })
                          ]
                        : sections.map(({kind, options}) =>
                              fragment({
                                  omit: isEmpty(options),
                                  key: kind.key,
                                  items: [
                                      menuSectionHeader({kind}),
                                      ...options.map(opt =>
                                          div({
                                              key: opt.id,
                                              className: 'xh-grouped-item-chooser__menu-opt',
                                              item: span({className: 'l', item: opt.label}),
                                              onMouseDown: e => {
                                                  e.preventDefault();
                                                  model.addToGroupFromOption(opt, kind, group.id);
                                              }
                                          })
                                      )
                                  ]
                              })
                          )
                })
            ]
        });
    }
});

//--------------------------------------------------------------------------------------------
// Selection action bar.
//--------------------------------------------------------------------------------------------
const selectionBar = hoistCmp.factory<GroupedItemChooserLocalModel>({
    render({model}) {
        const {parentModel, selectionCount} = model;
        if (!selectionCount) return null;

        return hbox({
            className: 'xh-grouped-item-chooser__selbar',
            items: [
                span({className: 'c', item: `${selectionCount} selected`}),
                filler(),
                popover({
                    omit: !model.showGroupButton,
                    isOpen: model.groupIntoOpen,
                    position: 'top',
                    minimal: true,
                    item: button({
                        text: 'Group...',
                        icon: groupActionIcon(),
                        rightIcon: Icon.angleDown(),
                        intent: 'primary',
                        disabled: model.groupButtonDisabled,
                        title: model.groupButtonDisabled ? 'Select one more to group' : null,
                        onClick: () => model.toggleGroupInto()
                    }),
                    content: menu({
                        items: [
                            menuDivider({title: 'Group into'}),
                            menuItem({
                                text: 'New group...',
                                icon: groupActionIcon(),
                                onClick: () => model.groupSelectionIntoNew()
                            }),
                            ...parentModel.userGroups.map(g =>
                                menuItem({
                                    text: parentModel.getGroupDisplayName(g),
                                    icon: Icon.users(),
                                    onClick: () => model.moveSelectionInto(g.id)
                                })
                            )
                        ]
                    }),
                    onInteraction: nextOpenState => {
                        if (!nextOpenState && model.groupIntoOpen) model.toggleGroupInto();
                    }
                }),
                button({
                    omit: !model.showMoveOutButton,
                    text: 'Move out',
                    icon: Icon.arrowUpFromBracket(),
                    onClick: () => model.moveSelectionOut()
                }),
                button({
                    text: 'Remove',
                    icon: Icon.x(),
                    minimal: true,
                    onClick: () => model.removeSelection()
                })
            ]
        });
    }
});

//--------------------------------------------------------------------------------------------
// Bottom add field + sectioned typeahead menu.
//--------------------------------------------------------------------------------------------
const addField = hoistCmp.factory<GroupedItemChooserLocalModel>({
    render({model, addPlaceholder, groupsSectionLabel}) {
        return div({
            className: 'xh-grouped-item-chooser__add',
            item: popover({
                isOpen: model.addMenuOpen,
                position: 'top-left',
                minimal: true,
                matchTargetWidth: true,
                // Keep focus in the target input - the menu is driven by typing, not tabbing.
                enforceFocus: false,
                autoFocus: false,
                shouldReturnFocusOnClose: false,
                popoverClassName: 'xh-grouped-item-chooser-menu-popover',
                item: div({
                    className: 'xh-grouped-item-chooser__add__target',
                    onFocus: () => model.openAddMenu(),
                    item: textInput({
                        bind: 'query',
                        model,
                        commitOnChange: true,
                        leftIcon: Icon.plus(),
                        placeholder: addPlaceholder,
                        width: null,
                        flex: 1
                    })
                }),
                content: addMenu({groupsSectionLabel}),
                onInteraction: (nextOpenState, e) => {
                    if (
                        !nextOpenState &&
                        e?.target &&
                        !elemWithin(e.target as HTMLElement, 'xh-grouped-item-chooser__add__target')
                    ) {
                        model.closeAllMenus();
                    }
                }
            })
        });
    }
});

const addMenu = hoistCmp.factory<GroupedItemChooserLocalModel>({
    render({model, groupsSectionLabel}) {
        const {providedGroupSection, addMenuSections, query} = model;

        if (model.addMenuIsEmpty) {
            return div({
                className: 'xh-grouped-item-chooser__menu',
                item: div({
                    className: 'xh-grouped-item-chooser__menu-empty',
                    item: `No matches for "${query}".`
                })
            });
        }

        return div({
            className: 'xh-grouped-item-chooser__menu',
            items: [
                fragment({
                    omit: isEmpty(providedGroupSection.defs),
                    items: [
                        div({
                            className: 'xh-grouped-item-chooser__menu-hd',
                            items: [Icon.users(), groupsSectionLabel]
                        }),
                        ...providedGroupSection.defs.map(({def, added}) =>
                            div({
                                key: def.id,
                                className: classNames(
                                    'xh-grouped-item-chooser__menu-opt',
                                    added ? 'xh-grouped-item-chooser__menu-opt--added' : null
                                ),
                                items: [
                                    span({className: 'l', item: def.label}),
                                    span({
                                        className: 'sub',
                                        item: `${def.members.length} items`
                                    })
                                ],
                                onMouseDown: e => {
                                    e.preventDefault();
                                    if (!added) model.addProvidedGroup(def.id);
                                }
                            })
                        )
                    ]
                }),
                ...addMenuSections.map(({kind, options}) =>
                    fragment({
                        omit: isEmpty(options),
                        key: kind.key,
                        items: [
                            menuSectionHeader({kind}),
                            ...options.map(opt =>
                                div({
                                    key: opt.id,
                                    className: classNames(
                                        'xh-grouped-item-chooser__menu-opt',
                                        opt.added
                                            ? 'xh-grouped-item-chooser__menu-opt--added'
                                            : null
                                    ),
                                    items: [
                                        span({className: 'l', item: opt.label}),
                                        span({
                                            omit: !opt.sublabel,
                                            className: 'sub',
                                            item: opt.sublabel
                                        })
                                    ],
                                    onMouseDown: e => {
                                        e.preventDefault();
                                        if (!opt.added) model.addItemFromOption(opt, kind);
                                    }
                                })
                            )
                        ]
                    })
                )
            ]
        });
    }
});

//--------------------------------------------------------------------------------------------
// Shared bits.
//--------------------------------------------------------------------------------------------
const menuSectionHeader = hoistCmp.factory<GroupedItemChooserLocalModel>({
    render({kind}) {
        return div({
            className: 'xh-grouped-item-chooser__menu-hd',
            items: [kind.icon, kind.label]
        });
    }
});

const selectBox = hoistCmp.factory<GroupedItemChooserLocalModel>({
    render({model, selRef, selected}) {
        if (!model.parentModel.enableGrouping) return null;
        return span({
            className: 'xh-grouped-item-chooser__row__select',
            item: div({
                className: classNames(
                    'xh-grouped-item-chooser__box',
                    selected ? 'xh-grouped-item-chooser__box--on' : null
                ),
                item: Icon.check(),
                onClick: () => model.toggleSelected(selRef)
            })
        });
    }
});

const gripOrSpacer = hoistCmp.factory<GroupedItemChooserLocalModel>({
    render({model, dndProps}) {
        const {enableReordering} = model.parentModel;
        return span({
            className: 'xh-grouped-item-chooser__row__lead',
            item: enableReordering
                ? Icon.grip({prefix: 'fal', className: 'xh-grouped-item-chooser__grip'})
                : null,
            ...dndProps.dragHandleProps
        });
    }
});

const iconChip = hoistCmp.factory({
    render({icon, color}) {
        if (!icon) return span({className: 'xh-grouped-item-chooser__row__chip-spacer'});
        return span({
            className: 'xh-grouped-item-chooser__chip',
            style: {color},
            item: icon
        });
    }
});

const removeBtn = hoistCmp.factory({
    render({onClick}) {
        return button({
            className: 'xh-grouped-item-chooser__row__remove',
            minimal: true,
            icon: Icon.x(),
            onClick
        });
    }
});

function transformCheck(checked: boolean) {
    return Icon.check({style: checked ? null : {visibility: 'hidden'}});
}

/**
 * In popover placement the panel is positioned via a CSS transform, which offsets the fixed
 * positioning applied to actively-dragged rows. Subtract the popover's translation while a row
 * is dragging or drop-animating - same workaround as Hoist's own GroupingChooser, per
 * https://github.com/atlassian/react-beautiful-dnd/issues/128.
 */
function correctedDragStyle(model: GroupedItemChooserLocalModel, dndProps, dndState) {
    const baseStyle = dndProps.draggableProps.style,
        popoverEl = model.popoverRef.current;
    if (!popoverEl || (!dndState.isDragging && !dndState.isDropAnimating)) return baseStyle;

    let rowValues = parseTransform(baseStyle.transform);
    const pPos = popoverEl.getBoundingClientRect();

    if (dndState.isDropAnimating) {
        const {x, y} = dndState.dropAnimation.moveTo;
        rowValues = [x, y];
    }

    if (isEmpty(rowValues)) return baseStyle;

    const x = rowValues[0] - pPos.left,
        y = rowValues[1] - pPos.top;
    return {...baseStyle, transform: `translate(${x}px, ${y}px)`};
}

/**
 * Extract integer values from a CSS transform string. Works for `translate` and `translate3d`,
 * e.g. `translate3d(250px, 150px, 0px)` -> `[250, 150, 0]`.
 */
function parseTransform(transformStr: string): number[] {
    return transformStr
        ?.replace('3d', '')
        .match(/[-]{0,1}[\d]*[.]{0,1}[\d]+/g)
        ?.map(it => parseInt(it));
}
