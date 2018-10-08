/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import React, {Component} from 'react';
import {HoistComponent, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../common/Wrapper';
import logo from '../../../core/img/xhio+hoist.png';
import logoDark from '../../../core/img/xhio+hoist-dark.png';
import './HomeTab.scss';

@HoistComponent
export class HomeTab extends Component {
    render() {
        const link = (txt, url) => <a href={url} target="_blank">{txt}</a>;

        return wrapper(
            panel({
                width: 700,
                height: 400,
                title: 'Welcome to Toolbox',
                icon: Icon.home(),
                item: [
                    <div className="toolbox-welcome">
                        <p>
                            Toolbox provides an inventory and examples of key components,
                            code, and UI patterns available in {link('Hoist React', 'https://github.com/exhi/hoist-react/')},
                            a library created by {link('Extremely Heavy Industries', 'https://xh.io')} for
                            building and operating enterprise web applications.
                        </p>
                        <p>
                            Navigate using the tabs above to explore the available components. The Toolbox
                            app itself is written using Hoist React, and its {link('source code', 'https://github.com/exhi/toolbox')} is
                            available on Github for review.
                        </p>
                        <div className="toolbox-welcome__logo">
                            <img src={XH.darkTheme ? logoDark : logo} alt="xh.io + Hoist"/>
                            <p>
                                Please do not hesitate to {link('contact us', 'https://xh.io/contact/')} with
                                questions or for more information.
                            </p>
                        </div>
                    </div>
                ]
            })
        );
    }
}