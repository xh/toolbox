import {filler, span} from '@xh/hoist/cmp/layout';
import {hoistCmp} from '@xh/hoist/core';
import type {HoistProps} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {jsonInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import type {InspectorModel} from './InspectorModel';

interface InspectorJsonProps extends HoistProps {
    inspector: InspectorModel;
}

/** The open blueprint's JSON, to edit and apply in place. */
export const inspectorJson = hoistCmp.factory<InspectorJsonProps>({
    displayName: 'InspectorJson',
    model: false,

    render({inspector}) {
        const {applyError, isDirty} = inspector;
        return panel({
            item: jsonInput({
                model: inspector,
                bind: 'draft',
                commitOnChange: true,
                flex: 1,
                width: '100%'
            }),
            bbar: [
                applyError ? span({className: 'xh-intent-danger', item: applyError}) : null,
                filler(),
                button({
                    text: 'Revert',
                    icon: Icon.reset(),
                    disabled: !isDirty,
                    onClick: () => inspector.revertDraft()
                }),
                button({
                    text: 'Apply',
                    icon: Icon.check(),
                    intent: 'primary',
                    disabled: !isDirty,
                    onClick: () => inspector.applyDraft()
                })
            ]
        });
    }
});
