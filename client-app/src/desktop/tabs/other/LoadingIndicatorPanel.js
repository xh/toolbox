import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {wait} from '@xh/hoist/promise';
import {Icon} from '@xh/hoist/icon';
import {action, bindable} from '@xh/hoist/mobx';
import {span, filler} from '@xh/hoist/cmp/layout';
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
                    Loading Indicators provide an unobtrusive message on a panel to indicate that its content is loading.
                    They are typically configured with a <code>PendingTaskModel</code>, which is a general
                    model class used to track the status of one or more asynchronous Promises. In
                    controlled mode, the model will reactively show/hide a bound loading indicator while a linked
                    promise is pending.
                </p>,
                <p>
                    A convenient way to display a loading indicator is via the <code>loadingIndicator</code> property of Panel.
                    This prop can accept a fully configured loadingIndicator element or simply <code>true</code>
                    to show a default loadingIndicator. Either will be shown in one of the panel's corners.
                </p>,
                <p>
                    User the <code>corner</code> property of <code>loadingIndicator</code> to set which corner the indicator will appear in.
                </p>
            ],
            item: panel({
                title: 'Other › Loading Indicator',
                icon: Icon.eyeSlash(),
                width: 800,
                height: 400,
                item: sampleGrid({omitToolbar: true, externalLoadModel: this.loadingIndicatorModel}),
                bbar: toolbar({
                    items: [
                        span('Show Loading Indicator for'),
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
                            width: 120,
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
                        filler(),
                        button({
                            text: 'Show Ind.',
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
    }

    @action
    async showLoadingIndicatorSequenceAsync() {
        const {loadingIndicatorModel, message, seconds} = this,
            interval = seconds / 3 * SECONDS;
        loadingIndicatorModel.setMessage(message);
        await wait(interval);
        if (message) loadingIndicatorModel.setMessage(message + ' - Still Loading...');
        await wait(interval);
        if (message) loadingIndicatorModel.setMessage(message + ' - Almost Finished...');
        await wait(interval);
    }
}