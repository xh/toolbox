import {badge} from '@xh/hoist/cmp/badge';
import {box, code, div, placeholder, span} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {jsonInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import classNames from 'classnames';
import {isUndefined, map} from 'lodash';
import {ViewManagerPanelModel} from './ViewManagerPanelModel';

/**
 * Side panel with a summary of the current view, then its saved value above its pending value. A
 * change to any component shows up here as you make it. Focus a card to narrow both values to that
 * component's path.
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
            modelConfig: {
                side: 'right',
                defaultSize: 320,
                minSize: 260,
                persistWith: {localStorageKey: 'toolboxViewManagerViewState'}
            },
            headerItems: [
                code({className: 'tb-vm-path-chip', item: focusedPath, omit: !focusedPath}),
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
                      viewSummary(),
                      stateBlock({
                          testId: 'vm-saved-value',
                          title: 'Saved',
                          info: 'As stored with the current view',
                          emptyText: 'Not in this view. Loading it restores the default state.',
                          value: model.savedValue
                      }),
                      stateBlock({
                          testId: 'vm-pending-value',
                          title: 'Pending',
                          info: 'Including unsaved changes',
                          emptyText: 'No state. The component is at its default state.',
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

/**
 * The current view's identity and flags, as key/value rows. Test automation can read each value at
 * `vm-view-summary-{key}`.
 */
const viewSummary = hoistCmp.factory<ViewManagerPanelModel>({
    render({model}) {
        return box({
            testId: 'vm-view-summary',
            flex: 'none',
            item: div({
                className: 'tb-vm-state__summary',
                items: map(model.viewSummary, (value, key) => [
                    span({className: 'tb-vm-state__key', item: key}),
                    box({
                        testId: `vm-view-summary-${key}`,
                        className: classNames(
                            'tb-vm-state__value',
                            value === true && 'tb-vm-state__value--true'
                        ),
                        item: String(value)
                    })
                ]).flat()
            })
        });
    }
});

const stateBlock = hoistCmp.factory({
    render({testId, title, info, emptyText, value, headerItems}) {
        return panel({
            testId,
            title: `${title} - ${info}`,
            compactHeader: true,
            flex: 1,
            headerItems,
            // A path that is not in the value has no JSON to show. Swapping elements also gives the
            // editor a fresh mount, so it shows no stale lint marker once the path is back.
            item: isUndefined(value)
                ? div({className: 'tb-vm-state__empty', item: emptyText})
                : jsonInput({
                      flex: 1,
                      width: '100%',
                      readonly: true,
                      enableSearch: true,
                      value: JSON.stringify(value, null, 2)
                  })
        });
    }
});
