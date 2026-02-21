import {HoistModel, managed} from '@xh/hoist/core';
import {PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon/Icon';
import {makeObservable, bindable} from '@xh/hoist/mobx';
import {code, p, strong} from '@xh/hoist/cmp/layout';

export class ExamplesTabModel extends HoistModel {
    @managed
    leftPanelModel: PanelModel = new PanelModel({
        defaultSize: 300,
        collapsible: true,
        resizable: false,
        side: 'left'
    });

    @bindable activeApp: string = 'Portfolio';

    get activeAppConfig() {
        return this.examples.find(it => it.title === this.activeApp);
    }

    examples = [
        {
            title: 'Portfolio',
            icon: Icon.portfolio(),
            path: 'portfolio',
            srcPath: 'portfolio',
            text: [
                p('Hello Fintech! 👋'),
                p(
                    'A highly simplified portfolio analysis tool, this example includes tree-based data loaded into ',
                    code('Grid'),
                    ", a detail panel that responds to the user's selection, a Hoist ",
                    code('TreeMap'),
                    ', and timeseries charting.'
                )
            ]
        },
        {
            title: 'Weather',
            icon: Icon.sun(),
            path: 'weather',
            srcPath: 'weather',
            text: [
                p(
                    'A weather dashboard backed by the OpenWeatherMap API, with server-side caching and auto-refresh.'
                ),
                p(
                    'Uses a ',
                    code('DashCanvas'),
                    ' layout with multiple chart types and a ',
                    code('Grid'),
                    ' summary view.'
                ),
                p(
                    '✨This example was coded entirely by AI (Claude) without any human-written application code.'
                )
            ]
        },
        {
            title: 'Contact',
            icon: Icon.users(),
            path: 'contact',
            srcPath: 'contact',
            text: [
                p('Meet the Extremely Heavy team.'),
                p(
                    'This demo of an employee directory app features multiple views of data within a Hoist ',
                    code('Store'),
                    ', search + filter controls, and lightweight server-side persistence leveraging ',
                    code('AppConfig'),
                    '.'
                )
            ]
        },
        {
            title: 'TODO',
            icon: Icon.clipboard(),
            path: 'todo',
            srcPath: 'todo',
            text: [
                p('The classic reference app, Hoist style.'),
                p(
                    'Includes examples of a grid with ',
                    code('RecordAction'),
                    ', a ',
                    code('Form'),
                    ' with validation, modal dialogs, and Preferences.'
                )
            ]
        },
        {
            title: 'News',
            icon: Icon.news(),
            path: 'news',
            srcPath: 'news',
            text: [
                p(
                    'Demonstrates how the Hoist server can load and cache data from an external API.'
                ),
                p(
                    'On the client, a ',
                    code('DataView'),
                    ' supports custom filtering logic and rich component rendering.'
                )
            ]
        },
        {
            title: 'FDA Recalls',
            icon: Icon.health(),
            path: 'recalls',
            srcPath: 'recalls',
            text: [
                p(
                    'Another example that loads data from a remote API, with ',
                    code('Store'),
                    ' based filtering and a master-detail view controlled by ',
                    code('Grid'),
                    ' selection.'
                )
            ]
        },
        {
            title: 'File Manager',
            icon: Icon.fileArchive(),
            path: 'fileManager',
            srcPath: 'filemanager',
            text: [
                p('A simple, full-stack pattern for file uploads.'),
                p(
                    'A ',
                    code('FileChooser'),
                    ' accepts local files and uploads to a server-side controller and service for processing.'
                ),
                p(
                    strong('This example is visible only to admins'),
                    ' to prevent arbitrary file uploads. Contact us for a walkthrough.'
                )
            ]
        }
    ];

    constructor() {
        super();
        makeObservable(this);
    }
}
