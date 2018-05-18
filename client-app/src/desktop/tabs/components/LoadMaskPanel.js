/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {button, inputGroup, label, checkbox} from 'hoist/kit/blueprint';
import {HoistComponent} from 'hoist/core';
import {delay} from 'lodash';
import {wrapperPanel} from '../impl/WrapperPanel';
import {computed, observable, setter} from 'hoist/mobx';
import {vframe} from 'hoist/cmp/layout';
import {loadMask} from 'hoist/cmp/mask';
import {panel} from 'hoist/cmp/panel';
import {toolbar} from 'hoist/cmp/toolbar';
import {pluralize} from 'hoist/utils/JsUtils';

@HoistComponent()
export class LoadMaskPanel extends Component {
    @observable @setter showMask = false;
    @observable @setter seconds = 2;
    @observable @setter maskText = '';
    @observable @setter isViewport = false;

    @computed
    get text() {
        if (this.showMask) {
            return `Loading in ${this.seconds} ${pluralize('second', this.seconds)}...
                Viewport is ${this.isViewport ? '' : 'not '} covered`;
        } else {
            return 'Content...';
        }
    }

    render() {
        return wrapperPanel(
            panel({
                cls: 'xh-toolbox-loadmask-panel',
                title: 'LoadMask Component',
                width: 600,
                height: 200,
                item: this.renderExample(),
                bbar: toolbar({
                    alignItems: 'baseline',
                    items: [
                        label('Loading Seconds:'),
                        inputGroup({
                            value: this.seconds,
                            style: {width: '50px'},
                            onChange: (value) => this.updateSeconds(value)
                        }),
                        label('Mask Text: '),
                        inputGroup({
                            value: this.maskText,
                            style: {width: '100px'},
                            onChange: (value) => this.updateMaskText(value)
                        }),
                        label('viewport'),
                        checkbox({
                            value: this.isViewport,
                            onChange: (value) => this.updateIsViewport(value)
                        }),
                        button({text: 'Show Loader', onClick: () => this.enableMask(), disabled: this.showMask})
                    ]
                })
            })
        );
    }

    renderExample() {
        return vframe({
            cls: 'xh-toolbox-example-container',
            items: [
                this.text,
                loadMask({ isDisplayed: this.showMask, text: this.maskText, inline: !this.isViewport})
            ]
        });
    }

    enableMask() {
        this.setShowMask(true);

        delay(() => {
            this.setShowMask(false);
        }, this.seconds * 1000);
    }

    updateSeconds(e) {
        this.setSeconds(e.target.value);
    }

    updateMaskText(e) {
        this.setMaskText(e.target.value);
    }

    updateIsViewport(e) {
        this.setIsViewport(e.target.checked);
    }
}