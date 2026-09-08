import {vbox} from '@xh/hoist/cmp/layout';
import {hoistCmp, HoistProps} from '@xh/hoist/core';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {isEmpty} from 'lodash';
import {ReactElement, ReactNode} from 'react';
import {ToolboxLinkProps} from '../../../../core/cmp/ToolboxLink';
import {
    demoGrid,
    demoSection,
    demoToolbar,
    wrapper,
    wrapperAction,
    wrapperOption,
    wrapperOptionGroup
} from '../../../common';
import {InputCatalogEntry} from './InputCatalog';
import {InputDemoModel} from './InputDemoModel';
import './InputDemoPage.scss';

export interface InputDemoPageProps extends HoistProps<InputDemoModel> {
    /** Catalog entry - supplies the rail title and icon. */
    entry: InputCatalogEntry;
    /** Rail title override, for pages shared by several inputs. Defaults to `entry.name`. */
    title?: string;
    /** Rail description as Markdown lines (see `WrapperProps.description`). */
    description: string[];
    links: ToolboxLinkProps[];
    /** True to offer the ambient Compact switch - only for inputs with a `compact` prop. */
    supportsCompact?: boolean;
    /** False to hide the ambient Commit-on-change switch where no specimen supports it. */
    supportsCommitOnChange?: boolean;
    /** `wrapperOption` rows for the Playground-only group. Leave empty to omit the group. */
    playgroundOptions?: ReactElement[];
    /** Playground section body - a `demoPlayground` element. */
    playground?: ReactElement;
    /** Variant cards (`demoRow` elements), laid out three across. */
    variants?: ReactElement[];
    /**
     * Items for the two demo toolbars, built per density. Omit entirely for inputs that are not
     * supported in toolbars (TextArea, JsonInput, CodeInput, Slider).
     */
    toolbarItems?: (compact: boolean) => ReactNode[];
    /** In a Form section body - typically two `demoFrame` cards in a `demoGrid({columns: 2})`. */
    form?: ReactElement;
}

/**
 * The shared per-input page: a Wrapper rail with scoped option groups and a reset action, and a
 * scrollable demo panel stacking Playground -> Variants -> In a Toolbar -> In a Form. Sections
 * whose content is omitted are not rendered.
 */
export const inputDemoPage = hoistCmp.factory<InputDemoPageProps>({
    displayName: 'InputDemoPage',
    render({
        model,
        entry,
        title = entry.name,
        description,
        links,
        supportsCompact = false,
        supportsCommitOnChange = true,
        playgroundOptions,
        playground,
        variants,
        toolbarItems,
        form
    }) {
        return wrapper({
            title,
            icon: entry.icon(),
            description,
            links,
            options: [
                wrapperOptionGroup({
                    label: 'All examples',
                    info: 'Applies to every specimen on the page.',
                    items: [
                        wrapperOption({
                            omit: !supportsCompact,
                            label: 'Compact',
                            propName: `${entry.name}Props.compact`,
                            control: switchInput({bind: 'compact'})
                        }),
                        wrapperOption({
                            label: 'Disabled',
                            propName: 'HoistInputProps.disabled',
                            control: switchInput({bind: 'disabled'})
                        }),
                        wrapperOption({
                            omit: !supportsCommitOnChange,
                            label: 'Commit on change',
                            propName: `${entry.name}Props.commitOnChange`,
                            control: switchInput({bind: 'commitOnChange'})
                        })
                    ]
                }),
                wrapperOptionGroup({
                    omit: isEmpty(playgroundOptions),
                    label: 'Playground only',
                    icon: Icon.experiment(),
                    intent: 'primary',
                    info: 'Drives the Playground instance above. The Variants cards keep their own props.',
                    items: playgroundOptions
                }),
                wrapperAction({
                    icon: Icon.reset(),
                    text: 'Reset all inputs',
                    onClick: () => model.resetSpecimens()
                })
            ],
            item: panel({
                className: 'tb-input-demo',
                width: '100%',
                height: '100%',
                scrollable: true,
                item: vbox({
                    className: 'tb-input-demo__body',
                    items: [
                        demoSection({
                            omit: !playground,
                            title: 'Playground',
                            intent: 'primary',
                            note: 'Driven by the Playground options in the rail',
                            item: playground
                        }),
                        demoSection({
                            omit: isEmpty(variants),
                            title: 'Variants',
                            note: 'Preconfigured combinations worth surfacing - each card sets its own props',
                            item: demoGrid({columns: 3, items: variants})
                        }),
                        demoSection({
                            omit: !toolbarItems,
                            title: 'In a Toolbar',
                            note: 'Alongside the controls it usually sits with',
                            items: toolbarItems
                                ? [
                                      demoToolbar({items: toolbarItems(false)}),
                                      demoToolbar({compact: true, items: toolbarItems(true)})
                                  ]
                                : null
                        }),
                        demoSection({omit: !form, title: 'In a Form', item: form})
                    ]
                })
            })
        });
    }
});
