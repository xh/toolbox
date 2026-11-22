import {a, li, p, ul, vbox} from '@xh/hoist/cmp/layout';
import {XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';

/** The "How Blueprints work" dialog: the concepts, and where to read more. */
export function showBlueprintsHelp() {
    XH.alert({
        title: 'How Blueprints work',
        icon: Icon.questionCircle(),
        message: vbox({
            className: 'tb-blueprints-help',
            items: [
                p(
                    'A blueprint describes a dashboard as JSON: its widgets and layout, the data sources they read, and the variables that link them. Pick one in the library, or start a new one, and build or change it by hand or by asking the Architect.'
                ),
                p(
                    'Your own blueprints open as drafts, which save as you work and are private until you share them. Others you share with see only your published versions: they run the latest, and may copy it to make it their own. Each blueprint keeps its own conversation with the Architect, in this browser.'
                ),
                p(
                    'Data Catalog lists the data a blueprint can read, and Registry the widgets it can draw.'
                ),
                ul(
                    li(
                        a({
                            href: '/app/docs/hoist-chat-kit/blueprint~README.md',
                            target: '_blank',
                            item: 'Blueprints, in the docs'
                        })
                    ),
                    li(
                        a({
                            href: 'https://github.com/xh/toolbox/tree/develop/client-app/src/blueprints',
                            target: '_blank',
                            item: "Toolbox's blueprint code"
                        })
                    )
                )
            ]
        })
    });
}
