import {box, filler, fragment, hframe, hspacer, img, span, tileFrame, vbox, vspacer} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, isHoistException} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {locationDialog} from './LocationDialog';
import {WeatherPanelModel} from './WeatherPanelModel';
import {relativeTimestamp} from "@xh/hoist/cmp/relativetimestamp";
import {switchInput} from "@xh/hoist/desktop/cmp/input";

export const weatherPanel = hoistCmp.factory({
    model: creates(WeatherPanelModel),

    render({model}) {
        const {forecasts} = model,
            {isFahrenheit} = model,
            boxClassName = 'toolbox-layout-box';

        const tiles = forecasts.map(
            it => {
                const {icon} = it;
                return panel({
                    className: 'weatherLocationFile',
                    item: vbox({
                        margin: 10,
                        flex: 1,
                        items: [
                            box({
                                style: {fontSize: "1.0em"},
                                className: boxClassName,
                                item: it.locationName
                            }),
                            filler(),
                            vspacer(10),
                            hframe(
                                box({
                                    style: {fontSize: "1.3em"},
                                    className: boxClassName,
                                    items: [
                                        fmtTemp(it.temperature, isFahrenheit),
                                        hspacer(20),
                                        span({
                                            style: {color: "mediumseagreen"},
                                            item: it.shortForecast
                                        })
                                    ]
                                }),
                                filler(),
                                img({
                                    src: icon,
                                    height: 65,
                                    width: 65,
                                    omit: !icon
                                })
                            ),
                            button({
                                minimal: true,
                                icon: Icon.delete(),
                                onClick: () => model.deleteForecast(it.locationName),
                                intent: 'danger'
                            })
                        ]
                    })
                })
            }
        )
        return fragment(
            panel({
                className: 'w-tileframe',
                bbar: bbar(),
                item: hframe(
                    tileFrame({
                        desiredRatio: 1,
                        spacing: 10,
                        minTileWidth: tiles.length < 4 ? 390 : 380,
                        maxTileHeight: 180,
                        items: tiles
                    })
                ),
            }),
            locationDialog()
        );
    },
})

function fmtTemp(temp, isFahrenheit) {
    const tempStr = isFahrenheit ? temp + "°F" : Math.round((temp - 32) * (5 / 9)) + "°C";
    return span({
        style: {color: 'deepskyblue'},
        item: tempStr
    })
}

const bbar = hoistCmp.factory<WeatherPanelModel>(({model}) => {
    return toolbar(
        button({
            style: {
                color: 'gold',
                fontSize: "1.2em"
            },
            icon: Icon.add(),
            text: 'New Location',
            onClick: () => model.openAddForm(),
            intent: 'success'
        }),
        hspacer(30),
        box({
            style: {fontSize: "1.4em"},
            className: 'toolbox-layout-temp',
            item: "°C"
        }),
        hspacer(8),
        switchInput({
            bind: 'isFahrenheit',
        }),
        box({
            style: {fontSize: "1.4em"},
            className: 'toolbox-layout-temp',
            item: "°F"
        }),
        filler(),
        box({
            style: {fontSize: '0.9em'},
            margin: 10,
            item: relativeTimestamp({
                bind: 'timestamp',
                options: {
                    prefix: "Last refreshed"
                }
            })
        })
    );
});

