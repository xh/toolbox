import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {wait} from '@xh/hoist/promise';
import {Icon} from '@xh/hoist/icon';
import {action, bindable} from '@xh/hoist/mobx';
import {span} from '@xh/hoist/cmp/layout';
import {numberInput, select, textInput, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {loadingIndicator} from '@xh/hoist/desktop/cmp/loadingindicator';

import {sampleGrid, wrapper} from '../../common';


@HoistComponent
export class LoadingIndicatorPanel extends Component {

    @bindable seconds = 6;
    @bindable message = '';
    @bindable corner = 'br';
    @bindable spinner = true;

    loadingIndicatorModel = new PendingTaskModel();

    render() {
        return wrapper({
            description: [
                <p>
                    Loading Indicators display an unobtrusive overlay in the corner of a component
                    with a spinner and/or message. This indicate that a longer-running operation is
                    in progress without using a modal Mask.
                </p>,
                <p>
                    A convenient way to display a loading indicator is via the <code>loadingIndicator</code> property
                    of Panel. This prop can accept a fully configured loadingIndicator element or
                    (most commonly) a <code>PendingTaskModel</code> instance to automatically show
                    the indicator when a linked promise is pending.
                </p>
            ],
            item: panel({
                title: 'Other › Loading Indicator',
                icon: Icon.spinner(),
                width: 800,
                height: 400,
                item: sampleGrid({omitToolbars: true, externalLoadModel: this.loadingIndicatorModel}),
                bbar: toolbar({
                    items: [
                        span('Show for'),
                        numberInput({
                            model: this,
                            bind: 'seconds',
                            width: 40,
                            min: 0,
                            max: 10
                        }),
                        span('secs with'),
                        textInput({
                            model: this,
                            bind: 'message',
                            width: 150,
                            placeholder: 'optional text'
                        }),
                        toolbarSep(),
                        select({
                            model: this,
                            bind: 'corner',
                            label: 'Corner:',
                            labelAlign: 'left',
                            enableFilter: false,
                            options: ['tl', 'tr', 'bl', 'br'],
                            width: 70
                        }),
                        toolbarSep(),
                        switchInput({
                            model: this,
                            bind: 'spinner',
                            label: 'Spinner:',
                            labelAlign: 'left'
                        }),
                        toolbarSep(),
                        button({
                            text: 'Show',
                            intent: 'primary',
                            onClick: this.showLoadingIndicator
                        })
                    ]
                }),
                loadingIndicator: loadingIndicator({
                    spinner: this.spinner,
                    corner: this.corner,
                    model: this.loadingIndicatorModel
                })
            })
        });
    }

    showLoadingIndicator = () => {
        this.showLoadingIndicatorSequenceAsync().linkTo(this.loadingIndicatorModel);
    };

    @action
    async showLoadingIndicatorSequenceAsync() {
        const {loadingIndicatorModel, message, seconds} = this;
        loadingIndicatorModel.setMessage(message);
        await wait(seconds * SECONDS);
    }
}