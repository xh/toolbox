/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {wait, LastPromiseModel} from '@xh/hoist/promise';
import {observable, action, runInAction} from '@xh/hoist/mobx';
import {box, filler} from '@xh/hoist/cmp/layout';
import {numberField, textField, switchField} from '@xh/hoist/desktop/cmp/form';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {loadMask} from '@xh/hoist/desktop/cmp/mask';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {wrapper, sampleGrid} from '../../common';

@HoistComponent()
export class LoadMaskPanel extends Component {
    @observable maskIsShown = false;
    @observable seconds = 3;
    @observable maskText = '';
    @observable dynamicText = false;
    @observable maskViewport = false;

    promiseModel = new LastPromiseModel();

    render() {
        const {maskText, maskViewport, maskIsShown, promiseModel} = this;

        return wrapper({
            description: <p>
                LoadMask adds a spinner to the default mask component. It can display optional
                text or dymanically relay messages from a linked PromiseModel. It can also be
                placed over the entire viewport with <code>inline:false</code>.
            </p>,
            item: panel({
                title: 'Other > LoadMask',
                width: 700,
                height: 400,
                items: [
                    sampleGrid({omitToolbar: true}),
                    loadMask({
                        model: promiseModel,
                        text: maskText,
                        inline: !maskViewport
                    })
                ],
                bbar: toolbar({
                    items: [
                        box('Mask for'),
                        numberField({
                            model: this,
                            field: 'seconds',
                            width: 40,
                            min: 0,
                            max: 10,
                            disabled: this.dynamicText
                        }),
                        box('secs with'),
                        textField({
                            model: this,
                            field: 'maskText',
                            width: 120,
                            placeholder: 'optional text',
                            disabled: this.dynamicText
                        }),
                        switchField({
                            model: this,
                            field: 'dynamicText'
                        }),
                        box({
                            className: 'xh-no-pad',
                            item: 'dynamic text'
                        }),
                        switchField({
                            model: this,
                            field: 'maskViewport'
                        }),
                        box({
                            className: 'xh-no-pad',
                            item: 'on viewport'
                        }),
                        filler(),
                        button({
                            text: 'Show Mask',
                            intent: 'primary',
                            disabled: maskIsShown,
                            onClick: this.showMask
                        })
                    ]
                })
            })
        });
    }

    showMask = () => {
        const {promiseModel} = this;

        runInAction(() => this.maskIsShown = true);
        if (this.dynamicText) {
            promiseModel.setMessage('Loading...');
            wait(1000)
                .then(() => {
                    promiseModel.setMessage('Still Loading...');
                })
                .wait(1000)
                .then(() => {
                    promiseModel.setMessage('Half way there...');
                })
                .wait(1000)
                .then(() => {
                    promiseModel.setMessage('Almost...');
                })
                .wait(1000)
                .then(() => {
                    promiseModel.setMessage('Done');
                })
                .wait(1000)
                .thenAction(() => {
                    this.maskIsShown = false;
                    promiseModel.setMessage('');
                })
                .linkTo(promiseModel);
            return;
        }

        wait(this.seconds * 1000).thenAction(() => this.maskIsShown = false).linkTo(this.promiseModel);
    }

    @action
    setSeconds(seconds) {
        this.seconds = seconds;
    }

    @action
    setMaskText(maskText) {
        this.maskText = maskText;
    }

    @action
    setMaskViewport(maskViewport) {
        this.maskViewport = maskViewport;
    }

    @action
    setDynamicText(showDynamicText) {
        this.dynamicText = showDynamicText;
        if (showDynamicText) this.setSeconds(5);
    }

}