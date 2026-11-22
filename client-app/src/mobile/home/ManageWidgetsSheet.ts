import {div, filler, hbox, span} from '@xh/hoist/cmp/layout';
import type {HoistProps} from '@xh/hoist/core';
import {hoistCmp, uses} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {dragDropProvider, isSortable, useDroppable, useSortable} from '@xh/hoist/kit/dnd-kit';
import {button} from '@xh/hoist/mobile/cmp/button';
import {switchInput} from '@xh/hoist/mobile/cmp/input';
import classNames from 'classnames';
import {isEmpty} from 'lodash';
import {createPortal} from 'react-dom';
import {pullUpSheet} from '../cmp/pullUpSheet/PullUpSheet';
import type {WidgetGroup} from './HomeModel';
import {HomeModel} from './HomeModel';
import type {WidgetSpec} from './widgets/WidgetCatalog';
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

        // Portal the sheet to <body>, out of the Hoist navigator's Swiper wrapper and its CSS transform.
        return createPortal(
            pullUpSheet({
                className: 'tb-manage-widgets',
                isExpanded: true,
                onExpandedChange: v => (model.isManaging = v),
                peekItem: header(),
                children: sheetBody(),
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
        children: [
            span({className: 'tb-manage-widgets__title', children: 'Manage widgets'}),
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
        children: [Icon.reset(), span('Reset to default layout')]
    })
);

const sheetBody = hoistCmp.factory<HomeModel>(({model}) =>
    div({
        className: 'tb-manage-widgets__body',
        children: dragDropProvider({
            // React renders the live order, so dnd-kit never moves a row's DOM node between lists.
            onDragOver: e => {
                e.preventDefault();
                const {source, target} = e.operation;
                if (!source || !target) return;
                if (isSortable(target)) {
                    model.previewMove(
                        String(source.id),
                        target.group as WidgetGroup,
                        String(target.id)
                    );
                } else if (model.isEmptyBesides(target.id as WidgetGroup, String(source.id))) {
                    // Over a list's padding, not a row - only an empty list takes the drop there.
                    model.previewMove(String(source.id), target.id as WidgetGroup);
                }
            },
            onDragEnd: e => (e.canceled ? model.cancelDrag() : model.commitDrag()),
            children: [
                group({
                    groupId: 'home',
                    label: 'On your home',
                    widgets: model.homeWidgets,
                    emptyText: 'No widgets on your home yet - toggle one on below.'
                }),
                group({
                    groupId: 'available',
                    label: 'Available',
                    widgets: model.availableWidgets,
                    emptyText: 'You have added all the widgets.'
                })
            ]
        })
    })
);

interface GroupProps extends HoistProps {
    groupId: WidgetGroup;
    label: string;
    widgets: WidgetSpec[];
    emptyText: string;
}

const group = hoistCmp.factory<GroupProps>(({groupId, label, widgets, emptyText}) => {
    // The list itself is a drop target, so an empty list can still take a widget.
    const {ref} = useDroppable({id: groupId, accept: 'widget', collisionPriority: 0});
    return div({
        className: 'tb-manage-widgets__group',
        children: [
            div({className: 'tb-manage-widgets__group-label', children: label}),
            div({
                className: 'tb-manage-widgets__list',
                ref,
                children: isEmpty(widgets)
                    ? div({className: 'tb-manage-widgets__empty', children: emptyText})
                    : widgets.map((w, idx) => widgetRow({key: w.id, w, idx, groupId}))
            })
        ]
    });
});

interface WidgetRowProps extends HoistProps<HomeModel> {
    w: WidgetSpec;
    idx: number;
    groupId: WidgetGroup;
}

const widgetRow = hoistCmp.factory<WidgetRowProps>(({model, w, idx, groupId}) => {
    const sortable = useSortable({
        id: w.id,
        index: idx,
        group: groupId,
        type: 'widget',
        accept: 'widget'
    });
    return div({
        className: classNames(
            'tb-manage-widgets__row',
            sortable.isDragging && 'tb-manage-widgets__row--dragging'
        ),
        ref: sortable.ref,
        children: [
            // Drag handle owns the drag gesture, so the toggle stays independently tappable.
            div({
                className: 'tb-manage-widgets__grip',
                ref: sortable.handleRef,
                'aria-label': w.title,
                children: Icon.grip({prefix: 'fas'})
            }),
            div({className: 'tb-manage-widgets__row-icon', children: w.icon}),
            span({className: 'tb-manage-widgets__row-title', children: w.title}),
            filler(),
            switchInput({
                value: groupId === 'home',
                onChange: v => model.setOnHome(w.id, v)
            })
        ]
    });
});
