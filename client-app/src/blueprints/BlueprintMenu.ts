import {blueprintLinkUrl} from '@xh/hoist-chat-kit/blueprint';
import type {BlueprintAccessSpec} from '@xh/hoist-chat-kit/blueprint';
import {div, vbox} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import type {HoistProps} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {menu, menuDivider, menuItem, popover} from '@xh/hoist/kit/blueprint';
import {BlueprintShellModel} from './BlueprintShellModel';
import {showBlueprintsHelp} from './blueprintsHelp';
import {libraryGroup} from './libraryColumns';
import {copyLinkAsync} from './copyLink';

/** The open blueprint's other actions: copy its link, share, copy, delete, a reader's views, and help. */
export const blueprintMenu = hoistCmp.factory<BlueprintShellModel>({
    model: uses(BlueprintShellModel),
    render: ({model}) =>
        popover({
            isOpen: model.shareOpen,
            onInteraction: open => {
                if (!open) model.shareOpen = false;
            },
            position: 'bottom-right',
            content: sharePanel(),
            children: popover({
                position: 'bottom-right',
                children: button({icon: Icon.ellipsisVertical(), minimal: true, tooltip: 'More'}),
                // Its own observer, drawn only while open, as what it reads changes with each save.
                content: menuItems()
            })
        })
});

const menuItems = hoistCmp.factory<BlueprintShellModel>({
    model: uses(BlueprintShellModel),
    render: ({model}) => {
        const doc = model.documentModel,
            link = model.route ? blueprintLinkUrl(doc, model.route) : null,
            canShare = model.canEdit && doc.canShare,
            isOwn = model.selected && libraryGroup(model.selected) === 'Yours',
            // A reader has no view bar, so the views are here.
            isReader = doc.document?.access === 'read';
        return menu(
            menuItem({
                text: 'Copy link',
                icon: Icon.link(),
                omit: !link,
                onClick: () => copyLinkAsync(link)
            }),
            menuItem({
                text: 'Share...',
                icon: doc.document?.sharing?.readers.includes('*') ? Icon.globe() : Icon.users(),
                omit: !canShare,
                onClick: () => (model.shareOpen = true)
            }),
            menuItem({
                text: 'Make a copy',
                icon: Icon.copy(),
                onClick: () => model.copySelectedAsync()
            }),
            menuItem({
                text: 'Rename...',
                icon: Icon.edit(),
                omit: !doc.canRename,
                onClick: () => model.renameSelectedAsync()
            }),
            menuItem({
                text: 'Delete',
                icon: Icon.delete(),
                intent: 'danger',
                omit: !isOwn,
                onClick: () => model.deleteSelectedAsync()
            }),
            menuDivider({omit: !isReader}),
            menuItem({
                text: 'Show the map',
                icon: Icon.treeList(),
                omit: !isReader,
                onClick: () => (model.editorView = 'map')
            }),
            menuItem({
                text: 'Show the JSON',
                icon: Icon.code(),
                omit: !isReader,
                onClick: () => (model.editorView = 'json')
            }),
            menuDivider(),
            menuItem({
                text: 'How Blueprints work',
                icon: Icon.questionCircle(),
                onClick: () => showBlueprintsHelp()
            })
        );
    }
});

/** Who may see and edit the blueprint open. */
const sharePanel = hoistCmp.factory<BlueprintShellModel>({
    model: uses(BlueprintShellModel),
    render: ({model}) => {
        const doc = model.documentModel,
            sharing: BlueprintAccessSpec = doc.document?.sharing ?? {writers: [], readers: []},
            modes = doc.sharingModes,
            everyone = sharing.readers.includes('*'),
            named = (list: string[]) => list.filter(it => it !== '*'),
            update = (spec: BlueprintAccessSpec) => model.updateAccessAsync(spec).catchDefault(),
            grantees = modes.includes('users') || modes.includes('roles');

        return vbox({
            className: 'tb-blueprints__share',
            children: [
                switchInput({
                    label: 'Everyone can view',
                    omit: !doc.canShareGlobally || !modes.includes('everyone'),
                    value: everyone,
                    onChange: on =>
                        update({
                            writers: sharing.writers,
                            readers: on ? [...named(sharing.readers), '*'] : named(sharing.readers)
                        })
                }),
                granteeSelect({
                    omit: !grantees,
                    label: 'Can edit',
                    value: sharing.writers,
                    onCommit: writers => update({writers, readers: sharing.readers})
                }),
                granteeSelect({
                    omit: !grantees,
                    label: 'Can view',
                    value: named(sharing.readers),
                    onCommit: readers =>
                        update({
                            writers: sharing.writers,
                            readers: everyone ? [...readers, '*'] : readers
                        })
                }),
                div({
                    className: 'tb-blueprints__share-note',
                    children: 'Others see its published versions, never your draft.'
                })
            ]
        });
    }
});

interface GranteeSelectProps extends HoistProps {
    label: string;
    value: string[];
    onCommit: (v: string[]) => void;
}

const granteeSelect = hoistCmp.factory<GranteeSelectProps>({
    model: false,
    render({label, value, onCommit}) {
        return vbox(
            div({className: 'tb-blueprints__share-label', children: label}),
            select({
                value,
                enableMulti: true,
                enableCreate: true,
                options: value,
                placeholder: 'A username, or role:ROLE',
                width: 280,
                onCommit: (v: string[]) => onCommit(v ?? [])
            })
        );
    }
});
