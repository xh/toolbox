import {library} from '@fortawesome/fontawesome-svg-core';
import {faPaperPlane, faRobot, faUserRobotXmarks} from '@fortawesome/pro-regular-svg-icons';
import {elementFactory, hoistCmp, uses, XH} from '@xh/hoist/core';
import {appBar, appBarSeparator} from '@xh/hoist/desktop/cmp/appbar';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {AppModel} from './AppModel';
import '../../core/Toolbox.scss';
import {div, fragment} from '@xh/hoist/cmp/layout';
import {jsonInput, select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {button} from '@xh/hoist/desktop/cmp/button';
import ReactMarkdown from 'react-markdown';
import {popover} from '@xh/hoist/kit/blueprint';
import {chatPanel} from './cmp/ChatPanel';

library.add(faPaperPlane, faRobot, faUserRobotXmarks);

export const AppComponent = hoistCmp({
    displayName: 'App',
    model: uses(AppModel),

    render() {
        return panel({
            tbar: appBar({
                icon: Icon.icon({iconName: 'robot', size: '2x'}),
                appMenuButtonProps: {hideLogoutItem: false},
                rightItems: [appBarControls()]
            }),
            items: chatPanel()
        });
    }
});

const appBarControls = hoistCmp.factory<AppModel>({
    render({model}) {
        const popSize = {width: '70vw', minWidth: '800px', height: '80vh'};
        return fragment(
            popover({
                target: button({
                    text: 'Functions',
                    icon: Icon.func(),
                    outlined: true
                }),
                content: panel({
                    title: 'Provided Function Library',
                    icon: Icon.func(),
                    compactHeader: true,
                    className: 'xh-popup--framed',
                    ...popSize,
                    item: jsonInput({
                        value: JSON.stringify(XH.chatGptService.functions, null, 2),
                        readonly: true,
                        width: '100%',
                        height: '100%'
                    })
                })
            }),
            appBarSeparator(),
            popover({
                target: button({
                    text: 'System Message',
                    icon: Icon.gear(),
                    outlined: true
                }),
                content: panel({
                    title: 'Initial System Message',
                    icon: Icon.gear(),
                    compactHeader: true,
                    className: 'xh-popup--framed',
                    item: div({
                        style: {...popSize, padding: 10, overflow: 'auto'},
                        item: reactMarkdown({
                            item: XH.chatGptService.systemMessage?.content ?? 'None found'
                        })
                    })
                })
            }),
            switchInput({
                value: XH.chatGptService.sendSystemMessage,
                onChange: v => (XH.chatGptService.sendSystemMessage = v)
            }),
            appBarSeparator(),
            modelSelector()
        );
    }
});

const modelSelector = hoistCmp.factory({
    render() {
        return select({
            enableFilter: false,
            width: 150,
            value: XH.chatGptService.model,
            options: XH.chatGptService.selectableModels,
            onChange: v => (XH.chatGptService.model = v)
        });
    }
});

const reactMarkdown = elementFactory(ReactMarkdown);
