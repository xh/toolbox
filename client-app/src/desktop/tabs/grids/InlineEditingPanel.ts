import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {filler, hbox, hspacer, span} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {ValidationState} from '@xh/hoist/data';
import {button, buttonGroup} from '@xh/hoist/desktop/cmp/button';
import {segmentedControl, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {wrapper, wrapperOption} from '../../common';
import './InlineEditingPanel.scss';
import {InlineEditingPanelModel} from './InlineEditingPanelModel';
import classNames from 'classnames';

export const inlineEditingPanel = hoistCmp.factory({
    model: creates(InlineEditingPanelModel),

    render({model}) {
        return wrapper({
            title: 'Inline Editing',
            icon: Icon.edit(),
            description: [
                'Grids support inline editing of their underlying store records. To enable,',
                'set `editable: true` on columns that should allow editing and (optionally)',
                'configure a type-appropriate editor.',
                '',
                'The `Column.editable` config also takes a function, allowing field-level',
                'editing to be conditional based upon the data or some other state, as',
                'demonstrated in the example below. This example also applies a custom style',
                'to highlight the editable cells in the grid, which are given the',
                '`.xh-cell--editable` CSS class by the toolkit.',
                '',
                'Store fields can be configured with validation rules, much like forms,',
                'allowing the application to require resolution before persisting to the',
                'back-end. Cells with invalid values are styled with a red corner flag by',
                'default. (Try setting a negative amount in any row to test.)'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/grids/InlineEditingPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/cmp/grid/README.md',
                    text: 'Grid docs',
                    notes: 'Grid component guide and core concepts.'
                },
                {
                    url: '$HR/data/README.md',
                    text: 'Data docs',
                    notes: 'Store, fields, and the validation used here.'
                },
                {
                    url: '$HR/cmp/grid/columns/Column.ts',
                    notes: 'Column config, including the editable flag and editor.'
                },
                {
                    url: '$HR/desktop/cmp/grid/editors/index.ts',
                    notes: 'Type-specific inline editor components.'
                },
                {
                    url: '$HR/data/Field.ts',
                    notes: 'Store field config, including the validation rules applied here.'
                }
            ],
            // Generic grid display options omitted here (distracting from the editing demo); only
            // this example's own editing-behavior controls are surfaced.
            options: [
                wrapperOption({
                    label: 'Full-row editing',
                    control: switchInput({model, bind: 'fullRowEditing'})
                }),
                wrapperOption({
                    label: 'Async validation',
                    control: switchInput({model, bind: 'asyncValidation'})
                }),
                wrapperOption({
                    label: 'Edit with',
                    control: segmentedControl({
                        model,
                        bind: 'clicksToEdit',
                        options: [
                            {value: 2, label: '2 clicks'},
                            {value: 1, label: '1 click'},
                            {value: -1, label: 'disabled'}
                        ]
                    })
                })
            ],
            item: panel({
                className: classNames(
                    model.isModal ? '' : 'tb-grid-wrapper-panel',
                    'tb-inline-editing-panel',
                    model.fullRowEditing ? 'tb-inline-editing-panel--fullRow' : ''
                ),
                tbar: tbar(),
                /**
                 * The `popupParent: null` option is a fix to TextEditors/TextAreaEditors
                 * with showIsPopup=true when opened from within a GridModel in dialog.
                 * {@see https://github.com/xh/hoist-react/issues/4061}
                 */
                item: grid({agOptions: {popupParent: null}}),
                bbar: bbar(),
                model: model.panelModel
            })
        });
    }
});

const tbar = hoistCmp.factory<InlineEditingPanelModel>(({model}) => {
    const {gridModel} = model;
    return toolbar(
        span('Add rows'),
        buttonGroup(
            button({icon: Icon.add(), text: '1', onClick: () => model.add(1)}),
            button({icon: Icon.add(), text: '5', onClick: () => model.add(5)}),
            button({icon: Icon.add(), text: '1k', onClick: () => model.add(1000)}),
            button({icon: Icon.add(), text: '10k', onClick: () => model.add(10000)})
        ),
        '-',
        button({
            icon: Icon.edit(),
            text: 'Edit first row',
            onClick: () => model.beginEditAsync({colId: 'name'})
        }),
        button({
            icon: Icon.edit(),
            text: 'Edit first amount',
            onClick: () => model.beginEditAsync({colId: 'amount'})
        }),
        '-',
        button({
            icon: Icon.stopCircle(),
            text: 'Stop editing',
            onClick: () => model.endEditAsync(),
            disabled: !gridModel.isEditing
        })
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
    const {store} = model;
    return toolbar(
        gridCountLabel(),
        '-',
        storeDirtyIndicator(),
        '-',
        storeValidIndicator(),
        filler(),
        button({
            icon: Icon.undo(),
            text: 'Revert all',
            onClick: () => model.revert(),
            disabled: !store.isModified
        }),
        hspacer(5),
        button({
            icon: Icon.check(),
            text: 'Commit all',
            outlined: true,
            intent: 'success',
            onClick: () => model.commitAllAsync(),
            disabled: !store.isModified
        })
    );
});
