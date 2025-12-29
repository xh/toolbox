import {badge} from '@xh/hoist/cmp/badge';
import {hbox, label} from '@xh/hoist/cmp/layout';
import {tabContainer, TabContainerModel} from '@xh/hoist/cmp/tab';
import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {find} from 'lodash';
import {createContainerModelConfig} from './SimpleExample';

export const tabStateExample = hoistCmp.factory({
    model: creates(() => TabStateExampleModel),

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
                    label: 'People disabled',
                    labelSide: 'left'
                }),
                switchInput({
                    model: peopleTab,
                    bind: 'excludeFromSwitcher',
                    label: 'excluded',
                    labelSide: 'left'
                }),
                '-',
                label('Places title'),
                textInput({
                    model: placesTab,
                    bind: 'title',
                    flex: 1
                }),
                '-',
                switchInput({
                    bind: 'showBadge',
                    label: 'Things badge',
                    labelSide: 'left'
                })
            ],
            item: tabContainer({model: model.stateTabModel})
        });
    }
});

class TabStateExampleModel extends HoistModel {
    @bindable
    showBadge = true;

    @managed
    stateTabModel = new TabContainerModel(createContainerModelConfig());

    constructor() {
        super();
        makeObservable(this);

        this.addReaction({
            track: () => this.showBadge,
            run: () => this.setBadge(),
            fireImmediately: true
        });
    }

    setBadge() {
        const thingsTab = this.stateTabModel.findTab('things');
        thingsTab.title = this.showBadge
            ? hbox(
                  'Things ',
                  badge({
                      item: 'New',
                      intent: 'primary',
                      compact: true,
                      style: {
                          position: 'relative',
                          top: -6,
                          marginLeft: 2
                      }
                  })
              )
            : 'Things';
    }
}
