import {Component} from 'react';
import {HoistComponent, elemFactory} from '@xh/hoist/core';
import {div} from '@xh/hoist/cmp/layout';
import {page} from '@xh/hoist/mobile/cmp/page';
import {form} from '@xh/hoist/cmp/form';
import {
    formField,
    label,
    textInput,
    select,
    numberInput,
    checkbox,
    switchInput,
    textArea,
    searchInput
} from '@xh/hoist/mobile/cmp/form';

import './FormPage.scss';
import {FormPageModel} from './FormPageModel';

@HoistComponent
export class FormPage extends Component {
    model = new FormPageModel();

    render() {
        return page({
            className: 'toolbox-page form-page',
            items: [
                this.renderForm(),
                this.renderResults()
            ]
        });
    }

    renderForm() {
        const {model} = this;
        return form({
            model,
            items: div({
                className: 'toolbox-card',
                items: [
                    formField({
                        field: 'name',
                        item: textInput()
                    }),
                    formField({
                        field: 'movie',
                        item: select({options: model.movies})
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
                        field: 'notes',
                        item: textArea()
                    }),
                    formField({
                        field: 'searchQuery',
                        item: searchInput()
                    })
                ]
            })
        });
    }

    renderResults() {
        return div({
            className: 'toolbox-card',
            items: [
                this.renderResult('Name:', 'name'),
                this.renderResult('Movie:', 'movie'),
                this.renderResult('Salary:', 'salary'),
                this.renderResult('Notes:', 'notes'),
                this.renderResult('Search:', 'searchQuery')
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