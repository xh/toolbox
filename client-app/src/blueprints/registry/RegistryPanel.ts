import {badge} from '@xh/hoist/cmp/badge';
import {grid} from '@xh/hoist/cmp/grid';
import {div, filler, hbox, hframe, placeholder, span, vbox} from '@xh/hoist/cmp/layout';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {creates, hoistCmp, uses} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {md} from '../markdown';
import {RegistryModel} from './RegistryModel';

/** The dashboard and answer registries: their entries by kind, beside the selected one's detail. */
export const registryPanel = hoistCmp.factory({
    displayName: 'RegistryPanel',
    model: creates(RegistryModel),

    render({model}) {
        return panel({
            className: 'tb-registry',
            tbar: [
                buttonGroupInput({
                    bind: 'context',
                    children: [
                        button({value: 'dashboard', text: 'Dashboard'}),
                        button({value: 'answer', text: 'Answers'})
                    ]
                }),
                toolbarSep(),
                buttonGroupInput({
                    bind: 'origins',
                    enableMulti: true,
                    children: [
                        button({value: 'built-in', text: 'Built-in'}),
                        button({value: 'chat kit', text: 'Chat kit'}),
                        button({value: 'app', text: 'App'})
                    ]
                })
            ],
            children: hframe(
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
                    children: grid({model: model.listModel})
                }),
                model.selected ? entryDetail() : placeholder('Pick an entry.')
            )
        });
    }
});

const entryDetail = hoistCmp.factory<RegistryModel>({
    model: uses(RegistryModel),
    render: ({model}) => {
        const entry = model.selected,
            {spec} = entry,
            name = entry.kind === 'presentation' ? `${entry.widget}.${entry.name}` : entry.name,
            draft = model.panelModel.draftName,
            description = spec.description ?? spec.guidance;
        return panel({
            className: 'tb-registry__detail',
            children: [
                vbox({
                    className: 'tb-registry__header',
                    children: [
                        hbox({
                            className: 'tb-registry__title',
                            children: [
                                span({className: 'tb-registry__name', children: name}),
                                entry.label && entry.label !== name
                                    ? span({
                                          className: 'tb-registry__label-text',
                                          children: entry.label
                                      })
                                    : null,
                                badge({compact: true, children: entry.origin}),
                                badge({compact: true, children: entry.kind}),
                                filler(),
                                button({
                                    text: `Add to ${draft}`,
                                    icon: Icon.add(),
                                    intent: 'primary',
                                    minimal: false,
                                    omit: !model.canAddToDraft,
                                    onClick: () => model.addToDraft()
                                }),
                                button({
                                    text: 'New blueprint from example',
                                    icon: Icon.copy(),
                                    omit: !(
                                        model.context === 'dashboard' &&
                                        entry.kind === 'widget' &&
                                        spec.example
                                    ),
                                    onClick: () => model.loadExample()
                                })
                            ]
                        }),
                        description
                            ? div({
                                  className: 'tb-registry__description',
                                  children: md(description)
                              })
                            : null
                    ]
                }),
                tabContainer({model: model.detailTabsModel})
            ]
        });
    }
});
