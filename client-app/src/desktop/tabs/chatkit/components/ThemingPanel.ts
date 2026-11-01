import {ChatModel} from '@xh/hoist-chat-kit/core';
import {chatPanel} from '@xh/hoist-chat-kit/desktop/cmp/chat';
import {ScriptedChatTransport, scriptedDelay, textEvents} from '@xh/hoist-chat-kit/transport';
import {code, div, table, tbody, td, th, thead, tr} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, managed, XH} from '@xh/hoist/core';
import {numberInput, select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {action, bindable, computed} from '@xh/hoist/mobx';
import classNames from 'classnames';
import {isEmpty} from 'lodash';
import type {CSSProperties} from 'react';
import {demoPanel, demoPlayground, demoSection} from '../../../common/Demo';
import {wrapper, wrapperAction, wrapperOption, wrapperOptionGroup} from '../../../common/Wrapper';
import {chatKitPage} from '../ChatKitCatalog';
import {KIT_LINKS, tabSourceLink} from '../common/ChatDemo';
import {createSampleConversation} from '../common/sampleConversation';
import {markdown} from '../common/scriptUtils';
import './ThemingPanel.scss';

const PAGE = chatKitPage('theming');

export const themingPanel = hoistCmp.factory({
    displayName: 'ChatKitThemingPanel',
    model: creates(() => ThemingPanelModel),

    render({model}) {
        const {chatModel, cssVars, scss, compact, reducedMotion} = model;
        return wrapper({
            title: PAGE.title,
            icon: PAGE.icon(),
            description: [
                "Every `--xh-chat-*` variable defaults to a value built from Hoist's own theme",
                "variables, so the chat follows the app's light or dark theme with nothing to set.",
                "To change one, set it on `body.xh-app`, with its unit, as with Hoist's variables.",
                '',
                'Two classes change the chat without a variable: `xh-chat--compact` on a parent',
                "sets a narrow host's padding, bubble width and chart height, and",
                "`xh-chat--reduced-motion` shows the static twin of every moving cue. The browser's",
                'own reduced-motion setting does the same, and `xh-chat--motion` overrides it.',
                '',
                'The preview sets its variables on its own container. Colors and sizes the',
                'components read directly take effect there. A variable that others derive from,',
                'such as the base border radius, must be set on `body.xh-app` to reach them all.'
            ],
            links: [
                {
                    url: '$CK/desktop/cmp/chat/README.md#theming',
                    text: 'Theming',
                    notes: 'The variables by group, their hooks, compact density and reduced motion.'
                },
                {
                    url: '$CK/desktop/cmp/chat/README.md#motion',
                    text: 'Motion',
                    notes: 'The settle, composer growth and the breathing start items.'
                },
                {
                    url: '$CK/styles/vars.scss',
                    text: 'vars.scss',
                    notes: 'Every variable, with its default, in the kit.'
                },
                KIT_LINKS.desktop,
                tabSourceLink('components/ThemingPanel.ts')
            ],
            options: [
                wrapperOptionGroup({
                    label: 'Playground only - variables',
                    icon: Icon.experiment(),
                    intent: 'primary',
                    info: "Set on the preview's container. The snippet shows the override for body.xh-app.",
                    items: [
                        wrapperOption({
                            label: 'Turn gap',
                            propName: '--xh-chat-turn-gap',
                            control: numberInput({
                                bind: 'turnGap',
                                min: 8,
                                max: 64,
                                stepSize: 4,
                                width: 80
                            })
                        }),
                        wrapperOption({
                            label: 'Font size',
                            propName: '--xh-chat-font-size',
                            control: numberInput({
                                bind: 'fontSize',
                                min: 11,
                                max: 18,
                                width: 80
                            })
                        }),
                        wrapperOption({
                            label: 'Column max width',
                            propName: '--xh-chat-column-max-width',
                            control: numberInput({
                                bind: 'columnMaxWidth',
                                min: 400,
                                max: 1200,
                                stepSize: 40,
                                width: 80
                            })
                        }),
                        wrapperOption({
                            label: 'User bubble width',
                            propName: '--xh-chat-user-max-width',
                            control: numberInput({
                                bind: 'userMaxWidth',
                                min: 40,
                                max: 100,
                                stepSize: 5,
                                width: 80
                            })
                        }),
                        wrapperOption({
                            label: 'User bubble color',
                            propName: '--xh-chat-user-bg',
                            control: select({
                                bind: 'userBg',
                                options: USER_BG_OPTIONS,
                                enableFilter: false,
                                width: 150
                            })
                        }),
                        wrapperOption({
                            label: 'User bubble corners',
                            propName: '--xh-chat-user-border-radius',
                            control: select({
                                bind: 'userBorderRadius',
                                options: USER_RADIUS_OPTIONS,
                                enableFilter: false,
                                width: 150
                            })
                        }),
                        wrapperOption({
                            label: 'Meta text color',
                            propName: '--xh-chat-meta-text-color',
                            control: select({
                                bind: 'metaColor',
                                options: META_COLOR_OPTIONS,
                                enableFilter: false,
                                width: 150
                            })
                        })
                    ]
                }),
                wrapperOptionGroup({
                    label: 'Classes',
                    info: "Added to the preview's container.",
                    items: [
                        wrapperOption({
                            label: 'Compact density',
                            propName: 'xh-chat--compact',
                            control: switchInput({bind: 'compact'})
                        }),
                        wrapperOption({
                            label: 'Reduced motion',
                            propName: 'xh-chat--reduced-motion',
                            control: switchInput({bind: 'reducedMotion'})
                        })
                    ]
                }),
                wrapperAction({
                    icon: XH.darkTheme ? Icon.sun() : Icon.moon(),
                    text: XH.darkTheme ? 'Switch to light theme' : 'Switch to dark theme',
                    onClick: () => XH.toggleTheme()
                }),
                wrapperAction({
                    icon: Icon.reset(),
                    text: 'Reset variables',
                    onClick: () => model.reset()
                })
            ],
            item: demoPanel({
                className: 'tb-chatkit-theming',
                items: [
                    demoSection({
                        title: 'Playground',
                        intent: 'primary',
                        item: demoPlayground({
                            instanceWidth: 620,
                            showValue: false,
                            caption:
                                'The same conversation, with the variables from the rail. Send a message to see the live cues.',
                            config: scss,
                            item: div({
                                className: classNames(
                                    'tb-chatkit-theming__preview',
                                    compact && 'xh-chat--compact',
                                    reducedMotion && 'xh-chat--reduced-motion'
                                ),
                                style: cssVars as CSSProperties,
                                item: chatPanel({
                                    model: chatModel,
                                    title: 'Analyst',
                                    icon: Icon.ai(),
                                    compactHeader: true,
                                    height: 560,
                                    messageListProps: {assistantName: 'Analyst'},
                                    composerProps: {placeholder: 'Ask about the desks...'}
                                })
                            })
                        })
                    }),
                    demoSection({
                        title: 'Main variables',
                        note: "Defaults come from Hoist's own theme variables. See vars.scss for every group.",
                        item: variableTable()
                    })
                ]
            })
        });
    }
});

//------------------------------------------------------------------
// Model
//------------------------------------------------------------------
const DEFAULTS = {
    turnGap: 24,
    fontSize: 13,
    columnMaxWidth: 808,
    userMaxWidth: 75,
    userBg: 'default',
    userBorderRadius: 'default',
    metaColor: 'default'
};

const USER_BG_OPTIONS = [
    {value: 'default', label: 'Primary tint (default)'},
    {value: 'var(--xh-bg-alt)', label: 'Alternate background'},
    {value: 'var(--xh-intent-success-trans1)', label: 'Success tint'},
    {value: 'var(--xh-intent-warning-trans1)', label: 'Warning tint'},
    {value: 'transparent', label: 'None'}
];

const USER_RADIUS_OPTIONS = [
    {value: 'default', label: 'Frames (default)'},
    {value: '16px 16px 4px 16px', label: 'Speech tail'},
    {value: '16px', label: 'Pill'},
    {value: '0', label: 'Square'}
];

const META_COLOR_OPTIONS = [
    {value: 'default', label: 'Blue gray (default)'},
    {value: 'var(--xh-text-color-muted)', label: 'Muted text'},
    {value: 'var(--xh-intent-primary-text-color)', label: 'Primary'}
];

class ThemingPanelModel extends HoistModel {
    @bindable accessor turnGap = DEFAULTS.turnGap;
    @bindable accessor fontSize = DEFAULTS.fontSize;
    @bindable accessor columnMaxWidth = DEFAULTS.columnMaxWidth;
    @bindable accessor userMaxWidth = DEFAULTS.userMaxWidth;
    @bindable accessor userBg = DEFAULTS.userBg;
    @bindable accessor userBorderRadius = DEFAULTS.userBorderRadius;
    @bindable accessor metaColor = DEFAULTS.metaColor;
    @bindable accessor compact = false;
    @bindable accessor reducedMotion = false;

    @managed readonly chatModel = new ChatModel({
        transport: new ScriptedChatTransport({
            delayMs: 18,
            respond: () => [scriptedDelay(500), textEvents(REPLY)]
        }),
        initialMessages: createSampleConversation()
    });

    /** The variables that differ from their defaults, as a style object for the preview. */
    @computed
    get cssVars(): Record<string, string> {
        const {
                turnGap,
                fontSize,
                columnMaxWidth,
                userMaxWidth,
                userBg,
                userBorderRadius,
                metaColor
            } = this,
            ret: Record<string, string> = {};
        if (turnGap !== DEFAULTS.turnGap) ret['--xh-chat-turn-gap'] = `${turnGap}px`;
        if (fontSize !== DEFAULTS.fontSize) ret['--xh-chat-font-size'] = `${fontSize}px`;
        if (columnMaxWidth !== DEFAULTS.columnMaxWidth) {
            ret['--xh-chat-column-max-width'] = `${columnMaxWidth}px`;
        }
        if (userMaxWidth !== DEFAULTS.userMaxWidth)
            ret['--xh-chat-user-max-width'] = `${userMaxWidth}%`;
        if (userBg !== DEFAULTS.userBg) ret['--xh-chat-user-bg'] = userBg;
        if (userBorderRadius !== DEFAULTS.userBorderRadius) {
            ret['--xh-chat-user-border-radius'] = userBorderRadius;
        }
        if (metaColor !== DEFAULTS.metaColor) ret['--xh-chat-meta-text-color'] = metaColor;
        return ret;
    }

    /** The same overrides as the SCSS an app would write. */
    @computed
    get scss(): string {
        const lines = Object.entries(this.cssVars).map(([k, v]) => `  ${k}: ${v};`);
        return isEmpty(lines)
            ? '// Every variable at its default - nothing to override.'
            : `body.xh-app {\n${lines.join('\n')}\n}`;
    }

    @action
    reset() {
        Object.assign(this, DEFAULTS);
    }
}

const REPLY = markdown(`
    Energy has the most room: **$32m** under its gross limit. Technology and Regional Banks are
    both over, so any new risk should go to Energy or wait for the other two to come down.

    - Technology: 112% of limit, over since Tuesday
    - Regional Banks: 104% of limit, over since this morning
    - Energy: 73% of limit
`);

//------------------------------------------------------------------
// Variable reference
//------------------------------------------------------------------
const VARIABLES: Array<[group: string, name: string, def: string]> = [
    ['Type', '--xh-chat-font-size', '--xh-font-size (13px)'],
    ['Type', '--xh-chat-line-height', '1.5'],
    ['Type', '--xh-chat-heading-font-size', '--xh-font-size-large, for markdown H1 and H2'],
    ['Type', '--xh-chat-code-font-size', '--xh-font-size minus 1'],
    ['Type', '--xh-chat-meta-font-size', '--xh-font-size times 0.9'],
    ['Layout', '--xh-chat-column-max-width', '808px, for the thread, cards and composer'],
    ['Layout', '--xh-chat-prose-max-width', 'none'],
    ['Layout', '--xh-chat-side-pad', '--xh-pad-double (20px)'],
    ['Layout', '--xh-chat-turn-gap', '24px, between messages'],
    ['Layout', '--xh-chat-part-gap, --xh-chat-process-gap', '--xh-pad, --xh-pad-half'],
    ['Layout', '--xh-chat-user-max-width', '75%, for the user bubble'],
    ['Layout', '--xh-chat-user-border-radius', '--xh-chat-border-radius. Takes four corners'],
    ['Layout', '--xh-chat-border-radius', '--xh-border-radius (4px), for every frame'],
    ['Color', '--xh-chat-bg, --xh-chat-text-color', '--xh-bg, --xh-text-color'],
    ['Color', '--xh-chat-meta-text-color', '--xh-blue-gray, --xh-text-color-muted in dark'],
    ['Color', '--xh-chat-user-bg', '--xh-intent-primary-trans1, a light tint of the primary color'],
    ['Color', '--xh-chat-part-border-color', '--xh-border-color'],
    ['Color', '--xh-chat-code-bg', '--xh-grid-bg-odd'],
    ['Status', '--xh-chat-busy-color', '--xh-intent-primary-text-color'],
    ['Status', '--xh-chat-attention-color', '--xh-card-primary-color'],
    [
        'Status',
        '--xh-chat-success-color, -warning-color, -error-color',
        "Hoist's intent text colors"
    ],
    ['Composer', '--xh-chat-composer-bg', '--xh-input-bg'],
    ['Composer', '--xh-chat-composer-border-color', '--xh-border-color'],
    ['Composer', '--xh-chat-composer-focus-border-color', '--xh-form-field-focused-border-color'],
    ['Composer', '--xh-chat-composer-pill-height', '24px'],
    ['Motion', '--xh-chat-motion-enter, -rise, -stagger', '360ms, 8px, 60ms, for the settle'],
    ['Motion', '--xh-chat-motion-grow', '160ms, for composer growth. 0ms turns it off']
];

function variableTable() {
    return table({
        className: 'tb-chatkit-theming__table',
        items: [
            thead(tr(th('Group'), th('Variable'), th('Default'))),
            tbody(
                VARIABLES.map(([group, name, def], idx) =>
                    tr({key: idx, items: [td(group), td(code(name)), td(def)]})
                )
            )
        ]
    });
}
