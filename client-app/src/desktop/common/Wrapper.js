import {Component} from 'react';
import {HoistComponent, elemFactory, XH} from '@xh/hoist/core';
import PT from 'prop-types';
import {box, code, table, tbody, tr, td, th} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {castArray} from 'lodash';
import {DockContainerModel, dockContainer} from '@xh/hoist/cmp/dock';
import {managed} from '@xh/hoist/core/mixins';
import {toolboxLink} from '../../common/ToolboxLink';

import './Wrapper.scss';

@HoistComponent
class Wrapper extends Component {
    
    static propTypes = {
        
        /* quick summary of the component */
        description: PT.oneOfType([PT.element, PT.string]),
        
        /*  links to source code on GitHub or external websites
        *
        *   A single link Obj should have a `url` prop and a `text` prop (see ToolboxLink).
        *   Optionally, the link Obj can have a `notes` prop, to be displayed to the right of link
        */
        links: PT.oneOfType([PT.object, PT.arrayOf(PT.object)])
    };
    
    @managed
    dockContainerModel = new DockContainerModel();
    
    constructor(props) {
        super(props);
        
        if (!this.props.links) return;
        
        this.dockContainerModel.addView({
            id: XH.genId(),
            icon: Icon.code(),
            title: code('Source Links'),
            allowDialog: false,
            allowClose: false,
            collapsed: true,
            content: panel({
                className: 'toolbox-wrapper-source-links',
                item: this.createLinksWithNotes(),
                width: 350
            })
        });
    }
    
    render() {
        const {description, children, ...rest} = this.props;
        
        return box({
            className: 'toolbox-wrapper xh-tiled-bg',
            items: [
                panel({
                    className: 'toolbox-wrapper-description',
                    item: description,
                    width: 700,
                    marginBottom: 10,
                    omit: !description
                }),
                children,
                dockContainer({
                    model: this.dockContainerModel,
                })
            ],
            ...rest
        });
    }
    
    createLinksWithNotes() {
        const arrayLinks = castArray(this.props.links);

        return table({
            className: 'toolbox-wrapper-source-links-table',
            item: tbody(arrayLinks.map(linkObj => {
                return tr(
                    th(toolboxLink(linkObj)),
                    td(this.createNotes(linkObj))
                );
            }))
        });
    }
    
    createNotes(linkObj) {
        return (linkObj.notes ? [' ', linkObj.notes] : null);
    }
}
export const wrapper = elemFactory(Wrapper);