import {castArray} from 'lodash';

import {hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {elementFromContent} from '@xh/hoist/utils/react';
import {splitButton} from '@xh/hoist/desktop/cmp/button';
import {div, fragment, hbox, p, h4, br} from '@xh/hoist/cmp/layout';

import './ButtonTestPanel.scss';


export const buttonTestPanel = hoistCmp.factory({

    // model: creates(SelectTestModel),

    render({model}) {

        return panel({
            title: 'Button tests',
            className: 'xh-tiled-bg',
            item: hbox(
                panel({
                    title: 'Split Button',
                    className: 'split-button-test-panel',
                    overflow: 'auto',
                    width: 250,
                    items: [
                        example({
                            features: [
                                'defaults:', 
                                'menuTriggerSide: \'right\'', 
                                'minimal: false', 
                                'disabled: false'
                            ],
                            content: () => splitButton({
                                text: 'Hoist Apps',
                                onClick: () => window.open('/app/examples', '_blank'),
                                menuItemConfs: [
                                    {
                                        text: 'FDA Recalls App',
                                        onClick: () => window.open('/recalls', '_blank')
                                    },
                                    {
                                        text: 'File Manager App',
                                        onClick: () => window.open('/fileManager', '_blank')
                                    }
                                ]
                            })
                        }),
                        example({
                            features: `menuTriggerSide: 'left'`,
                            content: () => splitButton({
                                text: 'More Hoist Apps',
                                menuTriggerSide: 'left',
                                onClick: () => window.open('/app/examples', '_blank'),
                                menuItemConfs: [
                                    {
                                        text: 'Portfolio App',
                                        onClick: () => window.open('/portfolio', '_blank')
                                    },
                                    {
                                        text: 'News App',
                                        onClick: () => window.open('/news', '_blank')
                                    }
                                ]
                            })
                        }),
                        example({
                            features: `minimal: true`,
                            content: () => splitButton({
                                text: 'More Hoist Apps',
                                minimal: true,
                                onClick: () => window.open('/app/examples', '_blank'),
                                menuItemConfs: [
                                    {
                                        text: 'FDA Recalls App',
                                        onClick: () => window.open('/recalls', '_blank')
                                    },
                                    {
                                        text: 'File Manager App',
                                        onClick: () => window.open('/fileManager', '_blank')
                                    }
                                ]
                            })
                        }),
                        example({
                            features: ['minimal: true', 'intent: \'primary\''],
                            content: () => splitButton({
                                text: 'More Hoist Apps',
                                minimal: true,
                                intent: 'primary',
                                onClick: () => window.open('/app/examples', '_blank'),
                                menuItemConfs: [
                                    {
                                        text: 'FDA Recalls App',
                                        onClick: () => window.open('/recalls', '_blank')
                                    },
                                    {
                                        text: 'File Manager App',
                                        onClick: () => window.open('/fileManager', '_blank')
                                    }
                                ]
                            })
                        }),
                        example({
                            features: `intent: 'success'`,
                            content: () => splitButton({
                                text: 'More Hoist Apps',
                                intent: 'success',
                                onClick: () => window.open('/app/examples', '_blank'),
                                menuItemConfs: [
                                    {
                                        text: 'FDA Recalls App',
                                        onClick: () => window.open('/recalls', '_blank')
                                    },
                                    {
                                        text: 'File Manager App',
                                        onClick: () => window.open('/fileManager', '_blank')
                                    }
                                ]
                            })
                        }),
                        example({
                            features: 'disabled: true',
                            content: () => splitButton({
                                text: 'More Hoist Apps',
                                disabled: true,
                                onClick: () => window.open('/app/examples', '_blank'),
                                menuItemConfs: [
                                    {
                                        text: 'FDA Recalls App',
                                        onClick: () => window.open('/recalls', '_blank')
                                    },
                                    {
                                        text: 'File Manager App',
                                        onClick: () => window.open('/fileManager', '_blank')
                                    }
                                ]
                            })
                        }),
                        example({
                            features: 'no menuItemConfs []',
                            content: () => splitButton({
                                text: 'No Hoist Apps Below',
                                onClick: () => window.open('/app/examples', '_blank'),
                                menuItemConfs: []
                            })
                        }),
                        example({
                            features: 'no menuItemConfs (undefined)',
                            content: () => splitButton({
                                text: 'No Hoist Apps Below',
                                onClick: () => window.open('/app/examples', '_blank')
                            })
                        }),
                        example({
                            features: 'intent:\'primary\' on a menu item',
                            content: () => splitButton({
                                text: 'More Hoist Apps',
                                onClick: () => window.open('/app/examples', '_blank'),
                                menuItemConfs: [
                                    {
                                        text: 'FDA Recalls App',
                                        onClick: () => window.open('/recalls', '_blank'),
                                        intent: 'primary'
                                    },
                                    {
                                        text: 'File Manager App',
                                        onClick: () => window.open('/fileManager', '_blank')
                                    }
                                ]
                            })
                        }),
                        example({
                            features: [
                                'styled with className: \'special-split-button\''
                            ],
                            content: () => splitButton({
                                text: 'Hoist Apps',
                                onClick: () => window.open('/app/examples', '_blank'),
                                className: 'special-split-button',
                                menuItemConfs: [
                                    {
                                        text: 'FDA Recalls App',
                                        onClick: () => window.open('/recalls', '_blank')
                                    },
                                    {
                                        text: 'File Manager App',
                                        onClick: () => window.open('/fileManager', '_blank')
                                    }
                                ]
                            })
                        })
                    ]
                })
            )
        });
    }
});

const example = hoistCmp.factory(
    ({features, content}) => div({
        className: 'button-example',
        items: [
            h4('Features'),
            p(castArray(features).map(it => fragment(it, br()))),
            elementFromContent(content)
        ]
    })
);
