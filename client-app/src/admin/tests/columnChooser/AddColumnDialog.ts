import type {ColumnSpec} from '@xh/hoist/cmp/grid';
import {form, FormModel} from '@xh/hoist/cmp/form';
import {filler, vbox} from '@xh/hoist/cmp/layout';
import {hoistCmp, HoistModel, managed, uses} from '@xh/hoist/core';
import {required} from '@xh/hoist/data';
import {button} from '@xh/hoist/desktop/cmp/button';
import {dialog} from '@xh/hoist/desktop/cmp/dialog';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {select, switchInput, textArea, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {numberRenderer} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {action, observable} from '@xh/hoist/mobx';
import type {GroupOption} from './generateColumns';

/** Host that owns the grid the new column will be added to. */
export interface AddColumnHost {
    groupOptions: GroupOption[];
    chooserGroupIds: string[];
    addColumn(spec: ColumnSpec, group: string): void;
}

let seq = 0;

export class AddColumnDialogModel extends HoistModel {
    readonly host: AddColumnHost;

    @observable accessor isOpen = false;

    @managed formModel = new FormModel({
        fields: [
            {name: 'chooserName', displayName: 'Name', rules: [required]},
            {name: 'chooserDescription', displayName: 'Description'},
            {name: 'type', displayName: 'Type', initialValue: 'string'},
            {name: 'group', displayName: 'Column Group'},
            {name: 'chooserGroup', displayName: 'Chooser Group'},
            {name: 'pinned', displayName: 'Pinned'},
            {name: 'excludeFromChooser', displayName: 'Exclude from Chooser', initialValue: false},
            {name: 'movable', displayName: 'Movable', initialValue: true},
            {name: 'hideable', displayName: 'Hideable', initialValue: true},
            {name: 'hidden', displayName: 'Hidden', initialValue: false}
        ]
    });

    constructor(host: AddColumnHost) {
        super();
        this.host = host;
    }

    @action
    open() {
        this.formModel.init({
            type: 'string',
            movable: true,
            hideable: true,
            excludeFromChooser: false,
            hidden: false
        });
        this.isOpen = true;
    }

    @action
    close() {
        this.isOpen = false;
    }

    async submitAsync() {
        const {formModel, host} = this;
        if (!(await formModel.validateAsync())) return;

        const v = formModel.values,
            id = `custom_${++seq}`,
            spec: ColumnSpec = {
                colId: id,
                field: {name: id, type: v.type},
                chooserName: v.chooserName,
                chooserDescription: v.chooserDescription || undefined,
                chooserGroup: v.chooserGroup || undefined,
                headerName: v.chooserName,
                excludeFromChooser: v.excludeFromChooser,
                movable: v.movable,
                hideable: v.hideable,
                hidden: v.hidden,
                width: 120
            };
        if (v.pinned) spec.pinned = v.pinned;
        if (v.type === 'number') {
            spec.align = 'right';
            spec.renderer = numberRenderer({precision: 0});
        }

        host.addColumn(spec, v.group || '');
        this.close();
    }
}

export const addColumnDialog = hoistCmp.factory<AddColumnDialogModel>({
    model: uses(AddColumnDialogModel),
    render({model}) {
        return dialog({
            title: 'Add Column',
            icon: Icon.add(),
            style: {width: 460},
            isOpen: model.isOpen,
            onClose: () => model.close(),
            children: formContents()
        });
    }
});

const formContents = hoistCmp.factory<AddColumnDialogModel>(({model}) =>
    panel({
        children: form({
            model: model.formModel,
            fieldDefaults: {minimal: true, inline: false},
            children: vbox({
                className: 'xh-pad',
                children: [
                    formField({field: 'chooserName', children: textInput({autoFocus: true})}),
                    formField({field: 'chooserDescription', children: textArea({height: 60})}),
                    formField({
                        field: 'type',
                        children: select({
                            options: [
                                {value: 'string', label: 'String'},
                                {value: 'number', label: 'Number'},
                                {value: 'bool', label: 'Bool'}
                            ]
                        })
                    }),
                    formField({
                        field: 'group',
                        children: select({
                            options: model.host.groupOptions,
                            enableCreate: true,
                            placeholder: '(top level)'
                        })
                    }),
                    formField({
                        field: 'chooserGroup',
                        children: select({
                            options: model.host.chooserGroupIds,
                            enableCreate: true,
                            enableClear: true,
                            placeholder: '(none)'
                        })
                    }),
                    formField({
                        field: 'pinned',
                        children: select({
                            enableClear: true,
                            options: [
                                {value: 'left', label: 'Left'},
                                {value: 'right', label: 'Right'}
                            ]
                        })
                    }),
                    formField({field: 'hidden', children: switchInput()}),
                    formField({field: 'hideable', children: switchInput()}),
                    formField({field: 'movable', children: switchInput()}),
                    formField({field: 'excludeFromChooser', children: switchInput()})
                ]
            })
        }),
        bbar: bbar()
    })
);

const bbar = hoistCmp.factory<AddColumnDialogModel>(({model}) =>
    toolbar(
        filler(),
        button({text: 'Cancel', onClick: () => model.close()}),
        button({
            text: 'Add',
            icon: Icon.add(),
            intent: 'success',
            minimal: false,
            disabled: !model.formModel.isValid,
            onClick: () => model.submitAsync().catchDefault()
        })
    )
);
