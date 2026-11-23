import {chip} from '@xh/hoist/cmp/chip';
import {grid} from '@xh/hoist/cmp/grid';
import {hframe, placeholder} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {RegistryModel} from './RegistryModel';
import {entryPage} from './RegistryPage';

/** The dashboard and answer registries: their entries by kind, beside the selected one's detail. */
export const registryPanel = hoistCmp.factory({
    displayName: 'RegistryPanel',
    model: creates(RegistryModel),

    render({model}) {
        const counts = model.originCounts;
        return hframe({
            className: 'tb-registry',
            children: [
                panel({
                    className: 'tb-registry__list',
                    modelConfig: {side: 'left', defaultSize: 320, minSize: 220, collapsible: false},
                    tbar: [
                        textInput({
                            bind: 'query',
                            placeholder: 'Search entries',
                            leftIcon: Icon.search(),
                            commitOnChange: true,
                            enableClear: true,
                            flex: 1
                        })
                    ],
                    children: [
                        toolbar({
                            className: 'tb-registry__origins',
                            children: ORIGINS.map(([value, text]) =>
                                chip({
                                    key: value,
                                    outlined: true,
                                    intent: 'primary',
                                    active: model.origins.includes(value),
                                    onClick: () => model.toggleOrigin(value),
                                    children: `${text} ${counts[value]}`
                                })
                            )
                        }),
                        grid({model: model.listModel})
                    ]
                }),
                model.selected ? entryPage() : placeholder('Pick an entry.')
            ]
        });
    }
});

const ORIGINS = [
    ['built-in', 'Built-in'],
    ['chat kit', 'Chat kit'],
    ['app', 'App']
] as const;
