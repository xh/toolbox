import {hoistCmp, HoistModel, managed, useLocalModel} from '@xh/hoist/core';
import {a, code, div, filler, hframe, iframe} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {panel, PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';

import './ExamplesTab.scss';
import {ToolboxLink} from '../../../core/cmp/ToolboxLink';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {directoryPanel} from '../../../examples/contact/DirectoryPanel';
import {todoPanel} from '../../../examples/todo/TodoPanel';
import {recallsPanel} from '../../../examples/recalls/RecallsPanel';
import {fileManager} from '../../../examples/filemanager/FileManager';
import {newsPanel} from '../../../examples/news/NewsPanel';
import {portfolioPanel} from '../../../examples/portfolio/PortfolioPanel';


export const examplesTab = hoistCmp.factory(
    () => {
        const impl = useLocalModel(LocalModel);
        return panel({
            className: 'tb-examples-tab',
            items: [
                hframe({
                    items: [
                        sideBar({
                            model: impl,
                            omit: !impl.leftPanelModel.collapsed
                        }),
                        appTileBar({
                            model: impl
                        }),
                        panel({
                            className: 'tb-examples-tab__app-frame',
                            item: iframe({
                                height: '100%',
                                width: '100%',
                                className: 'app-frame',
                                src: impl.examples.find(e => e.title === impl.activeApp).path
                            })
                        })
                    ]
                })
            ]
        });
    }
);

const appTileBar = hoistCmp.factory(({model}) => {
    return panel({
        model: model.leftPanelModel,
        items: div({
            className: 'app-tile-container',
            items: model.examples.map(e => panel({
                className: `app-tile ${e.title === model.activeApp ? 'app-tile__selected' : ''}`,
                title: e.title,
                icon: e.icon,
                compactHeader: true,
                items: div({
                    className: 'app-tile-contents',
                    items: e.text
                }),
                bbar: toolbar({
                    omit: e.title !== model.activeApp,
                    compact: true,
                    items: [
                        filler(),
                        button({
                            outlined: true,
                            icon: Icon.link(),
                            text: 'Open in Tab',
                            onClick: () => window.open(e.path)
                        })]
                }),
                onClick: () => model.setActiveApp(e.title)
            }))
        })
    });
});


const sideBar = hoistCmp.factory(({model}) => {
    return toolbar({
        className: 'app-toolbar',
        items: [...model.examples.map(e => button({
            icon: e.icon,
            onClick: () => model.activeApp === e.title ? window.open(e.path) : model.setActiveApp(e.title)
        })),
        button({
            icon: Icon.chevronRight(),
            onClick: () => model.leftPanelModel.collapsed = false
        })],
        vertical: true
    });
});

class LocalModel extends HoistModel {

    @bindable activeApp = 'Portfolio';

    @managed
    leftPanelModel = new PanelModel(
        {
            defaultSize: 300,
            collapsible: true,
            resizable: false,
            side: 'left'
        }
    )

    get examples() {
        return [
            {
                title: 'Portfolio',
                icon: Icon.portfolio(),
                path: '/portfolio',
                cmp: () => portfolioPanel(),
                text: [
                    <p>
                        This example shows a synthetic portfolio analysis tool. Includes examples of large data-set
                        grids,
                        master-detail grids, charting, and dimensional analysis.
                    </p>,
                    <p>
                        The view layer of this app has been implemented with both elem factories as well as the more
                        standard
                        JSX approach. Toggle between the two in options, and compare the component
                        source code <ToolboxLink url='$TB/client-app/src/examples/portfolio/ui' text='here'/>.
                    </p>
                ]
            },
            {
                title: 'Contact',
                icon: Icon.users(),
                path: '/contact',
                cmp: () => directoryPanel(),
                text: [
                    <p>
                        Meet the Extremely Heavy team!
                    </p>,
                    <p>
                        This example shows an employee directory application. Includes multiple views of a store,
                        including
                        combined filter and search functionality, editable profiles and remote persistence of settings
                        via
                        soft config.
                    </p>
                ]
            },
            {
                title: 'Todo',
                icon: Icon.clipboard(),
                path: '/todo',
                cmp: () => todoPanel(),
                text: [
                    <p>
                        The classic reference app, Hoist style.
                    </p>,
                    <p>
                        Includes examples of a grid with RecordActions and RecordActionBar, a form with validation,
                        modal dialogs, and the preference system.
                    </p>
                ]
            },
            {
                title: 'News',
                icon: Icon.news(),
                path: '/news',
                cmp: () => newsPanel(),
                text: [
                    <p>
                        This example demonstrates Hoist support for loading and caching data on the server from
                        a {link('Remote API', 'https://newsapi.org/')}. Refresh rate, news sources, and API key can
                        be modified in the Admin Config tab.
                    </p>,
                    <p>
                        On the client side, we use a {link(code('DataView'), '../app/grids/dataview')} grid
                        to support custom filtering logic and rich component rendering.
                    </p>
                ]
            },
            {
                title: 'FDA Recalls',
                icon: Icon.health(),
                path: '/recalls',
                cmp: () => recallsPanel(),
                text: [
                    <p>
                        This applet uses the openFDA drug enforcement reports API, which provides information on drug
                        recall
                        events since 2004. Provides examples of filtering and searching data from an external API.
                    </p>,
                    <p>
                        For more information, see {link('here', 'https://open.fda.gov/apis/drug/enforcement/')}.
                    </p>
                ]
            },
            {
                title: 'File Manager',
                icon: Icon.fileArchive(),
                path: '/fileManager',
                cmp: () => fileManager(),
                text: [
                    <p>
                        This example shows a simple, full-stack pattern for syncing files to a server.
                    </p>,
                    <p>
                        On the client side this app uses the {link(code('FileChooser'), '/app/other/fileChooser')}.
                        The server-side controller and service provide examples of how uploads can
                        be extracted from the request and processed within Grails.
                    </p>,
                    <p>
                        <strong>This example is visible only to admins</strong> to avoid
                        arbitrary file uploads to our server.
                        Please {link('contact us', 'https://xh.io/contact/')} for access.
                    </p>
                ]
            }
        ];
    }

    constructor() {
        super();
        makeObservable(this);
    }
}


const link = (txt, url) => a({href: url, target: '_blank', item: txt});
