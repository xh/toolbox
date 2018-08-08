/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../common/Wrapper';
import logo from '../../../core/img/xhio+hoist.png';
import './HomeTab.scss';

@HoistComponent()
export class HomeTab extends Component {
    render() {
        return wrapper(
            panel({
                width: 700,
                height: 400,
                title: 'Welcome to Toolbox',
                icon: Icon.home(),
                item: [
                    <div className="toolbox-welcome">
                        <p>
                            Toolbox provides an inventory and demonstration of key components,
                            code, and UI patterns available
                            in <a href="https://github.com/exhi/hoist-react/" target="_blank">Hoist React</a>,
                            a library created by <a href="https://xh.io" target="_blank"> Extremely
                            Heavy Industries</a> for building and operating enterprise web applications.
                        </p>
                        <p>
                            Navigate using the tabs above to explore the available examples. The Toolbox
                            app itself is written using Hoist React, and its <a href="https://github.com/exhi/toolbox">source
                            code</a> is available on Github for review.
                        </p>
                        <div className="toolbox-welcome__logo">
                            <img src={logo} alt="xh.io + Hoist"/>
                            <p>
                                Please do not hesitate to <a href="https://xh.io/contact/">contact us</a> with
                                any questions or for more information.
                            </p>
                        </div>
                    </div>
                ]
            })
        );
    }
}