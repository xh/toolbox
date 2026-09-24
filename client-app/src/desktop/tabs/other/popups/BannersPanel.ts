import {hbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, type BannerSpec, type Intent, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {intentInput, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';
import {
    demoGrid,
    demoPanel,
    demoPlayground,
    demoRow,
    demoSection,
    fmtDemoConfig,
    raw
} from '../../../common/Demo';
import {wrapper, wrapperOption, wrapperOptionGroup} from '../../../common/Wrapper';
import {popBtn} from './PopupsCommon';

export const bannersPanel = hoistCmp.factory({
    displayName: 'BannersPanel',
    model: creates(() => BannersPanelModel),

    render({model}) {
        const {pgMessage, pgIcon, pgIntent, pgEnableClose} = model;

        return wrapper({
            title: 'Banners',
            icon: Icon.flag(),
            description: [
                'Banners are persistent, non-modal notifications shown app-wide across the top',
                'of the viewport until dismissed - for outages, maintenance windows or anything',
                'the user should keep seeing while they work.',
                '',
                'Show one via `XH.showBanner()` and remove it via `XH.hideBanner()`. Banners',
                'are keyed by `category`, so an app can manage several independently.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/other/popups/BannersPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/appcontainer/README.md',
                    text: 'App shell docs',
                    notes: 'Application shell guide: dialogs, toasts, and banners.'
                },
                {
                    url: '$HR/core/XH.ts',
                    notes: 'Top-level APIs: .showBanner(), .hideBanner().'
                }
            ],
            options: wrapperOptionGroup({
                label: 'Playground only',
                icon: Icon.experiment(),
                intent: 'primary',
                info: 'Drives the Playground banner.',
                items: [
                    wrapperOption({
                        label: 'Message',
                        propName: 'BannerSpec.message',
                        control: textInput({bind: 'pgMessage', width: 150, commitOnChange: true})
                    }),
                    wrapperOption({
                        label: 'Icon',
                        propName: 'BannerSpec.icon',
                        control: switchInput({bind: 'pgIcon'})
                    }),
                    wrapperOption({
                        label: 'Intent',
                        propName: 'BannerSpec.intent',
                        control: intentInput({bind: 'pgIntent', enableClear: true})
                    }),
                    wrapperOption({
                        label: 'Enable close',
                        propName: 'BannerSpec.enableClose',
                        info: 'Off hides the close button.',
                        control: switchInput({bind: 'pgEnableClose'})
                    })
                ]
            }),
            item: demoPanel({
                className: 'tbox-popups',
                items: [
                    demoSection({
                        title: 'Playground',
                        intent: 'primary',
                        item: demoPlayground({
                            instanceWidth: 260,
                            showValue: false,
                            caption: 'Show replaces any banner already up in the default category.',
                            config: fmtDemoConfig<BannerSpec>('XH.showBanner', {
                                message: pgMessage,
                                icon: pgIcon ? raw('Icon.flag()') : undefined,
                                intent: pgIntent || undefined,
                                enableClose: pgEnableClose ? undefined : false
                            }),
                            item: hbox({
                                gap: 6,
                                items: [
                                    button({
                                        ...popBtn(Icon.flag({intent: 'primary'})),
                                        text: 'Show banner',
                                        onClick: () =>
                                            XH.showBanner({
                                                message: pgMessage,
                                                icon: pgIcon ? Icon.flag() : null,
                                                intent: pgIntent,
                                                enableClose: pgEnableClose
                                            })
                                    }),
                                    button({
                                        icon: Icon.x(),
                                        text: 'Hide',
                                        tooltip: 'XH.hideBanner()',
                                        onClick: () => XH.hideBanner()
                                    })
                                ]
                            })
                        })
                    }),
                    demoSection({
                        title: 'Variants',
                        note: 'Each sets its own props.',
                        item: demoGrid({
                            columns: 3,
                            items: [
                                demoRow({
                                    label: 'With action',
                                    info: 'actionButtonProps renders a button within the banner',
                                    item: button({
                                        ...popBtn(Icon.flag({intent: 'primary'})),
                                        text: 'Banner with action',
                                        onClick: () =>
                                            XH.showBanner({
                                                message: 'A new version is available.',
                                                icon: Icon.refresh(),
                                                intent: 'primary',
                                                actionButtonProps: {
                                                    text: 'Reload',
                                                    intent: 'primary',
                                                    onClick: () => {
                                                        XH.toast('Action button clicked!');
                                                        XH.hideBanner();
                                                    }
                                                }
                                            })
                                    })
                                }),
                                demoRow({
                                    label: 'Categories',
                                    info: 'Each category holds one banner - showing another replaces it, and hideBanner(category) removes it',
                                    item: hbox({
                                        gap: 6,
                                        flexWrap: 'wrap',
                                        items: [
                                            button({
                                                ...popBtn(Icon.warning({intent: 'warning'})),
                                                text: 'Show maintenance',
                                                onClick: () =>
                                                    XH.showBanner({
                                                        category: 'maintenance',
                                                        message:
                                                            'Scheduled maintenance tonight at 10pm.',
                                                        icon: Icon.warning(),
                                                        intent: 'warning'
                                                    })
                                            }),
                                            button({
                                                ...popBtn(Icon.x({intent: 'warning'})),
                                                text: 'Hide maintenance',
                                                onClick: () => XH.hideBanner('maintenance')
                                            })
                                        ]
                                    })
                                }),
                                demoRow({
                                    label: 'Callbacks',
                                    info: 'onClick fires when the banner body is clicked, onClose when the user closes it',
                                    item: button({
                                        ...popBtn(Icon.flag({intent: 'primary'})),
                                        text: 'Banner with callbacks',
                                        onClick: () =>
                                            XH.showBanner({
                                                message: 'Click me, or close me.',
                                                onClick: () => XH.toast('Called onClick'),
                                                onClose: () => XH.toast('Called onClose')
                                            })
                                    })
                                })
                            ]
                        })
                    })
                ]
            })
        });
    }
});

//------------------------------------------------------------------
// Model
//------------------------------------------------------------------
class BannersPanelModel extends HoistModel {
    // Playground props
    @bindable accessor pgMessage = 'This is a Banner.';
    @bindable accessor pgIcon = false;
    @bindable accessor pgIntent: Intent = 'warning';
    @bindable accessor pgEnableClose = true;
}
