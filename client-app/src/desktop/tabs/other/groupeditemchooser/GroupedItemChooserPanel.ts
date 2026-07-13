import {chart} from '@xh/hoist/cmp/chart';
import {filler, hframe, vframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {wrapper, wrapperOption} from '../../../common';
import {groupedItemChooser} from '../../../cmp/groupeditemchooser';
import {GroupedItemChooserPanelModel} from './GroupedItemChooserPanelModel';

export const groupedItemChooserPanel = hoistCmp.factory({
    model: creates(GroupedItemChooserPanelModel),

    render({model}) {
        return wrapper({
            title: 'GroupedItemChooser',
            icon: Icon.users(),
            statusTag: {
                label: 'Incubating in Toolbox',
                info: 'Unlike other examples, this component is authored and maintained within Toolbox itself as a candidate pattern - it is not (yet) part of hoist-react.'
            },
            description: [
                '`GroupedItemChooser` is a general, domain-neutral item/series picker + grouper.',
                'Users assemble an ordered comparison set of leaf items, optionally organize them',
                'into single-level groups with per-group transforms, and order everything - the',
                'backing model emits a structured, ordered, colored `value`.',
                '',
                'Leaf item *kinds* are injected (here: companies + benchmark indices), transforms',
                'are a developer-supplied library the component records but never computes, and',
                'host-supplied *provided groups* are membership-locked - duplicate one as an',
                'editable copy to modify it. The same item may appear in multiple groups and/or',
                'at the top level: the component never dedupes.',
                '',
                'The chart is an *example consumer* of the emitted `value` - it is not part of',
                'the component, and owns the flatten of grouped items into plotted series.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/cmp/groupeditemchooser/GroupedItemChooser.ts',
                    notes: 'The component.'
                },
                {
                    url: '$TB/client-app/src/desktop/cmp/groupeditemchooser/GroupedItemChooserModel.ts',
                    notes: 'Backing model - state, actions, and the observable value.'
                },
                {
                    url: '$TB/client-app/src/desktop/tabs/other/groupeditemchooser/GroupedItemChooserPanel.ts',
                    notes: 'This example.'
                }
            ],
            options: [
                wrapperOption({
                    label: 'Grouping',
                    propName: 'enableGrouping',
                    control: switchInput({bind: 'enableGrouping'})
                }),
                wrapperOption({
                    label: 'Reordering',
                    propName: 'enableReordering',
                    control: switchInput({bind: 'enableReordering'})
                }),
                wrapperOption({
                    label: 'Transforms',
                    propName: 'transforms',
                    control: switchInput({bind: 'supportTransforms'})
                }),
                wrapperOption({
                    label: 'Benchmark kind',
                    propName: 'kinds',
                    control: switchInput({bind: 'supportBenchmarks'})
                }),
                wrapperOption({
                    label: 'Provided groups',
                    propName: 'providedGroups',
                    control: switchInput({bind: 'showSavedGroups'})
                }),
                wrapperOption({
                    label: 'Placement',
                    propName: 'displayMode',
                    control: select({
                        bind: 'displayMode',
                        width: 120,
                        enableFilter: false,
                        options: [
                            {label: 'Inline', value: 'inline'},
                            {label: 'Popover', value: 'popover'}
                        ]
                    })
                })
            ],
            item: panel({
                title: 'Compare Builder',
                icon: Icon.users(),
                width: 1000,
                height: 620,
                item: model.displayMode === 'inline' ? inlineLayout() : popoverLayout()
            })
        });
    }
});

const inlineLayout = hoistCmp.factory<GroupedItemChooserPanelModel>({
    render({model}) {
        return hframe(
            groupedItemChooser({
                model: model.chooserModel,
                title: 'Compare against',
                hint: 'Add below (to top level). Select rows to Group / Add to / Move; or drag a row onto a group to move it in. Provided groups are locked.',
                addPlaceholder: 'Add company, benchmark, group...',
                groupsSectionLabel: 'Peer groups',
                width: 340,
                style: {borderRight: 'var(--xh-border-solid)'}
            }),
            chartPanel()
        );
    }
});

const popoverLayout = hoistCmp.factory<GroupedItemChooserPanelModel>({
    render({model}) {
        return vframe(
            toolbar(
                filler(),
                groupedItemChooser({
                    model: model.chooserModel,
                    buttonText: 'Compare',
                    addPlaceholder: 'Add company, benchmark, group...',
                    groupsSectionLabel: 'Peer groups'
                })
            ),
            chartPanel()
        );
    }
});

const chartPanel = hoistCmp.factory<GroupedItemChooserPanelModel>({
    render({model}) {
        return panel({
            title: 'Total Shareholder Return - indexed to 100 - schematic',
            icon: Icon.chartLine(),
            compactHeader: true,
            flex: 1,
            item: chart({model: model.chartModel})
        });
    }
});
