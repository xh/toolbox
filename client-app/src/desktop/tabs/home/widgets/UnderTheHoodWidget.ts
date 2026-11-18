import {div, h2, span, table, tbody, td, th, tr} from '@xh/hoist/cmp/layout';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {hoistCmp, XH} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {fmtDateTime} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import './UnderTheHoodWidget.scss';

export const underTheHoodWidget = hoistCmp.factory({
    displayName: 'UnderTheHoodWidget',
    render() {
        const get = (str: string) => XH.environmentService.get(str),
            startupTime = get('startupTime'),
            row = (label: string, data) => {
                data = data || span({children: 'Not available', className: 'xh-text-color-muted'});
                return tr(th(label), td(data));
            };

        // Snapshot versions are tagged with a timestamp - show that in local time here
        // to aid in identifying when/if a snapshot has been updated.
        let hrVersion = get('hoistReactVersion');
        if (hrVersion.includes('SNAPSHOT.')) {
            const snapDate = new Date(parseInt(hrVersion.split('SNAPSHOT.')[1]));
            hrVersion += ` (${fmtDateTime(snapDate)})`;
        }

        return panel({
            className: 'tb-under-the-hood',
            children: div({
                className: 'tb-under-the-hood__inner',
                children: [
                    h2(Icon.info(), 'Deployment'),
                    table({
                        children: tbody(
                            row('Version', `${get('appVersion')} (build ${get('appBuild')})`),
                            row('Environment', get('appEnvironment')),
                            startupTime
                                ? row(
                                      'Server Uptime',
                                      relativeTimestamp({timestamp: startupTime, pastSuffix: ''})
                                  )
                                : null
                        )
                    }),
                    h2(Icon.server(), 'Server Stack'),
                    table({
                        children: tbody(
                            row('Hoist Core', get('hoistCoreVersion')),
                            row('Grails', get('grailsVersion')),
                            row('Java', get('javaVersion'))
                        )
                    }),
                    h2(Icon.window(), 'Client Stack'),
                    table({
                        children: tbody(
                            row('Hoist React', hrVersion),
                            row('React', get('reactVersion')),
                            row('AG Grid', get('agGridVersion')),
                            row('Blueprint Core', get('blueprintCoreVersion')),
                            row('MobX', get('mobxVersion'))
                        )
                    })
                ]
            })
        });
    }
});
