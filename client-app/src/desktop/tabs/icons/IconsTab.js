import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core/index';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../common/Wrapper';
import {Icon} from '@xh/hoist/icon';

import './IconsTab.scss';

@HoistComponent
export class IconsTab extends Component {

    render() {
        const row = icon => <tr key={icon.name}>
            <th>{icon.name}</th>
            <td>{icon.regular}</td>
            <td>{icon.solid}</td>
            <td>{icon.light}</td>
        </tr>;

        return wrapper({
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
            item: panel({
                title: 'Icons (regular, solid, and light variants)',
                icon: Icon.thumbsUp(),
                className: 'toolbox-icons-panel',
                width: 700,
                item: [
                    <div className="toolbox-icons-table-scroller">
                        <table>
                            <tbody>
                                {this.getAllIcons().map(icon => row(icon))}
                            </tbody>
                        </table>
                    </div>
                ]
            })
        });
    }

    getAllIcons() {
        return Object.keys(Icon).map(key => ({
            regular: Icon[key]({size: '2x'}),
            solid: Icon[key]({prefix: 'fas', size: '2x'}),
            light: Icon[key]({prefix: 'fal', size: '2x'}),
            name: key
        }));
    }

}
