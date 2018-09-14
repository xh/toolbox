/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {hframe, vframe} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import moment from 'moment';
import {fmtDate, fmtThousands} from '@xh/hoist/format';
import {
    formField,
    checkBox,
    dateInput,
    textInput,
    textArea,
    numberInput,
    slider,
    select,
    multiSelect,
    switchInput,
    comboBox,
    queryComboBox,
    jsonInput
} from '@xh/hoist/desktop/cmp/form';

import {usStates, movies} from '../../../core/data';
import {wrapper} from '../../common';
import {ControlsPanelModel} from './ControlsPanelModel';
import {App} from '../../App';
import './ControlsPanel.scss';

@HoistComponent
export class ControlsPanel extends Component {

    localModel = new ControlsPanelModel();

    render() {
        const {model, row} = this;

        return wrapper({
            item: panel({
                title: 'Controls',
                className: 'toolbox-controls-panel',
                icon: Icon.edit(),
                width: '90%',
                height: '90%',
                item: vframe(
                    hframe({
                        items: [
                            panel({
                                className: 'toolbox-controls-panel__panel',
                                items: [
                                    row({
                                        label: 'TextInput',
                                        field: 'text1',
                                        item: textInput()
                                    }),
                                    row({
                                        label: 'TextInput',
                                        field: 'text2',
                                        info: 'placeholder, leftIcon, and rightElement',
                                        item: textInput({
                                            placeholder: 'user@company.com',
                                            leftIcon: Icon.mail(),
                                            rightElement: button({
                                                icon: Icon.cross(),
                                                minimal: true,
                                                onClick: () => model.setText2(null)
                                            })
                                        })
                                    }),
                                    row({
                                        label: 'TextInput',
                                        field: 'text3',
                                        info: 'type:password, commitOnChange, selectOnFocus',
                                        item: textInput({
                                            type: 'password',
                                            commitOnChange: true,
                                            selectOnFocus: true
                                        })
                                    }),
                                    row({
                                        label: 'TextArea',
                                        field: 'text4',
                                        info: 'selectOnFocus',
                                        item: textArea({
                                            width: '100%',
                                            selectOnFocus: true
                                        })
                                    }),
                                    row({
                                        label: 'JSONInput',
                                        field: 'text5',
                                        item: jsonInput({
                                            width: 300,
                                            height: 100
                                        })
                                    })
                                ]
                            }),
                            panel({
                                className: 'toolbox-controls-panel__panel',
                                items: [
                                    row({
                                        label: 'NumberInput',
                                        field: 'number1',
                                        item: numberInput()
                                    }),
                                    row({
                                        label: 'NumberInput',
                                        field: 'number2',
                                        info: 'enableShorthandUnits, displayWithCommas, selectOnFocus',
                                        item: numberInput({
                                            enableShorthandUnits: true,
                                            displayWithCommas: true,
                                            selectOnFocus: true
                                        })
                                    }),
                                    row({
                                        label: 'Slider',
                                        field: 'number3',
                                        info: 'custom labelRenderer',
                                        item: slider({
                                            min: 0,
                                            max: 100,
                                            labelStepSize: 25,
                                            stepSize: 1,
                                            labelRenderer: val => `${val}%`
                                        })
                                    }),
                                    row({
                                        label: 'Slider',
                                        field: 'range1',
                                        info: 'multi-value, custom labelRenderer',
                                        item: slider({
                                            min: 50000,
                                            max: 150000,
                                            labelStepSize: 25000,
                                            stepSize: 1000,
                                            labelRenderer: v => `$${fmtThousands(v, {
                                                label: true,
                                                precision: 0,
                                                labelCls: null
                                            })}`
                                        })
                                    })
                                ]
                            }),
                            panel({
                                className: 'toolbox-controls-panel__panel',
                                items: [
                                    row({
                                        label: 'Select',
                                        field: 'option1',
                                        item: select({
                                            options: usStates,
                                            placeholder: 'Select a state...'
                                        })
                                    }),
                                    row({
                                        label: 'ComboBox',
                                        field: 'option2',
                                        item: comboBox({
                                            options: movies,
                                            placeholder: 'Search movies...'
                                        })
                                    }),
                                    row({
                                        label: 'QueryComboBox',
                                        field: 'option3',
                                        info: 'Custom/async search (name/city)',
                                        item: queryComboBox({
                                            queryFn: this.queryCompaniesAsync,
                                            placeholder: 'Search companies...'
                                        })
                                    }),
                                    row({
                                        label: 'MultiSelect',
                                        field: 'option5',
                                        item: multiSelect({
                                            options: usStates,
                                            className: 'toolbox-multiselect',
                                            placeholder: 'Select state(s)...'
                                        })
                                    }),
                                    row({
                                        label: 'DateInput',
                                        field: 'date1',
                                        info: 'minDate, maxDate',
                                        fmtVal: v => fmtDate(v),
                                        item: dateInput({
                                            commitOnChange: true,
                                            minDate: moment().subtract(2, 'weeks').toDate(),
                                            maxDate: new Date()
                                        })
                                    }),
                                    row({
                                        label: 'CheckBox',
                                        field: 'bool1',
                                        item: checkBox()
                                    }),
                                    row({
                                        label: 'SwitchInput',
                                        field: 'bool2',
                                        item: switchInput()
                                    })
                                ]
                            })
                        ]
                    })
                )
            })
        });
    }

    row = ({label, field, item, info, fmtVal}) => {
        const {model} = this;

        let displayVal = model[field];
        if (fmtVal) displayVal = fmtVal(displayVal);

        return formField({
            item,
            label,
            field,
            model,
            labelInfo: `${displayVal}`,
            helperText: info
        });
    };

    queryCompaniesAsync(query) {
        return App.companyService.queryAsync(query).then(hits => {
            return hits.map(it => `${it.name} (${it.city})`);
        });
    }
}
