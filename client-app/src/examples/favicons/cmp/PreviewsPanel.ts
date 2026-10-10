import {div} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {FaviconModel} from '../FaviconModel';
import {browserTabMock} from './previews/BrowserTabMock';
import {heroPreview} from './previews/HeroPreview';
import {hintsCard} from './previews/HintsCard';
import {homeScreenMock} from './previews/HomeScreenMock';
import {sizeStrip} from './previews/SizeStrip';
import {snippetCard} from './previews/SnippetCard';

/** Scrolling grid of preview cards for the current design. */
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
                        hintsCard(),
                        sizeStrip(),
                        snippetCard()
                    ]
                })
            })
        });
    }
});
