import {Component} from 'react';
import {HoistComponent, elemFactory} from '@xh/hoist/core';
import {div, vframe, span, filler, vbox} from '@xh/hoist/cmp/layout';
import {page} from '@xh/hoist/mobile/cmp/page';
import {toolbar} from '@xh/hoist/mobile/cmp/toolbar';
import {button} from '@xh/hoist/mobile/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {form} from '@xh/hoist/cmp/form';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {
    label,
    textInput,
    select,
    numberInput,
    buttonGroupInput,
    checkbox,
    switchInput,
    textArea,
    searchInput
} from '@xh/hoist/mobile/cmp/input';

import './FormPage.scss';
import {FormPageModel} from './FormPageModel';

@HoistComponent
export class FormPage extends Component {

    model = new FormPageModel();

    render() {
        return page({
            className: 'toolbox-page form-page',
            items: [
                vframe({
                    overflowY: 'auto',
                    items: [
                        this.renderForm(),
                        this.renderResults()
                    ]
                }),
                this.renderToolbar()
            ]
        });
    }

    renderForm() {
        const {model} = this,
            {formModel, minimal, readonly, movies} = model;

        return div({
            className: 'toolbox-card',
            items: form({
                model: formModel,
                fieldDefaults: {minimal, readonly},
                items: vbox(
                    formField({
                        field: 'name',
                        info: 'Min. 8 chars',
                        item: textInput()
                    }),
                    formField({
                        field: 'movie',
                        item: select({options: movies})
                    }),
                    formField({
                        field: 'salary',
                        item: numberInput({
                            enableShorthandUnits: true,
                            displayWithCommas: true
                        })
                    }),
                    formField({
                        field: 'included',
                        item: checkbox()
                    }),
                    formField({
                        field: 'enabled',
                        item: switchInput()
                    }),
                    formField({
                        field: 'buttonGroup',
                        item: buttonGroupInput(
                            button({
                                text: 'Button 1',
                                value: 'button1'
                            }),
                            button({
                                icon: Icon.moon(),
                                value: 'button2'
                            }),
                            button({
                                icon: Icon.skull(),
                                text: 'Button 2',
                                value: 'button3'
                            })
                        )
                    }),
                    formField({
                        field: 'notes',
                        item: textArea()
                    }),
                    formField({
                        field: 'searchQuery',
                        item: searchInput()
                    })
                )
            })
        });
    }

    renderResults() {
        const {model} = this;
        return div({
            className: 'toolbox-card',
            items: [
                fieldResultDisplay({model, field: 'name'}),
                fieldResultDisplay({model, field: 'movie'}),
                fieldResultDisplay({model, field: 'salary'}),
                fieldResultDisplay({model, field: 'buttonGroup'}),
                fieldResultDisplay({model, field: 'notes'}),
                fieldResultDisplay({model, field: 'searchQuery'})
            ]
        });
    }

    renderToolbar() {
        const {model} = this;
        return toolbar(
            switchInput({model, bind: 'readonly'}),
            span('Read-only'),
            filler(),
            switchInput({model, bind: 'minimal'}),
            span('Minimal validation'),
        );
    }
}
export const formPage = elemFactory(FormPage);


@HoistComponent
class FieldResultDisplay extends Component {
    render() {
        const {displayName, value} = this.model.formModel.getField(this.props.field);
        return div({
            className: 'form-field-result',
            items: [
                label(displayName),
                div(value)
            ]
        });
    }
}
const fieldResultDisplay = elemFactory(FieldResultDisplay);