import {creates, hoistCmp} from '@xh/hoist/core';
import {InlineEditingPanelModel} from './InlineEditingPanelModel';
import {grid} from '@xh/hoist/cmp/grid';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {hbox, hspacer, filler, hframe, span} from '@xh/hoist/cmp/layout';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {ValidationState} from '@xh/hoist/data';
import {wrapper} from '../../common';
import {gridOptionsPanel} from '../../common/grid/options/GridOptionsPanel';

export const inlineEditingPanel = hoistCmp.factory({
    model: creates(InlineEditingPanelModel),
    render({model}) {
        return wrapper({
            description: [
                <p>
                    Grids support inline editing of its underlying store records. To enable, set an appropriate
                    editor per column.

                    Grid will also show the validation state of any pending records, allowing the application to
                    require resolution before persisting to the back-end.
                </p>
            ],
            item: panel({
                title: 'Grids › Inline Editing',
                icon: Icon.edit(),
                className: 'tb-grid-wrapper-panel',
                tbar: [
                    button({
                        icon: Icon.add(),
                        text: 'Add',
                        intent: 'success',
                        onClick: () => model.add()
                    }),
                    button({
                        icon: Icon.add(),
                        text: 'Add 5',
                        intent: 'success',
                        onClick: () => model.addFive(0)
                    }),
                    button({
                        icon: Icon.check(),
                        text: 'Commit All',
                        intent: 'success',
                        onClick: () => model.commitAllAsync(),
                        disabled: !model.store.isModified
                    }),
                    button({
                        icon: Icon.undo(),
                        text: 'Revert All',
                        intent: 'primary',
                        onClick: () => model.revert(),
                        disabled: !model.store.isModified
                    }),
                    toolbarSep(),
                    storeDirtyIndicator(),
                    toolbarSep(),
                    storeValidIndicator(),
                    filler(),
                    switchInput({
                        bind: 'fullRowEditing',
                        label: 'Full row Editing',
                        labelSide: 'left'
                    }),
                    toolbarSep(),
                    switchInput({
                        bind: 'asyncValidation',
                        label: 'Async Validation',
                        labelSide: 'left'
                    }),
                    toolbarSep(),
                    span('Clicks To Edit'),
                    select({
                        bind: 'clicksToEdit',
                        options: [2, 1, 0],
                        width: 45
                    })
                ],
                item: hframe(
                    grid({
                        key: model.gridModel.xhId,
                        model: model.gridModel
                    }),
                    gridOptionsPanel()
                )
            })
        });
    }
});

const storeDirtyIndicator = hoistCmp.factory(
    ({model}) => {
        const {isModified} = model.store;
        return hbox({
            alignItems: 'center',
            style: {
                color: isModified ? 'var(--xh-intent-warning)' : 'var(--xh-intent-success)'
            },
            items: [
                isModified ? Icon.circle() : Icon.checkCircle(),
                hspacer(5),
                'Store ' + (isModified ? 'Dirty' : 'Clean')
            ]
        });
    }
);

const storeValidIndicator = hoistCmp.factory(
    ({model}) => {
        const {isPending, validationState, errorCount} = model.store.validator;
        let icon, label, color;
        if (isPending) {
            icon = Icon.questionCircle();
            label = 'Validation pending';
            color = 'var(--xh-text-color-muted)';
        } else {
            switch (validationState) {
                case ValidationState.Valid:
                    icon = Icon.checkCircle();
                    label = 'Valid';
                    color = 'var(--xh-intent-success)';
                    break;
                case ValidationState.NotValid:
                    icon = Icon.xCircle();
                    label = `Not Valid (${errorCount} errors)`;
                    color = 'var(--xh-intent-warning)';
                    break;
                default:
                    icon = Icon.questionCircle();
                    label = 'Validation state unknown';
                    color = 'var(--xh-text-color-muted)';
                    break;
            }
        }

        return hbox({
            alignItems: 'center',
            style: {color},
            items: [icon, hspacer(5), label]
        });
    }
);
