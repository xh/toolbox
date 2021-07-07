import {panel} from '@xh/hoist/desktop/cmp/panel';
import {badge} from '@xh/hoist/desktop/cmp/badge';
import {tabContainer, TabContainerModel} from '@xh/hoist/cmp/tab';
import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {hbox, hspacer} from '@xh/hoist/cmp/layout';
import {find} from 'lodash';
import {switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {createContainerModelConfig} from './createContainerModelConfig';

export const tabStateTabContainerPanel = hoistCmp.factory({
    model: creates(() => new Model()),

    render({model}) {
        const {tabs} = model.stateTabModel,
            peopleTab = find(tabs, {id: 'people'}),
            placesTab = find(tabs, {id: 'places'});

        return panel({
            className: 'child-tabcontainer',
            bbar: [
                switchInput({
                    model: peopleTab,
                    bind: 'disabled',
                    label: 'People Disabled?'
                }),
                hspacer(10),
                'Places Tab Title: ',
                textInput({
                    model: placesTab,
                    bind: 'title'
                }),
                hspacer(10),
                switchInput({
                    bind: 'showBadge',
                    label: 'Show Badge on Things Tab'
                })
            ],
            item: tabContainer({model: model.stateTabModel})
        });
    }
});

class Model extends HoistModel {
    @bindable
    showBadge = false;

    @managed
    stateTabModel = new TabContainerModel(createContainerModelConfig({}));

    constructor() {
        super();
        makeObservable(this);

        this.addReaction({
            track: () => this.showBadge,
            run: () => this.showBadge ? this.setShowBadge() : this.hideBadge()
        });
    }

    setShowBadge() {
        const thingsTab = this.stateTabModel.findTab('things');
        thingsTab.setTitle(hbox({
            items: [
                'Things ',
                badge({
                    item: 'New',
                    intent: 'primary',
                    position: 'top'
                })
            ]
        }));
    }

    hideBadge() {
        const thingsTab = this.stateTabModel.findTab('things');
        thingsTab.setTitle('Things');
    }
}