import {Component} from 'react';
import {HoistComponent, elemFactory} from '@xh/hoist/core';
import {div} from '@xh/hoist/cmp/layout';
import {page} from '@xh/hoist/mobile/cmp/page';
import {formField, label, textInput, numberInput, select, textArea, searchInput} from '@xh/hoist/mobile/cmp/form';

import './FormPage.scss';
import {FormPageModel} from './FormPageModel';

@HoistComponent
export class FormPage extends Component {
    localModel = new FormPageModel();

    render() {
        const {model} = this;
        return page({
            className: 'toolbox-page form-page',
            items: [
                div({
                    className: 'toolbox-card',
                    items: [
                        formField({
                            model,
                            field: 'name',
                            item: textInput()
                        }),
                        formField({
                            model,
                            field: 'movie',
                            item: select({options: model.movies})
                        }),
                        formField({
                            model,
                            field: 'salary',
                            item: numberInput({
                                enableShorthandUnits: true,
                                displayWithCommas: true
                            })
                        }),
                        formField({
                            model,
                            field: 'notes',
                            item: textArea()
                        }),
                        formField({
                            model,
                            field: 'searchQuery',
                            item: searchInput()
                        })
                    ]
                }),
                div({
                    className: 'toolbox-card',
                    items: [
                        this.renderResult('Name:', 'name'),
                        this.renderResult('Movie:', 'movie'),
                        this.renderResult('Salary:', 'salary'),
                        this.renderResult('Notes:', 'notes'),
                        this.renderResult('Search:', 'searchQuery')
                    ]
                })
            ]
        });
    }

    renderResult(labelText, field) {
        const value = this.model[field];

        return div({
            className: 'form-field-result',
            items: [
                label(labelText),
                div(value)
            ]
        });
    }

}

export const formPage = elemFactory(FormPage);