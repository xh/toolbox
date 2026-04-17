import {creates, hoistCmp, HoistModel, managed, Corner} from '@xh/hoist/core';
import {wait} from '@xh/hoist/promise';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';
import {p, span} from '@xh/hoist/cmp/layout';
import {numberInput, select, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {refreshButton} from '@xh/hoist/desktop/cmp/button';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {loadingIndicator} from '@xh/hoist/cmp/loadingindicator';
import {sampleGrid, SampleGridModel, wrapper} from '../../common';

export const loadingIndicatorPanel = hoistCmp.factory({
    model: creates(() => LoadingIndicatorPanelModel),

    render({model}) {
        return wrapper({
            description: [
                p(
                    'Loading Indicators display an unobtrusive overlay in the corner of a component with a spinner and/or message. They indicate that a longer-running operation is in progress without using a modal Mask.'
                ),
                p(
                    'A convenient way to display a loading indicator is via the loadingIndicator property of Panel. This prop can accept a fully configured loadingIndicator element or (most commonly) a TaskObserver instance to automatically show the indicator when a task is pending.'
                )
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/panels/LoadingIndicatorPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/cmp/loadingindicator/LoadingIndicator.ts',
                    notes: 'Hoist component.'
                },
                {
                    url: '$HR/core/TaskObserver.ts',
                    notes: 'Hoist model for tracking async tasks - can be linked to indicators.'
                }
            ],
            item: panel({
                title: 'Panels › Loading Indicator',
                icon: Icon.spinner(),
                width: 800,
                height: 400,
                item: sampleGrid({omitGridTools: true, omitMask: true}),
                bbar: [
                    span('Load for'),
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
                        enableFilter: false,
                        options: ['tl', 'tr', 'bl', 'br'],
                        width: 70
                    }),
                    toolbarSep(),
                    switchInput({
                        bind: 'spinner',
                        label: 'Spinner:',
                        labelSide: 'left'
                    }),
                    toolbarSep(),
                    refreshButton({text: 'Load Now'})
                ],
                loadingIndicator: loadingIndicator({
                    spinner: model.spinner,
                    corner: model.corner,
                    bind: model.loadObserver
                })
            })
        });
    }
});

class LoadingIndicatorPanelModel extends HoistModel {
    @bindable accessor seconds = 3;
    @bindable accessor message = '';
    @bindable accessor corner: Corner = 'br';
    @bindable accessor spinner = true;

    @managed sampleGridModel = new SampleGridModel();

    override async doLoadAsync(loadSpec) {
        const {loadObserver, message, seconds} = this,
            interval = (seconds / 3) * SECONDS;
        loadObserver.setMessage(message);
        await this.sampleGridModel.loadAsync(loadSpec);
        await wait(interval);
        if (message) loadObserver.setMessage(message + ' - Still Loading...');
        await wait(interval);
        if (message) loadObserver.setMessage(message + ' - Almost Finished...');
        await wait(interval);
        loadObserver.setMessage(message);
    }
}
