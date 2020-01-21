import {library} from '@fortawesome/fontawesome-svg-core';
import {faIcons} from '@fortawesome/pro-regular-svg-icons';
import {hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {fontAwesomeIcon, Icon} from '@xh/hoist/icon';
import React from 'react';

import {wrapper} from '../../common/Wrapper';
import './IconsPanel.scss';

// Register a custom icon - used within this app / not pre-imported by `Icon` - imported above.
// @see https://www.npmjs.com/package/@fortawesome/react-fontawesome#build-a-library-to-reference-icons-throughout-your-app-more-conveniently
library.add(faIcons);

export const iconsPanel = hoistCmp.factory(
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
                glyphs directly and register them with FA to include them in the bundled output.
                The icon used in the panel header below provides an example of this usage.
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
            icon: fontAwesomeIcon({icon: ['far', 'icons']}),
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
