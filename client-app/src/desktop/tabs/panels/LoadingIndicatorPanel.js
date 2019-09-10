import React from 'react';
import {hoistCmp, HoistModel, create, managed} from '@xh/hoist/core';
import {wait} from '@xh/hoist/promise';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';
import {span} from '@xh/hoist/cmp/layout';
import {numberInput, select, textInput, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {loadingIndicator} from '@xh/hoist/desktop/cmp/loadingindicator';

import {sampleGrid, wrapper} from '../../common';

export const LoadingIndicatorPanel = hoistCmp({
    model: create(() => new Model()),

    render({model}) {
        return wrapper({
            description: [
                <p>
                    Loading Indicators display an unobtrusive overlay in the corner of a component
                    with a spinner and/or message. They indicate that a longer-running operation is
                    in progress without using a modal Mask.
                </p>,
                <p>
                    A convenient way to display a loading indicator is via the <code>loadingIndicator</code> property
                    of Panel. This prop can accept a fully configured loadingIndicator element or
                    (most commonly) a <code>PendingTaskModel</code> instance to automatically show
                    the indicator when a linked promise is pending.
                </p>
            ],
            links: [
                {url: '$TB/client-app/src/desktop/tabs/panels/LoadingIndicatorPanel.js', notes: 'This example.'},
                {url: '$HR/desktop/cmp/loadingindicator/LoadingIndicator.js', notes: 'Hoist component.'},
                {url: '$HR/utils/async/PendingTaskModel.js', notes: 'Hoist model for tracking async tasks - can be linked to indicators.'}
            ],
            item: panel({
                title: 'Panels › Loading Indicator',
                icon: Icon.spinner(),
                width: 800,
                height: 400,
                item: sampleGrid({omitGridTools: true, externalLoadModel: model.loadingIndicatorModel}),
                bbar: [
                    span('Show for'),
                    numberInput({
                        bind: 'seconds',
                        width: 40,
                        min: 0,
                        max: 10
                    }),
                    span('secs with'),
                    textInput({
                        bind: 'message',
                        width: 150,
                        placeholder: 'optional text'
                    }),
                    toolbarSep(),
                    select({
                        bind: 'corner',
                        label: 'Corner:',
                        labelAlign: 'left',
                        enableFilter: false,
                        options: ['tl', 'tr', 'bl', 'br'],
                        width: 70
                    }),
                    toolbarSep(),
                    switchInput({
                        bind: 'spinner',
                        label: 'Spinner:',
                        labelAlign: 'left'
                    }),
                    toolbarSep(),
                    button({
                        text: 'Show Indicator',
                        intent: 'success',
                        onClick: () => model.showLoadingIndicator()
                    })
                ],
                loadingIndicator: loadingIndicator({
                    spinner: model.spinner,
                    corner: model.corner,
                    model: model.loadingIndicatorModel
                })
            })
        });
    }
});


@HoistModel
class Model {
    @bindable seconds = 6;
    @bindable message = '';
    @bindable corner = 'br';
    @bindable spinner = true;

    @managed
    loadingIndicatorModel = new PendingTaskModel();

    showLoadingIndicator() {
        this.showLoadingIndicatorSequenceAsync().linkTo(this.loadingIndicatorModel);
    }

    async showLoadingIndicatorSequenceAsync() {
        this.loadingIndicatorModel.setMessage(this.message);
        await wait(this.seconds * SECONDS);
    }
}