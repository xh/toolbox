import React from 'react';
import {hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../common/Wrapper';
import xhHoist from '../../../core/img/xh+hoist.png';
import './HomeTab.scss';

export const homeTab = hoistCmp.factory(
    () => {
        const link = (txt, url) => <a href={url} target="_blank">{txt}</a>;

        return wrapper(
            panel({
                width: 700,
                title: 'Welcome to Toolbox',
                icon: Icon.home(),
                items: [
                    <div className="toolbox-welcome">
                        <div className="toolbox-welcome__logo">
                            <img src={xhHoist} alt="xh.io + Hoist"/>
                        </div>
                        <p>
                            Toolbox demonstrates key components, code patterns, utilities, and other tooling included
                            in {link('Hoist React', 'https://github.com/xh/hoist-react/')} and {link('Hoist Core', 'https://github.com/xh/hoist-core/')}, libraries
                            created by {link('Extremely Heavy', 'https://xh.io')} for
                            building and operating enterprise web applications.
                        </p>
                        <p>
                            Hoist provides a curated selection of custom and third-party components, all pre-integrated to
                            function as part of an overall full-stack framework for web application development authored and
                            maintained by XH.
                        </p>
                        <p>
                            The Toolbox app itself is written using Hoist, and its {link('source code', 'https://github.com/xh/toolbox')} is
                            available on Github for review.
                        </p>
                        <p>
                            {link('Contact us', 'https://xh.io/contact/')} with questions or for more information - we would love to hear from you!
                        </p>
                        <p className="toolbox-welcome__signoff">
                            {link('- The XH Team', 'https://xh.io/team/')}
                        </p>
                    </div>
                ]
            })
        );
    }
);