/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {HoistComponent, elemFactory} from '@xh/hoist/core';
import {div} from '@xh/hoist/cmp/layout';
import {page} from '@xh/hoist/mobile/cmp/page';
import {label, textField, selectField, textAreaField} from '@xh/hoist/mobile/cmp/form';

import './FormPage.scss';
import {FormPageModel} from './FormPageModel';

@HoistComponent()
export class FormPage extends Component {
    localModel = new FormPageModel();

    render() {
        const {model} = this;
        return page({
            cls: 'toolbox-page form-page',
            items: [
                div({
                    cls: 'toolbox-card',
                    items: [
                        this.renderField('Name:', textField, {
                            model,
                            field: 'name'
                        }),
                        this.renderField('Favourite Movie:', selectField, {
                            model,
                            options: model.movies,
                            field: 'movie'
                        }),
                        this.renderField('Notes:', textAreaField, {
                            model,
                            field: 'notes'
                        })
                    ]
                }),
                div({
                    cls: 'toolbox-card',
                    items: [
                        this.renderResult('Name:', 'name'),
                        this.renderResult('Favourite Movie:', 'movie'),
                        this.renderResult('Notes:', 'notes')
                    ]
                })
            ]
        });
    }

    renderField(labelText, factory, props) {
        return div({
            cls: 'form-field-container',
            items: [
                label(labelText),
                factory(props)
            ]
        });
    }

    renderResult(labelText, field) {
        const value = this.model[field];

        return div({
            cls: 'form-field-result',
            items: [
                label(labelText),
                div(value)
            ]
        });
    }

}

export const formPage = elemFactory(FormPage);