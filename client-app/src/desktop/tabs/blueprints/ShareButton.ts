import type {BlueprintAccessSpec} from '@xh/hoist-chat-kit/blueprint';
import {div, vbox} from '@xh/hoist/cmp/layout';
import {hoistCmp} from '@xh/hoist/core';
import type {HoistProps} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {popover} from '@xh/hoist/kit/blueprint';
import type {BlueprintsPanelModel} from './BlueprintsPanelModel';

/** Who may see and edit the blueprint open, for a user who may share it. */
export const shareButton = hoistCmp.factory<BlueprintsPanelModel>(({model}) => {
    const doc = model.documentModel,
        sharing: BlueprintAccessSpec = doc.document?.sharing ?? {writers: [], readers: []},
        modes = doc.sharingModes,
        everyone = sharing.readers.includes('*'),
        named = (list: string[]) => list.filter(it => it !== '*'),
        update = (spec: BlueprintAccessSpec) => model.updateAccessAsync(spec).catchDefault(),
        grantees = modes.includes('users') || modes.includes('roles');

    return popover({
        omit: !doc.canShare,
        position: 'bottom-right',
        children: button({
            text: 'Share',
            icon: everyone ? Icon.globe() : Icon.users()
        }),
        content: vbox({
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
        })
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
