/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {wait} from '@xh/hoist/promise';
import {observable, action, runInAction} from '@xh/hoist/mobx';
import {box, filler} from '@xh/hoist/cmp/layout';
import {numberField, textField} from '@xh/hoist/desktop/cmp/form';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {sampleGrid, wrapper} from '../../common';

@HoistComponent()
export class MaskPanel extends Component {

    @observable maskIsShown = false;
    @observable seconds = 3;
    @observable maskText = '';

    render() {
        const {maskText, maskIsShown} = this;

        return wrapper({
            description: `
                Masks provide a semi-opaque overlay to disable interaction with a component.
                The most convenient way to display a mask is via the masked property of Panel.
            `,
            item: panel({
                title: 'Other > Mask',
                width: 700,
                height: 400,
                item: sampleGrid({omitToolbar: true}),
                bbar: toolbar({
                    items: [
                        box('Mask for'),
                        numberField({
                            model: this,
                            field: 'seconds',
                            width: 40,
                            min: 0,
                            max: 10
                        }),
                        box('secs with'),
                        textField({
                            model: this,
                            field: 'maskText',
                            width: 120,
                            placeholder: 'optional text'
                        }),
                        filler(),
                        button({
                            text: 'Show Mask',
                            intent: 'primary',
                            onClick: this.showMask
                        })
                    ]
                }),
                maskText: maskText,
                masked: maskIsShown
            })
        });
    }

    @action
    setSeconds(seconds) {
        this.seconds = seconds;
    }

    @action
    setMaskText(maskText) {
        this.maskText = maskText;
    }

    showMask = () => {
        runInAction(() => this.maskIsShown = true);
        wait(this.seconds * 1000).thenAction(() => this.maskIsShown = false);
    }

}