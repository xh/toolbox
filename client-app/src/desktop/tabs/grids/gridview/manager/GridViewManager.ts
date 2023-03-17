import {div, fragment, hbox, vbox} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon/Icon';
import {menu, menuDivider, menuItem, popover} from '@xh/hoist/kit/blueprint';
import {groupBy, keys, sortBy} from 'lodash';
import {manageDialog} from './impl/ManageDialog';
import {saveDialog} from './impl/SaveDialog';
import './GridViewManager.scss';
import {GridViewManagerModel} from './GridViewManagerModel';
import {StoreRecord} from '@xh/hoist/data';
import {ReactNode} from 'react';

export const gridViewManager = hoistCmp.factory<GridViewManagerModel>({
    displayName: 'GridViewManager',
    model: uses(GridViewManagerModel),

    render({model}) {
        const {selectedView, isPrivate, capitalPluralNoun, manageDialogModel, saveDialogModel} =
            model;

        return fragment(
            hbox({
                className: 'tb-gridview-mgr',
                items: [
                    popover({
                        interactionKind: 'click',
                        popoverClassName: 'tb-gridview-mgr-popover xh-popup--framed',
                        item: button({
                            text: selectedView?.data.name
                                ? getHierarchyDisplayName(selectedView.data.name)
                                : capitalPluralNoun,
                            icon: isPrivate ? Icon.bookmark() : Icon.users(),
                            rightIcon: Icon.chevronDown(),
                            outlined: true
                        }),
                        content: vbox({
                            className: 'tb-gridview-mgr-vbox',
                            items: [
                                div({className: 'xh-popup__title', item: capitalPluralNoun}),
                                objMenu()
                            ]
                        })
                    }),
                    saveButton()
                ]
            }),
            manageDialogModel ? manageDialog() : null,
            saveDialogModel ? saveDialog() : null
        );
    }
});

const saveButton = hoistCmp.factory<GridViewManagerModel>({
    render({model}) {
        return button({
            icon: Icon.save(),
            tooltip: `Save changes to this ${model.noun}`,
            intent: 'primary',
            omit: !model.enableTopLevelSaveButton || !model.canSave,
            onClick: () => model.saveAsync(null).linkTo(model.loadModel)
        });
    }
});

const objMenu = hoistCmp.factory<GridViewManagerModel>({
    render({model}) {
        const {pluralNoun, views, loadModel} = model,
            grouped = groupBy(views, it => it.data.group),
            sortedGroupKeys = keys(grouped).sort(),
            items = [];

        sortedGroupKeys.forEach(group => {
            items.push(menuDivider({title: group}));
            items.push(...hierarchicalMenus(sortBy(grouped[group], 'data.name')));
        });

        return menu({
            className: 'tb-gridview-mgr__menu',
            items: [
                ...items,
                menuDivider(),
                menuItem({
                    icon: Icon.plus(),
                    text: 'New...',
                    onClick: () => model.createNewAsync().linkTo(loadModel)
                }),
                menuItem({
                    icon: Icon.save(),
                    text: 'Save',
                    disabled: !model.canSave,
                    onClick: () => model.saveAsync(null).linkTo(loadModel)
                }),
                menuItem({
                    icon: Icon.copy(),
                    text: 'Save as...',
                    onClick: () => model.saveAsAsync().linkTo(loadModel)
                }),
                menuItem({
                    icon: Icon.reset(),
                    text: 'Reset',
                    disabled: !model.isDirty,
                    onClick: () => model.resetAsync().linkTo(loadModel)
                }),
                menuDivider(),
                menuItem({
                    icon: Icon.gear(),
                    text: `Manage ${pluralNoun}...`,
                    onClick: () => model.openManageDialog()
                })
            ]
        });
    }
});

function hierarchicalMenus(records: StoreRecord[], depth: number = 0): ReactNode[] {
    const groups = {},
        unbalancedStableGroupsAndRecords = [];

    records.forEach(record => {
        // Leaf Node
        if (getNameHierarchySubstring(record.data.name, depth + 1) == null) {
            unbalancedStableGroupsAndRecords.push(record);
            return;
        }
        // Belongs to an already defined group
        const group = getNameHierarchySubstring(record.data.name, depth);
        if (groups[group]) {
            groups[group].children.push(record);
            return;
        }
        // Belongs to a not defined group, create it
        groups[group] = {name: group, children: [record], isMenuFolder: true};
        unbalancedStableGroupsAndRecords.push(groups[group]);
    });

    return unbalancedStableGroupsAndRecords.map(it => {
        if (it.isMenuFolder) {
            return objMenuFolder({
                name: it.name,
                items: hierarchicalMenus(it.children, depth + 1),
                depth
            });
        }
        return objMenuItem({record: it});
    });
}

const objMenuFolder = hoistCmp.factory<GridViewManagerModel>({
    render({model, name, depth, children}) {
        const selected = isFolderForEntry(name, model.selectedView.data?.name, depth),
            icon = selected ? Icon.check() : Icon.placeholder();
        return menuItem({
            text: getHierarchyDisplayName(name),
            icon,
            shouldDismissPopover: false,
            children
        });
    }
});

const objMenuItem = hoistCmp.factory<GridViewManagerModel>({
    render({model, record}) {
        const {id, name} = record.data,
            selected = model.selectedId === id,
            icon = selected ? Icon.check() : Icon.placeholder();

        return menuItem({
            key: id,
            icon: icon,
            text: getHierarchyDisplayName(name),
            onClick: () => model.selectAsync(id).linkTo(model.loadModel)
        });
    }
});

function isFolderForEntry(folderName, entryName, depth) {
    const name = getNameHierarchySubstring(entryName, depth);
    return name && name === folderName && folderName.length < entryName.length;
}

function getNameHierarchySubstring(name, depth) {
    const arr = name?.split('\\') ?? [];
    if (arr.length <= depth) {
        return null;
    }
    return arr.slice(0, depth + 1).join('\\');
}

function getHierarchyDisplayName(name) {
    return name?.substring(name.lastIndexOf('\\') + 1);
}
