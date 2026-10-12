import {badge} from '@xh/hoist/cmp/badge';
import {code, placeholder} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {jsonInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {isUndefined} from 'lodash';
import {ViewManagerPanelModel} from './ViewManagerPanelModel';

/**
 * Side panel with the current view's saved value above its pending value, so a change to any
 * component shows up here as you make it. Focus a card to narrow both to that component's path.
 */
export const viewStatePanel = hoistCmp.factory({
    model: uses(ViewManagerPanelModel),
    render({model}) {
        const {viewManagerModel, focusedPath} = model;
        return panel({
            testId: 'vm-view-state',
            title: 'View State',
            icon: Icon.code(),
            compactHeader: true,
            modelConfig: {side: 'right', defaultSize: 380, minSize: 260},
            headerItems: [
                code({className: 'tb-vm-state__path', item: focusedPath, omit: !focusedPath}),
                button({
                    testId: 'vm-view-state-clear-focus',
                    icon: Icon.x(),
                    title: 'Show the whole view',
                    omit: !focusedPath,
                    onClick: () => (model.focusedPath = null)
                })
            ],
            items: viewManagerModel
                ? [
                      stateBlock({
                          testId: 'vm-saved-value',
                          title: 'Saved',
                          info: 'As stored with the current view',
                          value: model.savedValue
                      }),
                      stateBlock({
                          testId: 'vm-pending-value',
                          title: 'Pending',
                          info: 'Including unsaved changes',
                          value: model.pendingValue,
                          headerItems: [
                              badge({
                                  testId: 'vm-view-dirty',
                                  intent: viewManagerModel.isValueDirty ? 'danger' : 'success',
                                  item: viewManagerModel.isValueDirty ? 'Dirty' : 'Clean'
                              })
                          ]
                      })
                  ]
                : placeholder('No ViewManagerModel')
        });
    }
});

const stateBlock = hoistCmp.factory({
    render({testId, title, info, value, headerItems}) {
        return panel({
            testId,
            title: `${title} - ${info}`,
            compactHeader: true,
            flex: 1,
            headerItems,
            item: jsonInput({
                flex: 1,
                width: '100%',
                readonly: true,
                enableSearch: true,
                value: isUndefined(value) ? 'undefined' : JSON.stringify(value, null, 2)
            })
        });
    }
});
