import {div, hframe, vbox, vframe} from '@xh/hoist/cmp/layout';
import {hoistCmp, HoistProps, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {isEmpty} from 'lodash';
import {ReactElement, ReactNode} from 'react';
import {toolboxLink, ToolboxLinkProps} from '../../core/cmp/ToolboxLink';
import type {AppModel} from '../AppModel';
import './Wrapper.scss';

export interface WrapperProps extends HoistProps {
    /** Component/pattern name shown in the info rail header. */
    title: ReactNode;

    /** Optional icon shown beside the title in the info rail header. */
    icon?: ReactElement;

    /** Intro text or description for the Component/pattern demo'd by this tab. */
    description?: ReactNode;

    /**
     * Links to display for this tab, pointing either to relevant source code within XH
     * repos or to external sites. Provided as objects with `url` and optional `text` / `notes`.
     */
    links?: ToolboxLinkProps[];
}

/** A styled container used to wrap component examples within Toolbox. */
export const [Wrapper, wrapper] = hoistCmp.withFactory<WrapperProps>({
    displayName: 'Wrapper',
    className: 'tbox-wrapper',
    render({className, title, icon, description, links, children}) {
        const collapsed = (XH.appModel as AppModel).wrapperRailCollapsed;
        return hframe({
            className,
            items: [
                collapsed ? collapsedRail() : infoRail({title, icon, description, links}),
                vframe({className: 'tbox-wrapper__demo', items: children})
            ]
        });
    }
});

const infoRail = hoistCmp.factory<WrapperProps>({
    render({title, icon, description, links}) {
        return panel({
            className: 'tbox-wrapper__rail',
            title,
            icon,
            compactHeader: true,
            width: 320,
            headerItems: [
                button({
                    icon: Icon.chevronLeft(),
                    title: 'Collapse info panel',
                    onClick: () =>
                        (XH.appModel as AppModel).setBindable('wrapperRailCollapsed', true)
                })
            ],
            item: div({
                className: 'tbox-wrapper__rail-body',
                items: [
                    div({
                        className: 'tbox-wrapper__intro',
                        item: description,
                        omit: !description
                    }),
                    div({
                        className: 'tbox-wrapper__divider',
                        omit: !description || isEmpty(links)
                    }),
                    resources({links})
                ]
            })
        });
    }
});

interface ResourcesProps extends HoistProps {
    links?: ToolboxLinkProps[];
}

const resources = hoistCmp.factory<ResourcesProps>({
    render({links}) {
        if (isEmpty(links)) return null;
        return div({
            className: 'tbox-wrapper__resources',
            items: [
                div({className: 'tbox-wrapper__resources-label', item: 'Resources'}),
                ...links.map(link =>
                    div({
                        className: 'tbox-wrapper__resource',
                        items: [
                            link.url.startsWith('http') ? Icon.openExternal() : Icon.code(),
                            div({
                                className: 'tbox-wrapper__resource-text',
                                items: [
                                    toolboxLink(link),
                                    div({
                                        className: 'tbox-wrapper__resource-note',
                                        item: link.notes,
                                        omit: !link.notes
                                    })
                                ]
                            })
                        ]
                    })
                )
            ]
        });
    }
});

const collapsedRail = hoistCmp.factory({
    render() {
        const expand = () => (XH.appModel as AppModel).setBindable('wrapperRailCollapsed', false);
        return vbox({
            className: 'tbox-wrapper__rail-collapsed',
            title: 'Show info panel',
            onDoubleClick: expand,
            items: [
                button({icon: Icon.chevronRight(), title: 'Show info panel', onClick: expand}),
                Icon.info({className: 'tbox-wrapper__rail-collapsed-hint'})
            ]
        });
    }
});
