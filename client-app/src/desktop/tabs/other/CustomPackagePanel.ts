import {p} from '@xh/hoist/cmp/layout';
import {hoistCmp} from '@xh/hoist/core';
import {customPanel} from '@xh/package-template/desktop/cmp/custompanel';
import {wrapper} from '../../common';

export const customPackagePanel = hoistCmp.factory(() =>
    wrapper({
        description: [
            p(
                'When supporting multiple applications within an organization, it can be helpful to extract common components, services, styles, and utilities into a custom package for use across apps.'
            ),
            p(
                'The minimal @xh/package-template project provides an example of such a project. The styled panel below is imported from that package.'
            ),
            p(
                "Note that this package is referenced within Toolbox's own client-app/webpack.config.js to ensure its codebase is processed at build time in the same manner as the app codebase and Hoist React itself."
            )
        ],
        links: [
            {
                url: 'https://github.com/xh/package-template',
                text: '@xh/package-template',
                notes: 'GitHub repo for an extremely simple JS package project.'
            },
            {
                url: '$TB/client-app/webpack.config.js',
                text: 'webpack.config.js',
                notes: 'Webpack config for Toolbox, with special handling for our custom package.'
            }
        ],
        item: customPanel({width: 700})
    })
);
