import {ReactNode} from 'react';
import {frame, hframe} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {BaseWeatherWidgetModel} from './BaseWeatherWidgetModel';
import {widgetSettingsForm} from './WidgetSettingsForm';

/**
 * Wraps widget content in a panel with modal support for settings.
 *
 * Uses a stable React tree structure (panel > hframe > frame > content) regardless
 * of modal state so that content components (charts, grids) are never unmounted
 * and remounted when toggling the settings modal.
 *
 * When modal is inactive, the settings form is simply omitted from the hframe,
 * leaving content as the sole child filling 100% of the available space.
 *
 * Widgets without settings (no PanelModel) return the content unchanged.
 */
export function settingsAwarePanel(model: BaseWeatherWidgetModel, content: ReactNode): ReactNode {
    const {panelModel} = model;
    if (!panelModel) return content;

    return panel({
        model: panelModel,
        flex: 1,
        item: hframe({
            flex: 1,
            items: [
                frame({flex: 1, item: content}),
                panelModel.isModal ? widgetSettingsForm({widgetModel: model}) : null
            ]
        })
    });
}
