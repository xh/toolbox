import React from 'react';
import {hoistComponent} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {wrapper} from '../../common/Wrapper';

import './IconsPanel.scss';

export const IconsPanel = hoistComponent(
    () => wrapper({
        description: [
            <p>
                Hoist includes the latest version of the
                ubiquitous <a href="https://fontawesome.com/icons" target="_blank">Font Awesome</a> library
                and its companion project, react-fontawesome. Hoist exports an <code>Icon</code> constant
                to expose a preselected set of icons as element factories. This ensures that many
                of the most common glyphs are built-in (while also mapping icons to several
                concepts particular to finance and trading).
            </p>,
            <p>
                Apps are not limited to the set of FA icons imported by the framework.
                Developers can use any icon from the library, as long as they import those
                glyphs directly to include them in the bundled output.
            </p>
        ],
        links: [
            {
                url: '$TB/client-app/src/desktop/tabs/other/IconsPanel.js',
                notes: 'This example.'
            },
            {
                url: 'https://fontawesome.com/icons',
                text: 'FontAwesome',
                notes: 'The library used by Hoist to provide enumerated icons. Note that not all icons are included in the Hoist Icon class, but can be easily added.'
            }
        ],
        item: panel({
            title: 'Icons (regular, solid, and light variants)',
            icon: Icon.thumbsUp(),
            className: 'toolbox-icons-panel',
            width: 700,
            item: [
                <div className="toolbox-icons-table-scroller">
                    <table>
                        <tbody>
                            {getAllIcons().map(icon => row(icon))}
                        </tbody>
                    </table>
                </div>
            ]
        })
    })
);


function row(icon) {
    return <tr key={icon.name}>
        <th>{icon.name}</th>
        <td>{icon.regular}</td>
        <td>{icon.solid}</td>
        <td>{icon.light}</td>
    </tr>;
}


function getAllIcons() {
    return Object.keys(Icon).map(key => ({
        regular: Icon[key]({size: '2x'}),
        solid: Icon[key]({prefix: 'fas', size: '2x'}),
        light: Icon[key]({prefix: 'fal', size: '2x'}),
        name: key
    }));
}
