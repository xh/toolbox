import {div, span} from '@xh/hoist/cmp/layout';
import type {PdfViewerToolbarSpec} from '@xh/hoist/cmp/pdfviewer';
import {pdfViewer, PdfViewerModel} from '@xh/hoist/cmp/pdfviewer';
import {creates, hoistCmp, HoistModel, managed, XH} from '@xh/hoist/core';
import {button, modalToggleButton} from '@xh/hoist/desktop/cmp/button';
import {fileChooser, FileChooserModel} from '@xh/hoist/desktop/cmp/filechooser';
import {select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {bindable, observableRef} from '@xh/hoist/mobx';
import {isNumber} from 'lodash';
import {wrapper, wrapperOption} from '../../common/Wrapper';

const SAMPLE_URL = '/public/pdf/hoist-grid-guide.pdf';

type SourceType = 'sample' | 'file' | 'missing' | 'none';
type ToolbarType = 'default' | 'custom' | 'none';

export const pdfViewerPanel = hoistCmp.factory({
    displayName: 'PdfViewerPanel',
    model: creates(() => PdfViewerPanelModel),

    render({model}) {
        return wrapper({
            title: 'PdfViewer',
            icon: Icon.filePdf(),
            description: [
                "`PdfViewer` displays PDF documents within your app, built on Mozilla's",
                '[pdf.js](https://mozilla.github.io/pdf.js/). Pages render as they scroll into',
                'view, with selectable text and working links.',
                '',
                'Its backing `PdfViewerModel` loads a document from a URL, `FetchOptions`, or bytes',
                'held by the app - e.g. a `Blob` from an authenticated API call or a local `File`.',
                'The model exposes observable state and actions for paging, zoom, rotation, find,',
                'and download. The built-in toolbar uses that same API, and is configured with a',
                'list of tokens that may be mixed with custom elements.',
                '',
                'Apps opt in by adding `pdfjs-dist` to their dependencies. Hoist loads it on first',
                'use, so apps pay no bundle cost until a PDF is displayed.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/other/PdfViewerPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/cmp/pdfviewer/PdfViewer.ts', notes: 'Hoist component.'},
                {url: '$HR/cmp/pdfviewer/PdfViewerModel.ts', notes: 'Hoist component model.'},
                {
                    url: 'https://mozilla.github.io/pdf.js/',
                    text: 'pdf.js',
                    notes: 'The underlying PDF rendering library.'
                }
            ],
            options: [
                wrapperOption({
                    label: 'Source',
                    propName: 'source',
                    control: select({
                        model,
                        bind: 'sourceType',
                        width: 150,
                        enableFilter: false,
                        hideSelectedOptionCheck: true,
                        options: [
                            {value: 'sample', label: 'Sample (URL)'},
                            {value: 'file', label: 'Local file'},
                            {value: 'missing', label: 'Missing file'},
                            {value: 'none', label: 'None'}
                        ]
                    })
                }),
                fileChooser({
                    model: model.fileChooserModel,
                    height: 80,
                    omit: model.sourceType !== 'file'
                }),
                wrapperOption({
                    label: 'Toolbar',
                    propName: 'toolbar',
                    control: select({
                        model,
                        bind: 'toolbarType',
                        width: 150,
                        enableFilter: false,
                        hideSelectedOptionCheck: true,
                        options: [
                            {value: 'default', label: 'Default'},
                            {value: 'custom', label: 'Custom'},
                            {value: 'none', label: 'None'}
                        ]
                    })
                }),
                stateReadout()
            ],
            item: panel({
                title: 'Document',
                width: 900,
                height: '100%',
                icon: Icon.filePdf(),
                compactHeader: true,
                modelConfig: {modalSupport: true, collapsible: false, resizable: false},
                headerItems: [modalToggleButton()],
                item: pdfViewer({model: model.pdfViewerModel})
            })
        });
    }
});

/** Live view of observable model state - bindable from any custom control. */
const stateReadout = hoistCmp.factory<PdfViewerPanelModel>(({model}) => {
    const {pageNumber, pageCount, scale, currentScale, rotation, hasDocument} =
        model.pdfViewerModel;
    if (!hasDocument) return null;

    const scaleLabel = isNumber(scale) ? '' : ` (${scale})`;
    return div({
        className: 'xh-pad-half',
        items: [
            div(`Page ${pageNumber} of ${pageCount}`),
            div(`Zoom ${Math.round(currentScale * 100)}%${scaleLabel}`),
            div(`Rotation ${rotation}°`),
            span({className: 'xh-text-color-muted', item: 'Read from PdfViewerModel.'})
        ]
    });
});

class PdfViewerPanelModel extends HoistModel {
    @bindable accessor sourceType: SourceType = 'sample';
    @bindable accessor toolbarType: ToolbarType = 'default';

    @managed @observableRef accessor pdfViewerModel: PdfViewerModel;

    @managed fileChooserModel = new FileChooserModel({
        accept: '.pdf',
        maxFiles: 1,
        emptyDisplayPrompt: 'Drop a PDF here, or click to browse.'
    });

    constructor() {
        super();
        this.pdfViewerModel = this.createViewerModel();

        this.addReaction(
            {
                track: () => [this.sourceType, this.fileChooserModel.files],
                run: () => this.pdfViewerModel.setSource(this.getSource())
            },
            {
                // Toolbar is set at construction, so build a new model - keeping its source.
                track: () => this.toolbarType,
                run: () => {
                    XH.safeDestroy(this.pdfViewerModel);
                    this.pdfViewerModel = this.createViewerModel();
                }
            }
        );
    }

    private createViewerModel(): PdfViewerModel {
        return new PdfViewerModel({
            source: this.getSource(),
            toolbar: this.getToolbar(),
            persistWith: {localStorageKey: 'pdfViewerExample'}
        });
    }

    private getSource() {
        switch (this.sourceType) {
            case 'sample':
                return SAMPLE_URL;
            case 'file':
                return this.fileChooserModel.files[0] ?? null;
            case 'missing':
                return '/public/pdf/does-not-exist.pdf';
            default:
                return null;
        }
    }

    private getToolbar(): PdfViewerToolbarSpec {
        switch (this.toolbarType) {
            case 'custom':
                return [
                    'pageNav',
                    button({
                        text: 'Go to end',
                        icon: Icon.arrowToBottom(),
                        onClick: () => this.pdfViewerModel.goToPage(Infinity)
                    }),
                    'filler',
                    'find',
                    '-',
                    'download'
                ];
            case 'none':
                return false;
            default:
                return true;
        }
    }
}
