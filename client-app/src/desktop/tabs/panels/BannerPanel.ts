import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {filler, pre, vframe} from '@xh/hoist/cmp/layout';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import type {Intent, LoadSpec} from '@xh/hoist/core';
import {intentInput, segmentedControl, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import type {PanelBannerSpec} from '@xh/hoist/desktop/cmp/panel';
import {refreshButton} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';
import {demoFrame, fmtDemoConfig, raw} from '../../common/Demo';
import {SampleGridModel} from '../../common/grid/SampleGridModel';
import {wrapper, wrapperOption, wrapperOptionGroup} from '../../common/Wrapper';
import './BannerPanel.scss';

export const bannerPanel = hoistCmp.factory({
    model: creates(() => BannerPanelModel),

    render({model}) {
        return wrapper({
            title: 'Banner',
            icon: Icon.flag(),
            description: [
                'Banners flag an info, warning, or error state that applies to a panel and its',
                'contents - e.g. stale data, a partial result set, or read-only access.',
                '',
                "Set a panel's `banner` prop to a spec, a message string, or a `banner()`",
                'element. Banners render below the top toolbar, directly above the content they',
                "describe, so the toolbar never shifts. Set a spec's `position: 'bottom'` to show",
                'it above the bottom toolbar instead. Pass an array to show several, with null',
                'entries skipped for conditional banners.',
                '',
                'Banners are controlled - provide `onClose` to show a close button, and stop',
                'rendering the banner when it fires. See Other > Banners for app-wide banners.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/panels/BannerPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/desktop/cmp/panel/README.md#banners',
                    text: 'Panel docs',
                    notes: 'Desktop panel guide, including the banner prop.'
                },
                {url: '$HR/desktop/cmp/banner/Banner.ts', notes: 'Hoist component.'}
            ],
            options: [
                wrapperOption({
                    label: 'Show banner',
                    control: switchInput({bind: 'showBanner'}),
                    info: 'Toggle to see the toolbar and grid hold position.'
                }),
                wrapperOptionGroup({
                    label: 'Banner spec',
                    icon: Icon.flag(),
                    intent: 'primary',
                    items: [
                        wrapperOption({
                            label: 'Message',
                            propName: 'BannerProps.message',
                            control: textInput({bind: 'message', width: 150, commitOnChange: true})
                        }),
                        wrapperOption({
                            label: 'Intent',
                            propName: 'BannerProps.intent',
                            control: intentInput({bind: 'intent', enableClear: true}),
                            info: 'Clear for a neutral banner.'
                        }),
                        wrapperOption({
                            label: 'Position',
                            propName: 'PanelBannerSpec.position',
                            control: segmentedControl({
                                bind: 'position',
                                options: [
                                    {value: 'top', label: 'Top'},
                                    {value: 'bottom', label: 'Bottom'}
                                ]
                            })
                        }),
                        wrapperOption({
                            label: 'Icon',
                            propName: 'BannerProps.icon',
                            control: switchInput({bind: 'showIcon'}),
                            info: 'Defaults by intent - null for none.'
                        }),
                        wrapperOption({
                            label: 'Filled',
                            propName: 'BannerProps.filled',
                            control: switchInput({bind: 'filled'}),
                            info: 'Solid background, as used by app-wide banners.'
                        }),
                        wrapperOption({
                            label: 'Compact',
                            propName: 'BannerProps.compact',
                            control: switchInput({bind: 'compact'})
                        }),
                        wrapperOption({
                            label: 'Wrap',
                            propName: 'BannerProps.wrap',
                            control: switchInput({bind: 'wrap'}),
                            info: 'Off truncates long messages to one line.'
                        }),
                        wrapperOption({
                            label: 'Action button',
                            propName: 'BannerProps.actionButtonProps',
                            control: switchInput({bind: 'showAction'})
                        }),
                        wrapperOption({
                            label: 'Closable',
                            propName: 'BannerProps.onClose',
                            control: switchInput({bind: 'closable'})
                        })
                    ]
                }),
                wrapperOption({
                    label: 'Second banner',
                    control: switchInput({bind: 'showSecond'}),
                    info: 'Add a compact info banner at the bottom.'
                })
            ],
            item: vframe({
                className: 'tb-banner-panel',
                items: [
                    panel({
                        title: 'Companies',
                        icon: Icon.office(),
                        flex: 1,
                        banner: [model.bannerSpec, model.secondBannerSpec],
                        tbar: [
                            storeFilterField({gridModel: model.gridModel}),
                            filler(),
                            refreshButton({onClick: () => model.refreshAsync()})
                        ],
                        item: grid({model: model.gridModel}),
                        bbar: [
                            filler(),
                            gridCountLabel({gridModel: model.gridModel, unit: 'companies'})
                        ],
                        mask: 'onLoad'
                    }),
                    demoFrame({
                        label: 'Current config',
                        item: pre({className: 'tbox-demo-playground__code', item: model.configText})
                    })
                ]
            })
        });
    }
});

class BannerPanelModel extends HoistModel {
    @bindable accessor showBanner = true;
    @bindable accessor message = 'Prices are **delayed** - last updated 2 hours ago.';
    @bindable accessor intent: Intent = 'warning';
    @bindable accessor position: 'top' | 'bottom' = 'top';
    @bindable accessor showIcon = true;
    @bindable accessor filled = false;
    @bindable accessor compact = false;
    @bindable accessor wrap = true;
    @bindable accessor showAction = true;
    @bindable accessor closable = false;
    @bindable accessor showSecond = false;

    @managed sampleGridModel = new SampleGridModel();

    get gridModel() {
        return this.sampleGridModel.gridModel;
    }

    get bannerSpec(): PanelBannerSpec {
        if (!this.showBanner) return null;
        const {message, intent, position, showIcon, filled, compact, wrap} = this;
        return {
            message,
            intent,
            position,
            icon: showIcon ? undefined : null,
            filled,
            compact,
            wrap,
            actionButtonProps: this.showAction
                ? {text: 'Refresh', icon: Icon.refresh(), onClick: () => this.refreshAsync()}
                : null,
            onClose: this.closable ? () => (this.showBanner = false) : null
        };
    }

    get secondBannerSpec(): PanelBannerSpec {
        if (!this.showSecond) return null;
        return {
            message: 'Results are limited to 1,000 companies - refine the filter to narrow them.',
            intent: 'primary',
            position: 'bottom',
            compact: true
        };
    }

    get configText(): string {
        if (!this.showBanner) return 'panel({\n    banner: null\n})';
        const {message, intent, position, showIcon, filled, compact, wrap} = this,
            spec = fmtDemoConfig<PanelBannerSpec>('', {
                message,
                intent: intent ?? null,
                position: position === 'top' ? undefined : position,
                icon: showIcon ? undefined : null,
                filled: filled || undefined,
                compact: compact || undefined,
                wrap: wrap ? undefined : false,
                actionButtonProps: this.showAction
                    ? raw("{text: 'Refresh', onClick: () => this.refreshAsync()}")
                    : undefined,
                onClose: this.closable ? raw('() => (this.showBanner = false)') : undefined
            });
        // Reformat the bare `({...})` call as a `banner` spec nested within a `panel()` call.
        const body = spec.slice(1, -1).replace(/\n/g, '\n    ');
        return `panel({\n    banner: ${body},\n    tbar: [...],\n    item: grid()\n})`;
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        await this.sampleGridModel.loadAsync(loadSpec);
    }
}
