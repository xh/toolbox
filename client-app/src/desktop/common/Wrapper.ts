import {div, table, tbody, td, th, tr, vframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, HoistProps, managed, XH} from '@xh/hoist/core';
import {dockContainer, DockContainerModel} from '@xh/hoist/desktop/cmp/dock';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {ReactNode} from 'react';
import {toolboxLink, ToolboxLinkProps} from '../../core/cmp/ToolboxLink';
import './Wrapper.scss';

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
    className: 'tbox-wrapper',
    model: creates(() => WrapperModel, {publishMode: 'limited'}),
    render({model, className, description, children, ...props}) {
        const {dockContainerModel} = model;
        return vframe({
            className,
            items: [
                div({
                    className: `tbox-wrapper__description`,
                    item: description,
                    omit: !description
                }),
                vframe({
                    className: `tbox-wrapper__content`,
                    items: children
                }),
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
