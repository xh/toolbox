/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {hoistComponent} from 'hoist/core';
import {wrapperPanel} from '../impl/WrapperPanel';
import {computed, observable, setter} from 'hoist/mobx';
import {vframe} from 'hoist/layout';
import {delay} from 'lodash';
import {button, inputGroup, label} from 'hoist/kit/blueprint';
import {loadMask, panel, toolbar} from 'hoist/cmp';
import {pluralize} from 'hoist/utils/JsUtils';

@hoistComponent()
export class LoadMaskPanel extends Component {
    @observable @setter showMask = false;
    @observable @setter seconds = 2;

    @computed
    get text() {
        if (this.showMask) {
            return `Loading in ${this.seconds} ${pluralize('second', this.seconds)}...`;
        } else {
            return 'Content...';
        }
    }

    render() {
        return wrapperPanel(
            panel({
                cls: 'xh-toolbox-loadmask-panel',
                title: 'LoadMask Component',
                width: 500,
                height: 400,
                item: this.renderExample(),
                bottomToolbar: toolbar({
                    items: [
                        label('Seconds'),
                        inputGroup({
                            value: this.seconds,
                            style: {width: '50px'},
                            onChange: (value) => this.updateSeconds(value)
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
                loadMask({ isDisplayed: this.showMask})
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
}