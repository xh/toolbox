import {div, filler, hbox, span} from '@xh/hoist/cmp/layout';
import {hoistCmp, HoistProps, uses} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {dragDropContext, draggable, droppable} from '@xh/hoist/kit/react-beautiful-dnd';
import {button} from '@xh/hoist/mobile/cmp/button';
import {switchInput} from '@xh/hoist/mobile/cmp/input';
import classNames from 'classnames';
import {isEmpty} from 'lodash';
import {ReactElement} from 'react';
import {createPortal} from 'react-dom';
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

        // Portal the sheet to <body> so it (and its dnd content) escapes the Onsen navigator's Swiper
        // wrapper, which carries an (identity) CSS transform. That transform is a containing block for
        // the drag clone's position:fixed and would offset the floating row below the finger;
        // rendering at <body> leaves no transformed ancestor, so the in-place clone tracks the
        // pointer. (Paired with the sheet panel's transform-free `bottom` slide - see PullUpSheet.)
        return createPortal(
            pullUpSheet({
                className: 'tb-manage-widgets',
                isExpanded: true,
                onExpandedChange: v => (model.isManaging = v),
                peekItem: header(),
                item: sheetBody(),
                footerItem: resetFooter()
            }),
            document.body
        );
    }
});

// Internal/private components - they omit the `model` config and auto-resolve the contextual
// HomeModel established by the parent `manageWidgetsSheet`; the factory generic just types `model`.

const header = hoistCmp.factory<HomeModel>(({model}) =>
    hbox({
        className: 'tb-manage-widgets__header',
        items: [
            span({className: 'tb-manage-widgets__title', item: 'Manage widgets'}),
            filler(),
            button({
                className: 'tb-manage-widgets__done',
                text: 'Done',
                minimal: true,
                onClick: () => (model.isManaging = false)
            })
        ]
    })
);

// Pinned footer action: reset the dashboard to its default widget layout. A plain clickable row
// (not a Hoist button) so the muted styling isn't fought by the framework's button color rules.
const resetFooter = hoistCmp.factory<HomeModel>(({model}) =>
    div({
        className: 'tb-manage-widgets__reset',
        onClick: () => model.restoreDefaults(),
        items: [Icon.reset(), span('Reset to default layout')]
    })
);

const sheetBody = hoistCmp.factory<HomeModel>(({model}) =>
    div({
        className: 'tb-manage-widgets__body',
        item: dragDropContext({
            onDragEnd: model.onDragEnd,
            items: [
                group({
                    droppableId: 'home',
                    label: 'On your home',
                    widgets: model.homeWidgets,
                    emptyText: 'No widgets on your home yet - toggle one on below.'
                }),
                group({
                    droppableId: 'available',
                    label: 'Available',
                    widgets: model.availableWidgets,
                    emptyText: 'You have added all the widgets.'
                })
            ]
        })
    })
);

interface GroupProps extends HoistProps {
    droppableId: string;
    label: string;
    widgets: WidgetSpec[];
    emptyText: string;
}

const group = hoistCmp.factory<GroupProps>(({droppableId, label, widgets, emptyText}) => {
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
                                ? div({className: 'tb-manage-widgets__empty', item: emptyText})
                                : widgets.map((w, idx) => widgetRow({key: w.id, w, idx, onHome})),
                            dndProps.placeholder
                        ]
                    })
            })
        ]
    });
});

interface WidgetRowProps extends HoistProps<HomeModel> {
    w: WidgetSpec;
    idx: number;
    onHome: boolean;
}

const widgetRow = hoistCmp.factory<WidgetRowProps>(({model, w, idx, onHome}) =>
    draggable({
        key: w.id,
        draggableId: w.id,
        index: idx,
        children: (dndProps, dndState) => rowContent(model, w, onHome, dndProps, dndState)
    })
);

// Row markup rendered inside the draggable's render-prop. A plain helper (not a factory) since it
// receives rbd's dnd props directly and reads no observables of its own.
function rowContent(
    model: HomeModel,
    w: WidgetSpec,
    onHome: boolean,
    dndProps,
    dndState
): ReactElement {
    return div({
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
                value: onHome,
                onChange: v => model.setOnHome(w.id, v)
            })
        ]
    });
}
