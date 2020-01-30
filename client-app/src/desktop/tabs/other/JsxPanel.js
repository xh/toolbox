import React from 'react';
import {hoistCmp} from '@xh/hoist/core';
import {hframe} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {jsonInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {wrapper} from '../../common';

import './JsxPanel.scss';

export const jsxPanel = hoistCmp.factory(
    () => wrapper({
        description: [
            <p>
                JSX is the XML-like extension to Javascript typically used to specify
                and configure React components. While most React guides and examples on the web
                will use JSX, Hoist React provides an alternative native Javascript syntax based
                on a factory pattern.
            </p>,
            <p>
                Hoist encourages the use of its <code>elemFactory()</code> method to create and export
                factory methods for custom components. These methods take a configuration
                object where properties and child elements are specified without any wrapping
                braces or additional syntax required.
            </p>,
            <p>
                We believe that the factory approach excels for declarative specification
                of code-heavy element trees.  For element trees with a significant amount of
                hypertext, JSX might be a better choice. Both can be used interchangably, even within
                the same render method.
            </p>
        ],
        item: hframe({
            items: [
                panel({
                    flex: 1,
                    className: 'toolbox-jsx-example',
                    icon: Icon.factory({prefix: 'fas', size: 'lg'}),
                    title: 'Using Factories',
                    item: renderCode(getElemExample(), 'text/javascript')
                }),
                panel({
                    flex: 1,
                    className: 'toolbox-jsx-example',
                    icon: Icon.code({size: 'lg'}),
                    title: 'Using JSX',
                    item: renderCode(getJsxExample(), 'text/typescript-jsx')
                })
            ]
        })
    })
);

//------------------------
// Implementation
//------------------------
function renderCode(value, mode) {
    return jsonInput({
        flex: 1,
        width: null,
        height: null,
        editorProps: {mode, readOnly: true},
        value: value.trim(),
        linter: null
    });
}

function getElemExample() {
    return `
render() {
    return hframe({
        ...this.props,
        className: 'xh-log-viewer',
        items: [
            panel({
                item: grid({model: files}),
                bbar: toolbar(
                    ...buttonCfgs.map(props => button(props)),
                    deleteButton({
                        omit: !XH.getUser().isHoistAdmin,
                        onClick: () => {
                            this.doDelete();
                        }
                    }),
                    filler(),
                    storeFilterField({gridModel: files})
                 )
            }),
            logViewer({model}),
            mask({model: loadModel})
        ]
    });
}
    `;
}

function getJsxExample() {
    return `
render() {
    return (
        <HFrame
            {...this.props}
            className="xh-log-viewer"
        >
            <Panel
                bbar={
                    <Toolbar>
                        {
                            buttonCfgs.map(props => {
                                return <Button {...props} />;
                            })
                        }
                        {
                            XH.getUser().isHoistAdmin &&
                                <DeleteButton
                                    onClick={
                                        () => {
                                            this.doDelete();
                                        }
                                    }
                                />
                        }
                        <Filler />
                        <StoreFilterField gridModel={files}/>
                    </Toolbar>
                }
            >
                <Grid model={files} />
            </Panel>
            <LogViewer model={model} />
            <Mask model={loadModel} />
        </HFrame>
    );
}
    `;
}

