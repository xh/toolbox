import {badge} from '@xh/hoist/cmp/badge';
import {card} from '@xh/hoist/cmp/card';
import {form, formFieldSet} from '@xh/hoist/cmp/form';
import {code, div, filler, hbox, placeholder, span, vbox} from '@xh/hoist/cmp/layout';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {zoneGrid} from '@xh/hoist/cmp/zoneGrid';
import type {HoistProps} from '@xh/hoist/core';
import {hoistCmp, uses} from '@xh/hoist/core';
import {button, zoneMapperButton} from '@xh/hoist/desktop/cmp/button';
import {dashCanvas, dashContainer} from '@xh/hoist/desktop/cmp/dash';
import {dateRangePicker} from '@xh/hoist/desktop/cmp/daterange';
import {filterChooser} from '@xh/hoist/desktop/cmp/filter';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {groupingChooser} from '@xh/hoist/desktop/cmp/grouping';
import {dateInput, numberInput, select, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import type {PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import classNames from 'classnames';
import type {ReactElement, ReactNode} from 'react';
import {sampleColumnGroupsGrid} from '../../../common/grid/SampleColumnGroupsGrid';
import {sampleGrid} from '../../../common/grid/SampleGrid';
import {demoGallery} from '../../../common/Demo';
import {ViewManagerPanelModel} from './ViewManagerPanelModel';

/**
 * The inventory of persisted components - one card per persist path. Small components fill as many
 * columns as fit, down to one. Grids and dashboards take the full width.
 */
export const persistedComponents = hoistCmp.factory({
    model: uses(ViewManagerPanelModel),
    render({model}) {
        const pm = model.persistedModels;
        if (!pm) return null;

        const {propsModel} = pm;
        return vbox({
            className: 'tb-vm-inventory',
            items: [
                demoGallery({
                    minTileWidth: 320,
                    items: [
                        persistedCard({
                            path: 'notes',
                            title: 'markPersist() property',
                            icon: Icon.edit(),
                            info: "A plain model property. this.markPersist('notes')",
                            item: textInput({
                                model: propsModel,
                                bind: 'notes',
                                commitOnChange: true,
                                width: '100%'
                            })
                        }),
                        persistedCard({
                            path: 'priority',
                            title: '@persist property',
                            icon: Icon.tag(),
                            info: '@bindable @persist accessor priority',
                            item: select({
                                model: propsModel,
                                bind: 'priority',
                                options: ['Low', 'Medium', 'High'],
                                enableFilter: false,
                                width: 160
                            })
                        }),
                        persistedCard({
                            path: 'groupingChooser',
                            title: 'GroupingChooser',
                            icon: Icon.treeList(),
                            info: 'Persists the value and favorites.',
                            item: groupingChooser({model: pm.groupingChooserModel, flex: 1})
                        }),
                        persistedCard({
                            path: 'filterChooser',
                            title: 'FilterChooser',
                            icon: Icon.filter(),
                            info: 'Persists the value. Favorites go to localStorage instead.',
                            item: filterChooser({model: pm.filterChooserModel, flex: 1})
                        }),
                        persistedCard({
                            path: 'dateRangePicker',
                            title: 'DateRangePicker',
                            icon: Icon.calendar(),
                            info: 'Persists the selected range.',
                            item: dateRangePicker({model: pm.dateRangePickerModel})
                        }),
                        persistedCard({
                            path: 'tabContainer',
                            title: 'TabContainer',
                            icon: Icon.folder(),
                            info: 'Persists the active tab.',
                            item: tabContainer({model: pm.tabContainerModel, height: 90})
                        }),
                        persistedCard({
                            path: 'card',
                            title: 'Card',
                            icon: Icon.window(),
                            info: 'Persists the collapsed state. Click the card header.',
                            item: card({
                                model: pm.cardModel,
                                title: 'Collapsible Card',
                                width: '100%',
                                item: div('Collapse this card, then save or revert the view.')
                            })
                        }),
                        persistedCard({
                            path: 'formFieldSet',
                            title: 'FormFieldSet',
                            icon: Icon.checkSquare(),
                            info: 'Persists the collapsed state. Its fields do not persist.',
                            item: form({
                                model: pm.fieldSetFormModel,
                                fieldDefaults: {inline: true, labelWidth: 60},
                                item: formFieldSet({
                                    model: pm.fieldSetModel,
                                    title: 'Address',
                                    width: '100%',
                                    items: [
                                        formField({field: 'street', item: textInput()}),
                                        formField({field: 'city', item: textInput()})
                                    ]
                                })
                            })
                        }),
                        persistedCard({
                            path: 'formValues',
                            title: 'FormModel',
                            icon: Icon.addressCard(),
                            info: 'Persists field values. startDate restores as a LocalDate.',
                            item: form({
                                model: pm.formModel,
                                fieldDefaults: {commitOnChange: true, inline: true, labelWidth: 80},
                                item: vbox({
                                    flex: 1,
                                    items: [
                                        formField({field: 'name', item: textInput()}),
                                        formField({
                                            field: 'startDate',
                                            item: dateInput({valueType: 'localDate'})
                                        }),
                                        formField({field: 'quantity', item: numberInput()}),
                                        formField({field: 'active', item: switchInput()})
                                    ]
                                })
                            })
                        }),
                        persistedCard({
                            path: 'panel',
                            title: 'Panel size',
                            icon: Icon.arrowsLeftRight(),
                            info: 'Drag the splitter or collapse the right panel. defaultSize: 200',
                            item: sizedPanels({panelModel: pm.panelModel})
                        }),
                        persistedCard({
                            path: 'panelPct',
                            title: 'Panel size (percent)',
                            icon: Icon.arrowsLeftRight(),
                            info: "As above, with defaultSize: '50%'",
                            item: sizedPanels({panelModel: pm.panelPctModel})
                        })
                    ]
                }),
                persistedCard({
                    path: 'grid',
                    title: 'Grid',
                    icon: Icon.gridPanel(),
                    info: 'Persists columns, sort, and grouping. Use the column chooser, or drag and sort the headers.',
                    height: 320,
                    item: sampleGrid({model: pm.gridModel})
                }),
                persistedCard({
                    path: 'columnGroupsGrid',
                    title: 'Grid with column groups',
                    icon: Icon.gridPanel(),
                    info: 'Also persists expanded and collapsed column groups. Toggle the Demographics group.',
                    height: 320,
                    item: sampleColumnGroupsGrid({model: pm.columnGroupsGridModel})
                }),
                persistedCard({
                    path: 'zoneGrid',
                    title: 'ZoneGrid',
                    icon: Icon.gridPanel(),
                    info: 'Persists zone mappings, sort, and grouping. Use the zone mapper button.',
                    height: 320,
                    item: panel({
                        item: zoneGrid({model: pm.zoneGridModel}),
                        tbar: [filler(), zoneMapperButton({zoneGridModel: pm.zoneGridModel})]
                    })
                }),
                persistedCard({
                    path: 'dashCanvas',
                    title: 'DashCanvas',
                    icon: Icon.layout(),
                    info: 'Persists the widget layout. Each widget persists its own state too.',
                    height: 420,
                    item: dashCanvas({model: pm.dashCanvasModel})
                }),
                persistedCard({
                    path: 'dashContainer',
                    title: 'DashContainer',
                    icon: Icon.layout(),
                    info: pm.shorthandDashState
                        ? 'Persists the layout and each widget. Shorthand initial state is on, so the Default view may load dirty - a known hoist-react issue.'
                        : 'Persists the layout and each widget.',
                    height: 480,
                    item: dashContainer({model: pm.dashContainerModel})
                })
            ]
        });
    }
});

//------------------------------------------------------------------
// Card
//------------------------------------------------------------------
interface PersistedCardProps extends HoistProps<ViewManagerPanelModel> {
    /** Path of the component's state within the view - also keys the card's testIds. */
    path: string;
    title: string;
    icon: ReactElement;
    /** Muted note under the header - say what persists and how to change it. */
    info?: ReactNode;
    /** Fixed body height, for grids and dashboards. Default sizes to content. */
    height?: number;
}

/**
 * A card for one persisted component: its title and persist path, badges for its state within the
 * current view, and a button to focus the View State panel on it.
 *
 * Test automation can find each card by `vm-card-{path}`, and read its badges at
 * `vm-card-{path}-default` (Default or Custom) and `vm-card-{path}-dirty` (Clean or Dirty).
 */
const persistedCard = hoistCmp.factory<PersistedCardProps>({
    model: uses(ViewManagerPanelModel),
    className: 'tb-vm-card',
    render({model, className, path, title, icon, info, height, children}) {
        const {isCustom, isDirty} = model.getPersistState(path),
            isFocused = model.focusedPath === path,
            testId = `vm-card-${path}`;

        return vbox({
            testId,
            className: classNames(className, {
                'tb-vm-card--custom': isCustom,
                'tb-vm-card--dirty': isDirty,
                'tb-vm-card--focused': isFocused
            }),
            items: [
                // Wraps when narrow, keeping the badges and button right-aligned.
                hbox({
                    className: 'tb-vm-card__header',
                    items: [
                        icon,
                        span({className: 'tb-vm-card__title', item: title}),
                        code({className: 'tb-vm-path-chip', item: path}),
                        hbox({
                            className: 'tb-vm-card__state',
                            items: [
                                badge({
                                    testId: `${testId}-default`,
                                    intent: isCustom ? 'warning' : 'primary',
                                    item: isCustom ? 'Custom' : 'Default'
                                }),
                                badge({
                                    testId: `${testId}-dirty`,
                                    intent: isDirty ? 'danger' : 'success',
                                    item: isDirty ? 'Dirty' : 'Clean'
                                }),
                                button({
                                    testId: `${testId}-focus`,
                                    icon: Icon.target(),
                                    intent: isFocused ? 'primary' : null,
                                    minimal: !isFocused,
                                    title: isFocused
                                        ? 'Show the whole view'
                                        : 'Show only this component in the View State panel',
                                    onClick: () => model.toggleFocus(path)
                                })
                            ]
                        })
                    ]
                }),
                div({className: 'tb-vm-card__info', item: info, omit: !info}),
                vbox({
                    className: 'tb-vm-card__body',
                    height,
                    flex: height ? 'none' : null,
                    items: children
                })
            ]
        });
    }
});

//------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------
const sizedPanels = hoistCmp.factory<{panelModel: PanelModel} & HoistProps>({
    render({panelModel}) {
        return hbox({
            className: 'tb-vm-card__panels',
            height: 70,
            flex: 1,
            items: [
                panel({item: placeholder('Primary')}),
                panel({model: panelModel, item: placeholder('Sized')})
            ]
        });
    }
});
