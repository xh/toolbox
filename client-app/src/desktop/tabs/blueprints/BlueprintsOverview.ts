import {div, li, span, strong, ul} from '@xh/hoist/cmp/layout';
import {hoistCmp, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import type {ReactElement} from 'react';
import {BLUEPRINT_TYPES} from '../../../blueprints/blueprintTypes';
import {demoGallery, demoGalleryTile, demoPanel, demoSection} from '../../common/Demo';
import {wrapper} from '../../common/Wrapper';
import {CONCEPT_PAGES} from './concepts/conceptPages';

/** The front page of the Blueprints tab: what Blueprints are, and where to find each example. */
export const blueprintsOverview = hoistCmp.factory({
    displayName: 'BlueprintsOverview',

    render() {
        return wrapper({
            title: 'Hoist Blueprints',
            icon: Icon.layout(),
            description: [
                'A blueprint describes a dashboard as one JSON document: its widgets and layout, the',
                'data sources they read, and the variables that link them. Hoist renders it with real',
                'Hoist components, and the same document always renders the same view.',
                '',
                'People build and change blueprints in a designer, and the Architect builds them from a',
                'conversation, both through the same checked edits. Each example below runs the full',
                'designer on its own data.'
            ],
            links: [
                {
                    url: '/app/docs/hoist-chat-kit/blueprint~README.md',
                    text: 'Blueprints, in the docs',
                    notes: 'The format, the registries and the data layer.'
                },
                {
                    url: 'https://github.com/xh/toolbox/tree/develop/client-app/src/blueprints',
                    text: "Toolbox's blueprint code",
                    notes: 'The shell, repository, data provider and app registries.'
                }
            ],
            children: demoPanel({
                className: 'tb-chatkit-overview',
                children: [
                    demoSection({
                        title: 'What you get',
                        children: ul({
                            className: 'tb-chatkit-overview__features',
                            children: FEATURES.map(({icon, title, text}) =>
                                li({
                                    key: title,
                                    className: 'tb-chatkit-overview__feature',
                                    children: [
                                        icon,
                                        div({
                                            className: 'tb-chatkit-overview__feature-text',
                                            children: [strong(title), text]
                                        })
                                    ]
                                })
                            )
                        })
                    }),
                    demoSection({
                        title: 'Concepts',
                        note: 'Each concept in a few paragraphs, with a small live example to read.',
                        children: demoGallery({
                            minTileWidth: 220,
                            children: CONCEPT_PAGES.map(page =>
                                demoGalleryTile({
                                    key: page.id,
                                    title: page.title,
                                    description: firstSentence(page.paragraphs[0]),
                                    showInstance: false,
                                    onClick: () =>
                                        XH.navigate(`default.blueprints.concept-${page.id}`)
                                })
                            )
                        })
                    }),
                    ...BLUEPRINT_TYPES.map(type =>
                        demoSection({
                            key: type.name,
                            title: `${type.label} example`,
                            note: `Blueprints over the ${type.label.toLowerCase()} data, with its Data Catalog and Registry.`,
                            children: demoGallery({
                                minTileWidth: 260,
                                children: examplePages(type.name).map(page =>
                                    demoGalleryTile({
                                        key: page.route,
                                        title: span(
                                            span({
                                                className: 'tb-chatkit-overview__tile-icon',
                                                children: page.icon
                                            }),
                                            page.title
                                        ),
                                        description: page.description,
                                        showInstance: false,
                                        onClick: () => XH.navigate(page.route)
                                    })
                                )
                            })
                        })
                    )
                ]
            })
        });
    }
});

//------------------
// Implementation
//------------------
function firstSentence(text: string): string {
    return text.replace(/`/g, '').split(/(?<=\.)\s/)[0];
}

function examplePages(typeName: string) {
    const name = typeName.split('.').pop(),
        route = `default.blueprints.${name}`;
    return [
        {
            route,
            title: 'Blueprints',
            icon: Icon.layout(),
            description: 'The library of blueprints, and the designer for the one you open.'
        },
        {
            route: `${route}Catalog`,
            title: 'Data Catalog',
            icon: Icon.database(),
            description: 'The datasets a blueprint can read, with their fields, kinds and formats.'
        },
        {
            route: `${route}Registry`,
            title: 'Registry',
            icon: Icon.list(),
            description: 'The widgets, renderers, resolvers and actions a blueprint can use.'
        }
    ];
}

const FEATURES: Array<{icon: ReactElement; title: string; text: string}> = [
    {
        icon: Icon.code(),
        title: 'One JSON document',
        text: 'No functions or expressions, only names from closed registries, so a saved or model-written blueprint cannot run code.'
    },
    {
        icon: Icon.gridLarge(),
        title: 'Real Hoist widgets',
        text: 'Grids, charts, treemaps, stat cards and inputs, each named after the Hoist component it renders.'
    },
    {
        icon: Icon.database(),
        title: 'Live data by name',
        text: "A source names a dataset from the app's Data Catalog, so a blueprint never holds data and always loads it fresh."
    },
    {
        icon: Icon.link(),
        title: 'Linked by variables',
        text: 'A selection, a date or a filter sets a variable that other widgets read. The Map shows how values move.'
    },
    {
        icon: Icon.edit(),
        title: 'Checked edits',
        text: 'Every change is an edit, applied whole or not at all, with undo, history, drafts and numbered publishes.'
    },
    {
        icon: Icon.ai(),
        title: 'The Architect',
        text: 'An AI agent that reads the catalog and registry, then builds and edits blueprints with the same edits people make.'
    }
];
