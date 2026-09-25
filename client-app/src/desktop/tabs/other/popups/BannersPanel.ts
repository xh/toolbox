import {hbox, placeholder, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, type BannerSpec, type Intent, XH} from '@xh/hoist/core';
import {banner} from '@xh/hoist/desktop/cmp/banner';
import {button} from '@xh/hoist/desktop/cmp/button';
import {intentInput, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
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
                'Banners are persistent, non-modal notifications that stay in view while the user',
                'works. They come in two forms.',
                '',
                '**App-wide** banners show across the top of the viewport until dismissed - for',
                'outages, maintenance windows, or new versions. Show one via `XH.showBanner()`',
                'and remove it via `XH.hideBanner()`. They are keyed by `category`, so an app can',
                'manage several independently.',
                '',
                '**Component** banners flag a state local to part of the app, such as stale data',
                'in one grid. Render `banner()` anywhere, or set the `banner` prop on a `Panel`.',
                'They are controlled - the app decides when to show them. See Panels > Banner',
                'for the Panel integration.'
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
                },
                {
                    url: '$HR/desktop/cmp/banner/Banner.ts',
                    notes: 'Component banner, also used to render app-wide banners.'
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
                    }),
                    componentBanners()
                ]
            })
        });
    }
});

//------------------------------------------------------------------
// Component banners
//------------------------------------------------------------------
const componentBanners = hoistCmp.factory<BannersPanelModel>(({model}) =>
    demoSection({
        title: 'Component Banners',
        note: 'Rendered in place via banner() or Panel.banner.',
        items: [
            demoGrid({
                columns: 2,
                items: [
                    demoRow({
                        label: 'Intents',
                        info: 'Tinted background, with a default icon per intent',
                        item: vbox({
                            flex: 1,
                            gap: 6,
                            items: [
                                banner({intent: 'primary', message: 'A new report is available.'}),
                                banner({intent: 'success', message: 'All trades reconciled.'}),
                                banner({intent: 'warning', message: 'Prices are **delayed**.'}),
                                banner({intent: 'danger', message: 'Feed disconnected.'}),
                                banner({intent: null, message: 'Neutral, with no default icon.'})
                            ]
                        })
                    }),
                    demoRow({
                        label: 'Options',
                        info: 'filled, compact, actionButtonProps, onClose',
                        item: vbox({
                            flex: 1,
                            gap: 6,
                            items: [
                                banner({
                                    intent: 'warning',
                                    filled: true,
                                    message: 'Filled - the style used by app-wide banners.'
                                }),
                                banner({
                                    intent: 'primary',
                                    compact: true,
                                    message: 'Compact - for dense layouts and bottom bars.'
                                }),
                                banner({
                                    intent: 'warning',
                                    message: 'Positions are 15 minutes old.',
                                    actionButtonProps: {
                                        text: 'Refresh',
                                        icon: Icon.refresh(),
                                        onClick: () => XH.toast('Action button clicked!')
                                    }
                                }),
                                banner({
                                    omit: !model.showClosable,
                                    intent: 'success',
                                    message: 'Closable - the app hides it via onClose.',
                                    onClose: () => (model.showClosable = false)
                                }),
                                button({
                                    omit: model.showClosable,
                                    text: 'Restore closable banner',
                                    icon: Icon.reset(),
                                    onClick: () => (model.showClosable = true)
                                })
                            ]
                        })
                    })
                ]
            }),
            demoRow({
                label: 'In a Panel',
                info: "Panel's banner prop places it below the top toolbar, above the content",
                item: panel({
                    className: 'tbox-popups__banner-panel',
                    title: 'Positions',
                    icon: Icon.portfolio(),
                    height: 180,
                    width: 560,
                    banner: {
                        intent: 'warning',
                        message: 'Positions are **read-only** while the market is closed.'
                    },
                    tbar: [textInput({placeholder: 'Search...', width: 160})],
                    item: placeholder('Panel contents')
                })
            })
        ]
    })
);

//------------------------------------------------------------------
// Model
//------------------------------------------------------------------
class BannersPanelModel extends HoistModel {
    // Playground props
    @bindable accessor pgMessage = 'This is an _app-wide_ banner showing an **important message**.';
    @bindable accessor pgIcon = false;
    @bindable accessor pgIntent: Intent = 'warning';
    @bindable accessor pgEnableClose = true;

    // Component banner demo
    @bindable accessor showClosable = true;
}
