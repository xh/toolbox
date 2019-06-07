import {Component} from 'react';
import {HoistComponent, elemFactory, XH} from '@xh/hoist/core';
import PT from 'prop-types';
import {box, code, div, p} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {castArray} from 'lodash';
import {DockContainerModel, dockContainer} from '@xh/hoist/cmp/dock';
import {managed} from '@xh/hoist/core/mixins';
import {toolboxLink} from './ToolboxLink';

import './Wrapper.scss';

@HoistComponent
class Wrapper extends Component {
    
    static propTypes = {
        
        /* quick summary of the component */
        description: PT.oneOfType([PT.element, PT.string]),
        
        /* links to source code on GitHub or external websites */
        links: PT.oneOfType([PT.arrayOf(PT.object), PT.object])
    };
    
    @managed
    dockContainerModel = new DockContainerModel();
    
    constructor(props) {
        super(props);
        
        if (!this.props.links) return;
        
        this.dockContainerModel.addView({
            id: XH.genId(),
            icon: Icon.code(),
            title: code('Source Code'),
            allowDialog: false,
            allowClose: false,
            collapsed: true,
            content: panel({
                className: 'toolbox-wrapper-sourcecode',
                item: this.createLinksWithNotes()
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
                dockContainer({model: this.dockContainerModel})
            ],
            ...rest
        });
    }
    
    createLinksWithNotes() {
        const arrayLinks = castArray(this.props.links);

        return div(
            arrayLinks.map(linkObj => {
                return p(
                    toolboxLink(linkObj),
                    this.createNotes(linkObj)
                );
            })
        );
    }
    
    createNotes(linkObj) {
        if (linkObj.notes) return [' • ', linkObj.notes];
    }
}
export const wrapper = elemFactory(Wrapper);