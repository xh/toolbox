import {hoistCmp, HoistModel, managed, XH, creates, HoistProps} from '@xh/hoist/core';
import {box, table, tbody, td, th, tr} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {dockContainer, DockContainerModel} from '@xh/hoist/desktop/cmp/dock';
import {toolboxLink, ToolboxLinkProps} from '../../core/cmp/ToolboxLink';
import './Wrapper.scss';
import {ReactNode} from 'react';

export interface WrapperProps extends HoistProps<WrapperModel> {
    /**
     * Intro text or description for the Component/pattern demo'd by this tab.
     */
    description?: ReactNode;

    /**
     * Links to display for this tab, pointing either to relevant source code within XH
     * repos or to external sites (e.g. docs for key external components). Links should be
     * provided as objects with `url` and `text` properties for the link itself, as well as an
     * optional `notes` property for additional descriptive text.*
     */
    links?: ToolboxLinkProps[];
}

/**
 * A styled panel used to wrap component examples within Toolbox.
 */
export const [Wrapper, wrapper] = hoistCmp.withFactory<WrapperProps>({
    displayName: 'Wrapper',
    className: 'tbox-wrapper xh-tiled-bg',
    model: creates(() => WrapperModel, {publishMode: 'limited'}),
    render({model, className, description, children, ...props}) {
        const {dockContainerModel} = model;
        return box({
            className,
            items: [
                panel({
                    className: 'tbox-wrapper__description',
                    item: description,
                    omit: !description
                }),
                children,
                dockContainer({
                    model: dockContainerModel,
                    omit: !dockContainerModel,
                    compactHeaders: true
                })
            ],
            ...props
        });
    }
});

class WrapperModel extends HoistModel {
    @managed
    dockContainerModel: DockContainerModel = null;

    override onLinked() {
        const {links} = this.componentProps;
        if (links) {
            this.dockContainerModel = new DockContainerModel();
            this.dockContainerModel.addView({
                id: XH.genId(),
                icon: Icon.link(),
                title: 'Links',
                allowDialog: false,
                allowClose: false,
                collapsed: !XH.getPref('expandDockedLinks'),
                content: () =>
                    panel({
                        className: 'tbox-wrapper__links',
                        item: this.createLinksWithNotes(links),
                        width: 400
                    })
            });
        }
    }

    private createLinksWithNotes(links: ToolboxLinkProps[]) {
        return table(tbody(links.map(link => tr(th(toolboxLink(link)), td(link.notes ?? '')))));
    }
}
