import {hoistCmp} from '@xh/hoist/core';
import {codeInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {wrapper} from '../../common';
import './JsxPanel.scss';

export const jsxPanel = hoistCmp.factory(() =>
    wrapper({
        title: 'JSX',
        icon: Icon.code(),
        description: [
            'JSX is the XML-like extension to Javascript typically used to specify and',
            'configure React components. While most React guides and examples on the web will',
            'use JSX, Hoist React provides an alternative native Javascript syntax based on a',
            'factory pattern.',
            '',
            'Hoist encourages the use of its `elemFactory()` method to create and export',
            'factory methods for custom components. These methods take a configuration object',
            'where properties and child elements are specified without any wrapping braces or',
            'additional syntax required.',
            '',
            'We believe that the factory approach excels for declarative specification of',
            'code-heavy element trees. For element trees with a significant amount of',
            'hypertext, JSX might be a better choice. Both can be used interchangeably, even',
            'within the same render method.',
            '',
            "The two snippets below are rendered with Hoist's `codeInput` (powered by CodeMirror",
            '6), each using the language mode best suited to its syntax - plain JavaScript on the',
            'left and JSX on the right.'
        ],
        links: [
            {url: '$TB/client-app/src/desktop/tabs/other/JsxPanel.tsx', notes: 'This example.'},
            {
                url: '$HR/core/README.md',
                text: 'Core docs',
                notes: 'Core framework guide, including element factories.'
            },
            {
                url: '$HR/core/elem.ts',
                notes: 'elemFactory() and related helpers for the Hoist factory syntax.'
            }
        ],
        item: panel({
            className: 'tb-jsx-panel',
            contentBoxProps: {flexDirection: 'row', padding: true, gap: true},
            items: [
                panel({
                    flex: 1,
                    className: 'tb-jsx-example',
                    title: 'Using Factories',
                    icon: Icon.factory({prefix: 'fas'}),
                    compactHeader: true,
                    item: renderCode(getElemExample(), 'js')
                }),
                panel({
                    flex: 1,
                    className: 'tb-jsx-example',
                    title: 'Using JSX',
                    icon: Icon.code(),
                    compactHeader: true,
                    item: renderCode(getJsxExample(), 'jsx')
                })
            ]
        })
    })
);

//------------------------
// Implementation
//------------------------
function renderCode(value: string, language: string) {
    return codeInput({
        flex: 1,
        width: null,
        height: null,
        readonly: true,
        highlightActiveLine: true,
        language,
        value: value.trim()
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
                        onClick: () => this.doDelete()
                    }),
                    filler(),
                    storeFilterField({gridModel: files})
                 )
            }),
            logViewer({model}),
            mask({model: loadObserver})
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
                                    onClick={() => this.doDelete()}}
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
            <Mask model={loadObserver} />
        </HFrame>
    );
}
    `;
}
