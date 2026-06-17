import {div, filler, hbox} from '@xh/hoist/cmp/layout';
import {hoistCmp, HoistProps} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import classNames from 'classnames';
import {ReactElement, ReactNode} from 'react';
import './WidgetCard.scss';

export interface WidgetCardProps extends HoistProps {
    /** Small-caps title shown in the quiet header. */
    title: ReactNode;

    /** Icon shown to the left of the title. */
    icon: ReactElement;

    /** True to show only the header bar, hiding the body. */
    collapsed: boolean;

    /** Called when the header is tapped - the consumer flips `collapsed`. */
    onToggleCollapsed: () => void;

    /** Widget body, revealed when not collapsed. */
    children?: ReactNode;
}

/**
 * The quiet card shell wrapping every mobile home-dashboard widget - a small-caps title bar with a
 * leading icon and a collapse chevron, over the widget's content. Tapping the header collapses the
 * card to just its title bar so a long personalized stack stays skimmable. Deliberately lighter than
 * the standard mobile panel header to read as a calm, consistent dashboard surface.
 */
export const widgetCard = hoistCmp.factory<WidgetCardProps>({
    displayName: 'WidgetCard',

    render({title, icon, collapsed, onToggleCollapsed, children}) {
        return div({
            className: classNames('tb-widget-card', collapsed && 'tb-widget-card--collapsed'),
            items: [
                hbox({
                    className: 'tb-widget-card__header',
                    onClick: onToggleCollapsed,
                    items: [
                        div({className: 'tb-widget-card__header-icon', item: icon}),
                        div({className: 'tb-widget-card__header-title', item: title}),
                        filler(),
                        div({
                            className: 'tb-widget-card__header-chevron',
                            item: collapsed ? Icon.chevronDown() : Icon.chevronUp()
                        })
                    ]
                }),
                div({
                    className: 'tb-widget-card__body',
                    omit: collapsed,
                    item: children
                })
            ]
        });
    }
});
