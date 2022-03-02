import {hoistCmp, HoistModel, useLocalModel} from '@xh/hoist/core';
import {a, code, div, hframe, vbox, vframe} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';

import './ExamplesTab.scss';
import {wrapper} from '../../common';
import {ToolboxLink} from '../../../core/cmp/ToolboxLink';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {directoryPanel} from '../../../examples/contact/DirectoryPanel';
import {todoPanel} from '../../../examples/todo/TodoPanel';
import {recallsPanel} from '../../../examples/recalls/RecallsPanel';
import {fileManager} from '../../../examples/filemanager/FileManager';
import {newsPanel} from './NewsPanel';
import {portfolioPanel} from './PortfolioPanel';

// TODO: Minify ToDo, Recalls, FileManager and Contact

export const examplesTab = hoistCmp.factory(
    () => {
        const impl = useLocalModel(LocalModel);
        return wrapper(
            // TODO: Need constant size for left-hand vbox
            hframe(vbox({
                // TODO: Better component than div for this? Expand size and include text if active
                items: getExamples().map(e => div({
                    className: 'app-tile',
                    items: [e.icon, e.title],
                    onMouseOver: () => impl.setActiveApp(e.title)
                    }))
                }),
                panel({
                    item: getExamples().find(e => e.title === impl.activeApp).cmp()
                })
            )
        );
    }
);


class LocalModel extends HoistModel {

    @bindable activeApp = 'Portfolio';

    constructor() {
        super();
        makeObservable(this);
    }
}

function getExamples() {
    return [
        {
            title: 'Portfolio',
            icon: Icon.portfolio(),
            path: '/portfolio',
            cmp: () => portfolioPanel(),
            text: [
                <p>
                    This example shows a synthetic portfolio analysis tool.  Includes examples of large data-set grids,
                    master-detail grids, charting, and dimensional analysis.
                </p>,
                <p>
                    The view layer of this app has been implemented with both elem factories as well as the more standard
                    JSX approach.  Toggle between the two in options, and compare the component
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
                    This example shows an employee directory application. Includes multiple views of a store, including
                    combined filter and search functionality, editable profiles and remote persistence of settings via
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
                    This applet uses the openFDA drug enforcement reports API, which provides information on drug recall
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

const link = (txt, url) => a({href: url, target: '_blank', item: txt});
