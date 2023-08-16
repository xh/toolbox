import {div, filler, h2, span, table, tbody, td, th, tr} from '@xh/hoist/cmp/layout';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {hoistCmp, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {fmtDateTime} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {fmtTimeZone} from '@xh/hoist/utils/impl';
import './AboutToolboxWidget.scss';

export const aboutToolboxWidget = hoistCmp.factory({
    displayName: 'AboutToolboxWidget',
    render() {
        const get = str => XH.environmentService.get(str),
            startupTime = get('startupTime'),
            row = (label, data) => {
                data = data || span({item: 'Not available', className: 'xh-text-color-muted'});
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
            className: 'tb-about-widget',
            item: div({
                className: 'tb-about-widget__inner',
                items: [
                    h2(Icon.info(), 'Deployment'),
                    table({
                        item: tbody(
                            row('App Name / Code', `${get('appName')} / ${get('appCode')}`),
                            row('Version', `${get('appVersion')} (build ${get('appBuild')})`),
                            row('Environment', get('appEnvironment')),
                            row(
                                'App TZ',
                                fmtTimeZone(get('appTimeZone'), get('appTimeZoneOffset'))
                            ),
                            row(
                                'Server TZ',
                                fmtTimeZone(get('serverTimeZone'), get('serverTimeZoneOffset'))
                            ),
                            row(
                                'Client TZ',
                                fmtTimeZone(get('clientTimeZone'), get('clientTimeZoneOffset'))
                            ),
                            startupTime
                                ? row(
                                      'Server Uptime',
                                      relativeTimestamp({
                                          timestamp: startupTime,
                                          options: {pastSuffix: ''}
                                      })
                                  )
                                : null
                        )
                    }),
                    h2(Icon.server(), 'Server-Side Library Versions'),
                    table({
                        item: tbody(
                            row('Hoist Core', get('hoistCoreVersion')),
                            row('Grails', get('grailsVersion')),
                            row('Java', get('javaVersion'))
                        )
                    }),
                    h2(Icon.window(), 'Client-Side Library Versions'),
                    table({
                        item: tbody(
                            row('Hoist React', hrVersion),
                            row('React', get('reactVersion')),
                            row('ag-Grid', get('agGridVersion')),
                            row('Blueprint Core', get('blueprintCoreVersion')),
                            row('MobX', get('mobxVersion'))
                        )
                    })
                ]
            }),
            bbar: toolbar({
                compact: true,
                items: [
                    filler(),
                    button({
                        text: 'Send Feedback!',
                        icon: Icon.comment({className: 'fa-flip-horizontal'}),
                        onClick: () => XH.showFeedbackDialog()
                    })
                ]
            })
        });
    }
});
