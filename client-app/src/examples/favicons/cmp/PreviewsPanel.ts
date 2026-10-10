import {div} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {FaviconModel} from '../FaviconModel';
import {browserTabMock} from './previews/BrowserTabMock';
import {checksPanel} from './previews/ChecksPanel';
import {heroPreview} from './previews/HeroPreview';
import {homeScreenMock} from './previews/HomeScreenMock';
import {sizeStrip} from './previews/SizeStrip';
import {snippetPanel} from './previews/SnippetPanel';

/** Scrolling grid of preview tiles - minimally restyled Hoist panels - for the current design. */
export const previewsPanel = hoistCmp.factory({
    displayName: 'PreviewsPanel',
    model: uses(FaviconModel),
    className: 'xh-tiled-bg',

    render({className}) {
        return panel({
            className,
            flex: 1,
            scrollable: true,
            item: div({
                className: 'tb-favicons__grid-wrap',
                item: div({
                    className: 'tb-favicons__grid',
                    items: [
                        heroPreview(),
                        browserTabMock(),
                        homeScreenMock(),
                        checksPanel(),
                        sizeStrip(),
                        snippetPanel()
                    ]
                })
            })
        });
    }
});
