import {HoistModel} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {LocalDate} from '@xh/hoist/utils/datetime';

// Sentinel string indicating "don't pass this prop at all" (vs. passing it with value `null`).
export const UNSET = '__unset';

// Seed CSS loaded into the editor when the override is first enabled - matches the most
// common dev workaround attempted when inputs don't stretch: force `width: 100%` on the
// Hoist-input root class.
const DEFAULT_CSS_OVERRIDE = `/* Selectors here are auto-scoped to the specimens container. */
.xh-input { width: 100% !important; }
`;

type ContainerShape = 'block' | 'hbox' | 'vbox';

/**
 * Model for the Input Sizing Test page.
 *
 * Drives three layers of control:
 *   1. Outer container shape/size - so specimens render in a realistic layout context.
 *   2. Layout props applied to every specimen (width, flex, minWidth, maxWidth) - so we can
 *      verify whether each HoistInput honors them uniformly.
 *   3. A "pure CSS override" switch - simulates the user applying CSS that targets
 *      `.xh-input` in an attempt to stretch the component. Lets us see which inputs can
 *      actually be stretched via CSS alone today.
 */
export class InputSizingTestModel extends HoistModel {
    @bindable containerShape: ContainerShape = 'hbox';
    @bindable containerWidth = 600;
    @bindable containerHeight = 400;
    @bindable containerGap = 12;

    // Layout prop controls — each holds either UNSET (don't pass) or a string form of the value.
    @bindable widthVal: string = UNSET;
    @bindable flexVal: string = UNSET;
    @bindable minWidthVal: string = UNSET;
    @bindable maxWidthVal: string = UNSET;

    // CSS override experiments - free-form CSS text, auto-scoped via CSS nesting to
    // `.tb-input-sizing-test__specimen-container` so selectors only affect specimens.
    @bindable cssOverrideEnabled = false;
    @bindable cssOverrideText: string = DEFAULT_CSS_OVERRIDE;

    // Per-specimen value bindings
    @bindable textVal = 'hello';
    @bindable numberVal: number = 42;
    @bindable selectVal: string = 'AZ';
    @bindable pickerVal: string = 'AZ';
    @bindable multiPickerVal: string[] = ['AZ', 'CA'];
    @bindable.ref dateVal: LocalDate = null;
    @bindable textAreaVal = 'first line\nsecond line';
    @bindable codeVal = '{\n  "hello": 1\n}';
    @bindable jsonVal = '{"a": 1, "b": [2, 3]}';
    @bindable sliderVal: number = 50;
    @bindable segVal: string = 'a';
    @bindable btnGrpVal: string = 'a';

    constructor() {
        super();
        makeObservable(this);
    }

    /**
     * Resolve the current control values into a plain object of layout props to spread onto
     * every specimen. Omits any prop set to UNSET so the component's own default applies.
     */
    get layoutProps(): Record<string, any> {
        const out: Record<string, any> = {};
        out.width = this.resolveWidthLike(this.widthVal, out);
        out.flex = this.resolveNumLike(this.flexVal);
        out.minWidth = this.resolveNumLike(this.minWidthVal);
        out.maxWidth = this.resolveNumLike(this.maxWidthVal);
        // Strip UNSET sentinel
        for (const k of Object.keys(out)) if (out[k] === UNSET) delete out[k];
        return out;
    }

    resetLayoutProps() {
        this.widthVal = UNSET;
        this.flexVal = UNSET;
        this.minWidthVal = UNSET;
        this.maxWidthVal = UNSET;
    }

    private resolveWidthLike(v: string, _out: any): any {
        if (v === UNSET) return UNSET;
        if (v === 'null') return null;
        if (v.endsWith('%')) return v;
        const n = Number(v);
        return isNaN(n) ? UNSET : n;
    }

    private resolveNumLike(v: string): any {
        if (v === UNSET) return UNSET;
        if (v === 'null') return null;
        const n = Number(v);
        return isNaN(n) ? UNSET : n;
    }
}
