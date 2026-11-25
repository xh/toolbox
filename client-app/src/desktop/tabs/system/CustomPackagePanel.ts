import {hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {customPanel} from '@xh/package-template/desktop/cmp/custompanel';
import {wrapper} from '../../common/Wrapper';

export const customPackagePanel = hoistCmp.factory(() =>
    wrapper({
        title: 'Custom Package',
        icon: Icon.box(),
        description: [
            'When supporting multiple applications within an organization, it can be helpful',
            'to extract common components, services, styles, and utilities into a custom',
            'package for use across apps.',
            '',
            'The minimal `@xh/package-template` project provides an example of such a project.',
            'The styled panel below, and the model behind its click counter, are imported from',
            'that package.',
            '',
            'Like Hoist React, the package ships its TypeScript source, and the app build compiles',
            'it with the app code. It also ships docs that AI coding agents can read through Hoist',
            "Docs, next to Hoist's own. Toolbox's Docs tab shows them too."
        ],
        links: [
            {
                url: 'https://github.com/xh/package-template',
                text: '@xh/package-template',
                notes: 'GitHub repo for an extremely simple TS package project.'
            },
            {
                url: 'https://github.com/xh/package-template/blob/main/docs/package-structure.md',
                text: 'Package Structure',
                notes: 'How the package is laid out, published, documented, and tested.'
            }
        ],
        children: customPanel({width: 700})
    })
);
