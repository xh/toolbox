import {hoistCmp, HoistProps, uses} from '@xh/hoist/core';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {isEmpty} from 'lodash';
import {ReactElement, ReactNode} from 'react';
import {ToolboxLinkProps} from '../../../../core/cmp/ToolboxLink';
import {
    demoGrid,
    demoPanel,
    demoSection,
    demoToolbar,
    wrapper,
    wrapperAction,
    wrapperOption,
    wrapperOptionGroup
} from '../../../common';
import {InputCatalogEntry} from './InputCatalog';
import {InputDemoModel} from './InputDemoModel';

export interface InputDemoPageProps extends HoistProps<InputDemoModel> {
    /** Catalog entry - supplies the rail title and icon. */
    entry: InputCatalogEntry;
    /** Rail title override, for pages shared by several inputs. Defaults to `entry.name`. */
    title?: string;
    /** Rail description as Markdown lines (see `WrapperProps.description`). */
    description: string[];
    links: ToolboxLinkProps[];
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
    model: uses(InputDemoModel),
    render({
        model,
        entry,
        title = entry.name,
        description,
        links,
        playgroundOptions,
        playground,
        variants,
        toolbarItems,
        form
    }) {
        const {supportsCompact, commitOnChangeDefault} = model;
        return wrapper({
            title,
            icon: entry.icon(),
            description,
            links,
            options: [
                wrapperOptionGroup({
                    omit: isEmpty(playgroundOptions),
                    label: 'Playground only',
                    icon: Icon.experiment(),
                    intent: 'primary',
                    info: 'Drives the Playground instance.',
                    items: playgroundOptions
                }),
                wrapperOptionGroup({
                    label: 'All inputs on the page',
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
                            omit: commitOnChangeDefault == null,
                            label: 'Commit on change',
                            propName: `${entry.name}Props.commitOnChange`,
                            control: switchInput({bind: 'commitOnChange'})
                        })
                    ]
                }),
                wrapperAction({
                    icon: Icon.reset(),
                    text: 'Reset all inputs',
                    onClick: () => model.resetInputs()
                })
            ],
            item: demoPanel({
                className: 'tb-input-demo',
                items: [
                    demoSection({
                        omit: !playground,
                        title: 'Playground',
                        intent: 'primary',
                        note: 'Driven by the Playground options in the rail.',
                        item: playground
                    }),
                    demoSection({
                        omit: isEmpty(variants),
                        title: 'Variants',
                        note: 'Preconfigured combinations worth surfacing - each card sets its own props.',
                        item: demoGrid({columns: 3, items: variants})
                    }),
                    demoSection({
                        omit: !toolbarItems,
                        title: 'In a Toolbar',
                        note: 'Alongside the controls it usually sits with.',
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
        });
    }
});
