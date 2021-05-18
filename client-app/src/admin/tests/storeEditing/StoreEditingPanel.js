import {creates, hoistCmp} from '@xh/hoist/core';
import {StoreEditingPanelModel} from './StoreEditingPanelModel';
import {grid} from '@xh/hoist/cmp/grid';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {hbox, hspacer, filler} from '@xh/hoist/cmp/layout';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {ValidationState} from '@xh/hoist/data';

export const StoreEditingPanel = hoistCmp({
    model: creates(StoreEditingPanelModel),
    render({model}) {
        return panel({
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
                    bind: 'asyncValidation',
                    label: 'Async Validation?'
                })
            ],
            item: grid()
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
        const {isValidationPending, validationState, errorCount} = model.store;
        let icon, label, color;
        if (isValidationPending) {
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