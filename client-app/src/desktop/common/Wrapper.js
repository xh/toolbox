import {hoistCmp, HoistModel, managed, useLocalModel, XH} from '@xh/hoist/core';
import PT from 'prop-types';
import {box, table, tbody, td, th, tr} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {dockContainer, DockContainerModel} from '@xh/hoist/cmp/dock';
import {toolboxLink} from '../../core/cmp/ToolboxLink';
import './Wrapper.scss';

/**
 * A styled panel used to wrap component examples within Toolbox.
 */
export const [Wrapper, wrapper] = hoistCmp.withFactory({
    displayName: 'Wrapper',
    className: 'tbox-wrapper xh-tiled-bg',
    model: false,

    render({className, description, links, children, ...rest}) {

        const localModel = useLocalModel(() => new Model(links));

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
                    model: localModel.dockContainerModel,
                    compactHeaders: true,
                    omit: !links
                })
            ],
            ...rest
        });
    }
});

Wrapper.propTypes = {
    /**
     * Intro text or description for the Component/pattern demo'd by this tab.
     */
    description: PT.oneOfType([PT.array, PT.element, PT.string]),

    /**
     * Links to display for this tab, pointing either to relevant source code within XH
     * repos or to external sites (e.g. docs for key external components). Links should be
     * provided as objects with `url` and `text` properties for the link itself, as well as an
     * optional `notes` property for additional descriptive text.
     *
     * @see ToolboxLink for additional details.
     */
    links: PT.arrayOf(PT.object)
};

class Model extends HoistModel {

    @managed
    dockContainerModel = new DockContainerModel();

    constructor(links) {
        super();
        if (links) {
            this.dockContainerModel.addView({
                id: XH.genId(),
                icon: Icon.link(),
                title: 'Links',
                allowDialog: false,
                allowClose: false,
                collapsed: !XH.getPref('expandDockedLinks'),
                content: () => panel({
                    className: 'tbox-wrapper__links',
                    item: this.createLinksWithNotes(links),
                    width: 400
                })
            });
        }
    }

    createLinksWithNotes(links) {
        return table(
            tbody(
                links.map(link => {
                    return tr(
                        th(toolboxLink(link)),
                        td(link.notes || '')
                    );
                })
            )
        );
    }
}