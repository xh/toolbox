import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {filler, hbox, hframe, hspacer, span} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {ValidationState} from '@xh/hoist/data';
import {button} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {wrapper} from '../../common';
import {gridOptionsPanel} from '../../common/grid/options/GridOptionsPanel';
import './InlineEditingPanel.scss';
import {InlineEditingPanelModel} from './InlineEditingPanelModel';
import React from 'react';

export const inlineEditingPanel = hoistCmp.factory({
    model: creates(InlineEditingPanelModel),

    render({model}) {
        return wrapper({
            description: [
                <p>
                    Grids support inline editing of their underlying store records. To enable, set{' '}
                    <code>editable:true</code> on columns that should allow editing and (optionally)
                    configure a type-appropriate editor.
                </p>,
                <p>
                    The <code>Column.editable</code> config also takes a function, allowing
                    field-level editing to be conditional based upon the data or some other state,
                    as demonstrated in the example below. This example also applies a custom style
                    to highlight the editable cells in the grid, which are given the{' '}
                    <code>.xh-cell--editable</code> CSS class by the toolkit.
                </p>,
                <p>
                    Store fields can be configured with validation rules, much like forms, allowing
                    the application to require resolution before persisting to the back-end. Cells
                    with invalid values are styled with a red corner flag by default. (Try setting a
                    negative amount in any row to test.)
                </p>
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/grids/InlineEditingPanel.tsx',
                    notes: 'This example.'
                }
            ],
            item: panel({
                title: 'Grids › Inline Editing',
                icon: Icon.edit(),
                className: `tb-grid-wrapper-panel tb-inline-editing-panel ${
                    model.fullRowEditing ? 'tb-inline-editing-panel--fullRow' : ''
                }`,
                tbar: tbar(),
                item: hframe(grid(), gridOptionsPanel()),
                bbar: bbar()
            })
        });
    }
});

const tbar = hoistCmp.factory<InlineEditingPanelModel>(({model}) => {
    const {store, gridModel} = model;
    return toolbar(
        button({
            icon: Icon.add(),
            text: 'Add',
            onClick: () => model.add(1)
        }),
        button({
            icon: Icon.add(),
            text: 'Add 5',
            onClick: () => model.add(5)
        }),
        button({
            icon: Icon.add(),
            text: 'Add 1k',
            onClick: () => model.add(1000)
        }),
        button({
            icon: Icon.add(),
            text: 'Add 10k',
            onClick: () => model.add(10000)
        }),
        '-',
        button({
            icon: Icon.edit(),
            text: 'First Row',
            onClick: () => model.beginEditAsync()
        }),
        button({
            icon: Icon.edit(),
            text: 'First Row (Amount)',
            onClick: () => model.beginEditAsync({colId: 'amount'})
        }),
        '-',
        button({
            icon: Icon.stopCircle(),
            text: 'Stop Editing',
            onClick: () => model.endEditAsync(),
            disabled: !gridModel.isEditing
        }),
        '-',
        button({
            icon: Icon.check(),
            text: 'Commit All',
            intent: 'success',
            onClick: () => model.commitAllAsync(),
            disabled: !store.isModified
        }),
        button({
            icon: Icon.undo(),
            text: 'Revert All',
            intent: 'primary',
            onClick: () => model.revert(),
            disabled: !store.isModified
        }),
        filler(),
        storeDirtyIndicator(),
        '-',
        storeValidIndicator()
    );
});

const storeDirtyIndicator = hoistCmp.factory<InlineEditingPanelModel>(({model}) => {
    const {isModified} = model.store;
    return hbox({
        className: isModified ? 'xh-intent-warning' : 'xh-intent-success',
        alignItems: 'center',
        items: [
            isModified ? Icon.circle() : Icon.checkCircle(),
            hspacer(5),
            'Store ' + (isModified ? 'Dirty' : 'Clean')
        ]
    });
});

const storeValidIndicator = hoistCmp.factory<InlineEditingPanelModel>(({model}) => {
    const {isPending, validationState, errorCount} = model.store.validator;
    let icon, label, className;
    if (isPending) {
        icon = Icon.questionCircle();
        label = 'Validation pending';
        className = 'xh-text-color-muted';
    } else {
        switch (validationState) {
            case ValidationState.Valid:
                icon = Icon.checkCircle();
                label = 'Valid';
                className = 'xh-intent-success';
                break;
            case ValidationState.NotValid:
                icon = Icon.xCircle();
                label = `Not Valid (${errorCount} errors)`;
                className = 'xh-intent-danger';
                break;
            default:
                icon = Icon.questionCircle();
                label = 'Validation state unknown';
                className = 'xh-text-color-muted';
                break;
        }
    }

    return hbox({
        className,
        alignItems: 'center',
        items: [icon, hspacer(5), label]
    });
});

const bbar = hoistCmp.factory<InlineEditingPanelModel>(({model}) => {
    return toolbar(
        switchInput({
            bind: 'fullRowEditing',
            label: 'Full-row editing',
            labelSide: 'left'
        }),
        '-',
        switchInput({
            bind: 'asyncValidation',
            label: 'Async validation',
            labelSide: 'left'
        }),
        '-',
        span('Edit with: '),
        buttonGroupInput({
            bind: 'clicksToEdit',
            outlined: true,
            items: [
                button({text: '2 clicks', value: 2}),
                button({text: '1 click', value: 1}),
                button({text: 'disabled', value: -1})
            ]
        }),
        hspacer(),
        span(`${model.clicksToEditNote}`),
        filler(),
        gridCountLabel()
    );
});
