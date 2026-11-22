import {blueprintLinkUrl} from '@xh/hoist-chat-kit/blueprint';
import type {BlueprintAccessSpec} from '@xh/hoist-chat-kit/blueprint';
import {div, vbox} from '@xh/hoist/cmp/layout';
import {hoistCmp} from '@xh/hoist/core';
import type {HoistProps} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {menu, menuDivider, menuItem, popover} from '@xh/hoist/kit/blueprint';
import type {BlueprintShellModel} from './BlueprintShellModel';
import {copyLinkAsync} from './copyLink';

/**
 * The open blueprint's secondary actions: reload or save a stale draft as new, copy its link, and
 * share it. Its button turns to a warning while the draft is stale.
 */
export const blueprintMenu = hoistCmp.factory<BlueprintShellModel>(({model}) => {
    const doc = model.documentModel,
        stale = doc.isStale,
        link = model.route ? blueprintLinkUrl(doc, model.route) : null,
        canShare = model.canEdit && doc.canShare;

    if (!stale && !link && !canShare) return null;
    return popover({
        isOpen: model.shareOpen,
        onInteraction: open => {
            if (!open) model.shareOpen = false;
        },
        position: 'bottom-right',
        content: sharePanel(),
        item: popover({
            position: 'bottom-right',
            item: button({
                icon: stale ? Icon.warning() : Icon.ellipsisVertical(),
                intent: stale ? 'warning' : null,
                tooltip: stale ? 'Changed elsewhere - reload, or save as new' : 'More'
            }),
            content: menu(
                menuItem({
                    text: 'Reload',
                    icon: Icon.refresh(),
                    title: 'Open the draft as it was saved elsewhere, discarding your edits here',
                    omit: !stale,
                    onClick: () => model.reloadDraftAsync()
                }),
                menuItem({
                    text: 'Save as new',
                    icon: Icon.copy(),
                    title: 'Keep your edits here as a new blueprint',
                    intent: 'primary',
                    omit: !stale,
                    onClick: () => model.saveAsNewSelectedAsync()
                }),
                menuDivider({omit: !stale || (!link && !canShare)}),
                menuItem({
                    text: 'Copy link',
                    icon: Icon.link(),
                    omit: !link,
                    onClick: () => copyLinkAsync(link)
                }),
                menuItem({
                    text: 'Share...',
                    icon: doc.document?.sharing?.readers.includes('*')
                        ? Icon.globe()
                        : Icon.users(),
                    omit: !canShare,
                    onClick: () => (model.shareOpen = true)
                })
            )
        })
    });
});

/** Who may see and edit the blueprint open. */
const sharePanel = hoistCmp.factory<BlueprintShellModel>(({model}) => {
    const doc = model.documentModel,
        sharing: BlueprintAccessSpec = doc.document?.sharing ?? {writers: [], readers: []},
        modes = doc.sharingModes,
        everyone = sharing.readers.includes('*'),
        named = (list: string[]) => list.filter(it => it !== '*'),
        update = (spec: BlueprintAccessSpec) => model.updateAccessAsync(spec).catchDefault(),
        grantees = modes.includes('users') || modes.includes('roles');

    return vbox({
        className: 'tb-blueprints__share',
        items: [
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
                item: 'Others see its published versions, never your draft.'
            })
        ]
    });
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
            div({className: 'tb-blueprints__share-label', item: label}),
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
