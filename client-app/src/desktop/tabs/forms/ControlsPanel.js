/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {hframe, vframe} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import moment from 'moment';
import {fmtDate, fmtThousands} from '@xh/hoist/format';
import {formGroup} from '@xh/hoist/kit/blueprint';
import {
    checkField,
    dayField,
    textField,
    textAreaField,
    numberField,
    sliderField,
    selectField,
    multiSelectField,
    switchField,
    comboField,
    queryComboField,
    jsonField
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
                                        label: 'TextField',
                                        field: 'text1',
                                        item: textField()
                                    }),
                                    row({
                                        label: 'TextField',
                                        field: 'text2',
                                        info: 'placeholder, leftIcon, and rightElement',
                                        item: textField({
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
                                        label: 'TextField',
                                        field: 'text3',
                                        info: 'type:password, commitOnChange, selectOnFocus',
                                        item: textField({
                                            type: 'password',
                                            commitOnChange: true,
                                            selectOnFocus: true
                                        })
                                    }),
                                    row({
                                        label: 'TextArea',
                                        field: 'text4',
                                        info: 'selectOnFocus',
                                        item: textAreaField({
                                            width: '100%',
                                            selectOnFocus: true
                                        })
                                    }),
                                    row({
                                        label: 'JSONField',
                                        field: 'text5',
                                        item: jsonField({
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
                                        label: 'NumberField',
                                        field: 'number1',
                                        item: numberField()
                                    }),
                                    row({
                                        label: 'NumberField',
                                        field: 'number2',
                                        info: 'enableShorthandUnits, displayWithCommas, selectOnFocus',
                                        item: numberField({
                                            enableShorthandUnits: true,
                                            displayWithCommas: true,
                                            selectOnFocus: true
                                        })
                                    }),
                                    row({
                                        label: 'SliderField',
                                        field: 'number3',
                                        info: 'custom labelRenderer',
                                        item: sliderField({
                                            model,
                                            min: 0,
                                            max: 100,
                                            labelStepSize: 25,
                                            stepSize: 1,
                                            labelRenderer: val => `${val}%`
                                        })
                                    }),
                                    row({
                                        label: 'SliderField',
                                        field: 'range1',
                                        info: 'multi-value, custom labelRenderer',
                                        item: sliderField({
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
                                        label: 'SelectField',
                                        field: 'option1',
                                        item: selectField({
                                            options: usStates,
                                            placeholder: 'Select a state...'
                                        })
                                    }),
                                    row({
                                        label: 'ComboField',
                                        field: 'option2',
                                        item: comboField({
                                            options: movies,
                                            placeholder: 'Search movies...'
                                            ,
                                            requireSelection: true
                                        })
                                    }),
                                    row({
                                        label: 'QueryComboField',
                                        field: 'option3',
                                        info: 'Custom/async search (name/city)',
                                        item: queryComboField({
                                            queryFn: this.queryCompaniesAsync,
                                            placeholder: 'Search companies...'
                                        })
                                    }),
                                    row({
                                        label: 'MultiSelectField',
                                        field: 'option5',
                                        item: multiSelectField({
                                            options: usStates,
                                            className: 'toolbox-multiselect',
                                            placeholder: 'Select state(s)...'
                                        })
                                    }),
                                    row({
                                        label: 'DayField',
                                        field: 'startDate',
                                        info: 'minDate, maxDate',
                                        fmtVal: v => fmtDate(v),
                                        item: dayField({
                                            commitOnChange: true,
                                            minDate: moment().subtract(2, 'weeks').toDate(),
                                            maxDate: new Date()
                                        })
                                    }),
                                    row({
                                        label: 'DayField',
                                        field: 'endDate',
                                        info: 'minDate, maxDate',
                                        fmtVal: v => fmtDate(v),
                                        item: dayField({
                                            commitOnChange: true,
                                            minDate: moment().subtract(2, 'weeks').toDate(),
                                            maxDate: new Date()
                                        })
                                    }),
                                    row({
                                        label: 'CheckField',
                                        field: 'bool1',
                                        item: checkField()
                                    }),
                                    row({
                                        label: 'SwitchField',
                                        field: 'bool2',
                                        item: switchField()
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

        return formGroup({
            label,
            labelInfo: `${displayVal}`,
            item: React.cloneElement(item, {model, field}),
            helperText: info
        });
    };

    queryCompaniesAsync(query) {
        return App.companyService.queryAsync(query).then(hits => {
            return hits.map(it => `${it.name} (${it.city})`);
        });
    }
}
