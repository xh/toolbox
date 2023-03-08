import {HoistModel, managed} from '@xh/hoist/core';
import {PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon/Icon';
import {makeObservable, bindable} from '@xh/hoist/mobx';
import React from 'react';

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
                <p>Hello Fintech! 👋</p>,
                <p>
                    A highly simplified portfolio analysis tool, this example includes tree-based
                    data loaded into <code>Grid</code>, a detail panel that responds to the user's
                    selection, a Hoist <code>TreeMap</code>, and timeseries charting.
                </p>
            ]
        },
        {
            title: 'Contact',
            icon: Icon.users(),
            path: 'contact',
            srcPath: 'contact',
            text: [
                <p>Meet the Extremely Heavy team.</p>,
                <p>
                    This demo of an employee directory app features multiple views of data within a
                    Hoist <code>Store</code>, search + filter controls, and lightweight server-side
                    persistence leveraging <code>AppConfig</code>.
                </p>
            ]
        },
        {
            title: 'TODO',
            icon: Icon.clipboard(),
            path: 'todo',
            srcPath: 'todo',
            text: [
                <p>The classic reference app, Hoist style.</p>,
                <p>
                    Includes examples of a grid with <code>RecordAction</code>, a <code>Form</code>
                    with validation, modal dialogs, and Preferences.
                </p>
            ]
        },
        {
            title: 'News',
            icon: Icon.news(),
            path: 'news',
            srcPath: 'news',
            text: [
                <p>
                    Demonstrates how the Hoist server can load and cache data from an external API.
                </p>,
                <p>
                    On the client, a <code>DataView</code> supports custom filtering logic and rich
                    component rendering.
                </p>
            ]
        },
        {
            title: 'FDA Recalls',
            icon: Icon.health(),
            path: 'recalls',
            srcPath: 'recalls',
            text: [
                <p>
                    Another example that loads data from a remote API, with <code>Store</code> based
                    filtering and a master-detail view controlled by <code>Grid</code> selection.
                </p>
            ]
        },
        {
            title: 'File Manager',
            icon: Icon.fileArchive(),
            path: 'fileManager',
            srcPath: 'filemanager',
            text: [
                <p>A simple, full-stack pattern for file uploads.</p>,
                <p>
                    A <code>FileChooser</code> accepts local files and uploads to a server-side
                    controller and service for processing.
                </p>,
                <p>
                    <strong>This example is visible only to admins</strong> to prevent arbitrary
                    file uploads. Contact us for a walkthrough.
                </p>
            ]
        }
    ];

    constructor() {
        super();
        makeObservable(this);
    }
}
