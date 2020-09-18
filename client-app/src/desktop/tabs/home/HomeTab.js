import {box, hframe} from '@xh/hoist/cmp/layout';
import React from 'react';
import {hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../common/Wrapper';
import xhHoist from '../../../core/img/xh+hoist.png';
import {roadmapView} from './roadmap/RoadmapView';
import './HomeTab.scss';

export const homeTab = hoistCmp.factory(
    () => wrapper(
        box({
            className: 'tb-home',
            items: [
                welcomePanel(),
                roadmapView()
            ]
        })
    )
);

const welcomePanel = hoistCmp.factory(
    () => {
        const link = (txt, url) => <a href={url} target="_blank">{txt}</a>;
        return panel({
            title: 'Welcome to Toolbox',
            icon: Icon.home(),
            className: 'tb-welcome',
            items: [
                hframe(
                    <div className="tb-welcome__logo">
                        <img src={xhHoist} alt="xh.io + Hoist"/>
                    </div>,
                    <div className="tb-welcome__greeting">
                        <p>
                            Toolbox demonstrates key components, code patterns, utilities, and
                            other tooling included in {link('Hoist React', 'https://github.com/xh/hoist-react/')} and {link('Hoist Core', 'https://github.com/xh/hoist-core/')},
                            libraries created by {link('Extremely Heavy', 'https://xh.io')} for
                            building and operating enterprise web applications.
                        </p>
                        <p>
                            Hoist provides a curated selection of custom and third-party components,
                            pre-integrated to function as a highly productive full-stack framework
                            for web application development.
                        </p>
                        <p>
                            The Toolbox app itself is written using Hoist, and
                            its {link('source code', 'https://github.com/xh/toolbox')} is
                            available for review.
                        </p>
                        <p>
                            {link('Contact us', 'https://xh.io/contact/')} with questions
                            or for more information - we would love to hear from you!
                        </p>
                        <p className="tb-welcome__signoff">
                            {link('- The XH Team', 'https://xh.io/team/')}</p>
                    </div>
                )
            ]
        });
    }
);