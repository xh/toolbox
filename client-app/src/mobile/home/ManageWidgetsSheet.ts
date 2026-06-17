import {div, filler, hbox, span} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {dragDropContext, draggable, droppable} from '@xh/hoist/kit/react-beautiful-dnd';
import {button} from '@xh/hoist/mobile/cmp/button';
import {switchInput} from '@xh/hoist/mobile/cmp/input';
import classNames from 'classnames';
import {isEmpty} from 'lodash';
import {ReactElement} from 'react';
import {pullUpSheet} from '../cmp/pullUpSheet/PullUpSheet';
import {HomeModel} from './HomeModel';
import {WidgetSpec} from './widgets/WidgetCatalog';
import './ManageWidgetsSheet.scss';

/**
 * The "Manage widgets" pull-up sheet - the single personalization surface for the home dashboard,
 * sharing the example-screen pull-up vocabulary so the app teaches one interaction. Lists every
 * widget in two groups, "On your home" and "Available"; each row has a membership toggle and a drag
 * handle to reorder. Mounted only while managing, so the home screen carries no persistent peek bar;
 * dragging the sheet down, tapping the scrim, or tapping Done dismisses it.
 */
export const manageWidgetsSheet = hoistCmp.factory({
    displayName: 'ManageWidgetsSheet',
    model: uses(HomeModel),

    render({model}) {
        if (!model.isManaging) return null;

        return pullUpSheet({
            className: 'tb-manage-widgets',
            isExpanded: true,
            onExpandedChange: v => model.setBindable('isManaging', v),
            peekItem: header(model),
            item: sheetBody(model)
        });
    }
});

// Plain helpers (not factories) so the HomeModel passed in resolves directly; observable reads happen
// during the parent `manageWidgetsSheet` render, keeping membership reactive.
function header(model: HomeModel): ReactElement {
    return hbox({
        className: 'tb-manage-widgets__header',
        items: [
            span({className: 'tb-manage-widgets__title', item: 'Manage widgets'}),
            filler(),
            button({
                className: 'tb-manage-widgets__done',
                text: 'Done',
                minimal: true,
                onClick: () => model.setBindable('isManaging', false)
            })
        ]
    });
}

function sheetBody(model: HomeModel): ReactElement {
    return div({
        className: 'tb-manage-widgets__body',
        item: dragDropContext({
            onDragEnd: model.onDragEnd,
            items: [
                group(model, 'home', 'On your home', model.homeWidgets, [
                    'No widgets on your home yet - toggle one on below.'
                ]),
                group(model, 'available', 'Available', model.availableWidgets, [
                    'Every widget is on your home.'
                ])
            ]
        })
    });
}

function group(
    model: HomeModel,
    droppableId: string,
    label: string,
    widgets: WidgetSpec[],
    emptyText: string[]
): ReactElement {
    const onHome = droppableId === 'home';
    return div({
        className: 'tb-manage-widgets__group',
        items: [
            div({className: 'tb-manage-widgets__group-label', item: label}),
            droppable({
                droppableId,
                children: dndProps =>
                    div({
                        className: 'tb-manage-widgets__list',
                        ref: dndProps.innerRef,
                        items: [
                            isEmpty(widgets)
                                ? div({
                                      className: 'tb-manage-widgets__empty',
                                      item: emptyText[0]
                                  })
                                : widgets.map((w, idx) => widgetRow(model, w, idx, onHome)),
                            dndProps.placeholder
                        ]
                    })
            })
        ]
    });
}

function widgetRow(model: HomeModel, w: WidgetSpec, idx: number, onHome: boolean): ReactElement {
    return draggable({
        key: w.id,
        draggableId: w.id,
        index: idx,
        children: (dndProps, dndState) =>
            div({
                className: classNames(
                    'tb-manage-widgets__row',
                    dndState.isDragging && 'tb-manage-widgets__row--dragging'
                ),
                ref: dndProps.innerRef,
                ...dndProps.draggableProps,
                items: [
                    // Drag handle owns the drag gesture, so the toggle stays independently tappable.
                    div({
                        className: 'tb-manage-widgets__grip',
                        ...dndProps.dragHandleProps,
                        item: Icon.grip({prefix: 'fas'})
                    }),
                    div({className: 'tb-manage-widgets__row-icon', item: w.icon}),
                    span({className: 'tb-manage-widgets__row-title', item: w.title}),
                    filler(),
                    switchInput({
                        // Mobile SwitchInputProps mistypes `value` as string; it is a boolean control.
                        value: onHome as any,
                        onChange: v => model.setOnHome(w.id, v)
                    })
                ]
            })
    });
}
