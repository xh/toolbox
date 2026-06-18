import {div} from '@xh/hoist/cmp/layout';
import {hoistCmp, HoistProps} from '@xh/hoist/core';
import classNames from 'classnames';
import {ReactNode} from 'react';
import './PullUpSheet.scss';

export interface PullUpSheetProps extends HoistProps {
    /** True when the sheet is expanded; false shows only the peek bar. Controlled by the consumer. */
    isExpanded: boolean;

    /** Called with the requested next expanded state (drag/tap on the handle, or scrim tap). */
    onExpandedChange: (expanded: boolean) => void;

    /**
     * Always-visible peek-bar content (e.g. a title + options-count chip). Tapping it toggles the
     * sheet; the grab handle above it is rendered by the sheet itself.
     */
    peekItem: ReactNode;

    /**
     * Optional content pinned to the bottom of the panel, below the scrolling body (e.g. an action).
     * The expanded body itself is passed via `item`/`items` and read from the inherited `children`.
     */
    footerItem?: ReactNode;
}

/**
 * A bottom pull-up sheet with two snap states - a peek bar and an expanded panel - over a scrim.
 * Built so the live content behind it stays full-bleed and fully interactive while peeking, with
 * the scrim only intercepting taps once expanded. Drag the handle (or tap the peek bar) to toggle.
 *
 * Net-new for the mobile kit; shared by the example-screen Options sheet and the home Manage-widgets
 * sheet. Snap physics are intentionally simple (tap + drag-threshold snap) - tunable later.
 */
export const pullUpSheet = hoistCmp.factory<PullUpSheetProps>({
    displayName: 'PullUpSheet',

    render({isExpanded, onExpandedChange, peekItem, children, footerItem, className}) {
        // Track pointer start to distinguish a tap (toggle) from a vertical drag (directional snap).
        let startY: number = null;

        const onPointerDown = (e: any) => {
            // Ignore taps that start on an interactive control in the peek (e.g. a "Done" button) -
            // let the control handle its own click. Otherwise the peek's pointerup would toggle/close
            // the sheet *before* the synthesized click fires, leaking a ghost click to whatever is
            // revealed underneath (e.g. navigating into a widget behind the sheet).
            if (e.target?.closest?.('button, .xh-button, a, input, [role="button"]')) {
                startY = null;
                return;
            }
            startY = e.clientY;
        };
        const onPointerUp = (e: any) => {
            if (startY == null) return;
            const dy = e.clientY - startY;
            startY = null;
            if (Math.abs(dy) < 8) {
                onExpandedChange(!isExpanded); // treat as a tap
            } else if (dy > 0) {
                onExpandedChange(false); // dragged down → collapse
            } else {
                onExpandedChange(true); // dragged up → expand
            }
        };

        return div({
            className: classNames(
                'tb-pull-up-sheet',
                isExpanded && 'tb-pull-up-sheet--expanded',
                className
            ),
            items: [
                div({
                    className: 'tb-pull-up-sheet__scrim',
                    onClick: () => onExpandedChange(false)
                }),
                div({
                    className: 'tb-pull-up-sheet__panel',
                    items: [
                        div({
                            className: 'tb-pull-up-sheet__peek',
                            onPointerDown,
                            onPointerUp,
                            items: [
                                div({className: 'tb-pull-up-sheet__grabber'}),
                                div({className: 'tb-pull-up-sheet__peek-content', item: peekItem})
                            ]
                        }),
                        div({className: 'tb-pull-up-sheet__body', item: children}),
                        footerItem
                            ? div({className: 'tb-pull-up-sheet__footer', item: footerItem})
                            : null
                    ]
                })
            ]
        });
    }
});
