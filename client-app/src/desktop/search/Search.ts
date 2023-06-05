import {createRef} from 'react';
import {createFilter} from 'react-select';
import {isEmpty} from 'lodash';
import {XH, HoistModel, hoistCmp, creates, PlainObject} from '@xh/hoist/core';
import {HoistInputModel} from '@xh/hoist/cmp/input';
import {select} from '@xh/hoist/desktop/cmp/input';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {getLayoutProps} from '@xh/hoist/utils/react';
import {useHotkeys} from '@xh/hoist/desktop/hooks';
import {Icon} from '@xh/hoist/icon';
import {wait} from '@xh/hoist/promise';

export const search = hoistCmp.factory({
    model: creates(() => new Model()),
    render({model, ...props}) {
        const {globalSearchOptions, selectRef} = model;

        if (isEmpty(globalSearchOptions)) return null;

        return useHotkeys(
            select({
                ref: selectRef,
                ...getLayoutProps(props),
                leftIcon: Icon.search(),
                bind: 'globalSearchSelection',
                options: globalSearchOptions,
                placeholder: 'Search for a component...(s)',
                hideDropdownIndicator: true,
                enableClear: true,
                valueField: 'route',
                filterFn: createFilter(null),
                onChange: val => model.forwardToTopic(val)
            }),
            [
                {
                    global: true,
                    combo: 's',
                    label: 'Go to search',
                    onKeyUp: () => model.focus()
                }
            ]
        );
    }
});

class Model extends HoistModel {
    @bindable
    globalSearchSelection;

    selectRef = createRef<HoistInputModel>();

    get globalSearchOptions(): PlainObject[] {
        return XH.getConf('searchOptions', []);
    }

    constructor() {
        super();
        makeObservable(this);
    }

    forwardToTopic(val) {
        if (val) {
            if (val.startsWith('launch.')) {
                this.openExternal(val);
            } else {
                XH.navigate(val.split('|')[0]);
            }

            XH.track({
                category: 'Global Search',
                message: 'Selected result',
                data: {topic: val}
            });
        }

        // keeps focus on select box to facilate typing a new query
        this.blur();
        wait(100).then(() => this.focus());
    }

    openExternal(val) {
        const path = val.replace('launch.examples.', '');
        window.open(`/${path}`);
    }

    focus() {
        this.selectRef?.current.focus();
    }

    blur() {
        this.selectRef?.current.blur();
    }
}

/**
 * This is the JSON array that should go into a config called searchOptions
 * This can be deleted if this is ever merged in and the searchOptions is added.
 * Routes and Labels may need to be updated/removed/added below as toolbox changes.
 *

 [
 {
    "label": "containers",
    "route": "default.layout",
    "options": [
      {
        "label": "TabContainer",
        "route": "default.layout.tabPanel"
      },
      {
        "label": "Top Tabs",
        "route": "default.layout.tabPanel|Top"
      },
      {
        "label": "Bottom Tabs",
        "route": "default.layout.tabPanel|Bottom"
      },
      {
        "label": "Left Tabs",
        "route": "default.layout.tabPanel|Left"
      },
      {
        "label": "Right Tabs",
        "route": "default.layout.tabPanel|Right"
      },
      {
        "label": "Custom Tab Switcher",
        "route": "default.layout.tabPanel|Switcher"
      },
      {
        "label": "Tab State",
        "route": "default.layout.tabPanel|State"
      },
      {
        "label": "Dynamic Tabs",
        "route": "default.layout.tabPanel|Dynamic"
      },
      {
        "label": "DockContainer",
        "route": "default.layout.dock"
      },
      {
        "label": "DashCanvas",
        "route": "default.layout.dashCanvas"
      },
      {
        "label": "DashContainer",
        "route": "default.layout.dashContainer"
      },
      {
        "label": "HBox",
        "route": "default.layout.hbox"
      },
      {
        "label": "VBox",
        "route": "default.layout.vbox"
      },
      {
        "label": "TileFrame",
        "route": "default.layout.tileFrame"
      }
    ]
  },
 {
    "label": "Examples",
    "route": "default.examples",
    "options": [
      {
        "label": "Portfolio",
        "route": "launch.examples.portfolio"
      },
      {
        "label": "News",
        "route": "launch.examples.news"
      },
      {
        "label": "FDA Recalls",
        "route": "launch.examples.recalls"
      },
      {
        "label": "File Manager",
        "route": "launch.examples.fileManager"
      }
    ]
  },
 {
    "label": "panels",
    "route": "default.panels",
    "options": [
      {
        "label": "LoadingIndicator",
        "route": "default.panels.loadingIndicator"
      },
      {
        "label": "Mask",
        "route": "default.panels.mask"
      },
      {
        "label": "Sizing",
        "route": "default.panels.sizing"
      },
      {
        "label": "Toolbars",
        "route": "default.panels.toolbars"
      }
    ]
  },
 {
    "label": "charts",
    "route": "default.charts",
    "options": [
      {
        "label": "Line",
        "route": "default.charts.line"
      },
      {
        "label": "Chart Aspect Ratio",
        "route": "default.charts.line|AspectRatio"
      },
      {
        "label": "OHLC",
        "route": "default.charts.ohlc"
      },
      {
        "label": "Grid TreeMap",
        "route": "default.charts.gridTreeMap"
      },
      {
        "label": "Simple TreeMap",
        "route": "default.charts.simpleTreeMap"
      },
      {
        "label": "Split TreeMap",
        "route": "default.charts.splitTreeMap"
      }
    ]
  },
 {
    "label": "grids",
    "route": "default.grids",
    "options": [
      {
        "label": "Standard",
        "route": "default.grids.standard"
      },
      {
        "label": "Tree with CheckBox",
        "route": "default.grids.treeWithCheckBox"
      },
      {
        "label": "Grouped Rows",
        "route": "default.grids.groupedRows"
      },
      {
        "label": "Grouped Cols",
        "route": "default.grids.groupedCols"
      },
      {
        "label": "Dataview",
        "route": "default.grids.dataview"
      },
      {
        "label": "agGrid",
        "route": "default.grids.agGrid"
      },
      {
        "label": "Tree",
        "route": "default.grids.tree"
      },
      {
        "label": "Rest",
        "route": "default.grids.rest"
      }
    ]
  },
 {
    "label": "forms",
    "route": "default.forms",
    "options": [
      {
        "label": "Toolbar Form",
        "route": "default.forms.toolbarForm"
      },
      {
        "label": "Inputs",
        "route": "default.forms.inputs"
      },
      {
        "label": "TextInput",
        "route": "default.forms.inputs|TextInput"
      },
      {
        "label": "TextArea",
        "route": "default.forms.inputs|TextArea"
      },
      {
        "label": "JSONInput",
        "route": "default.forms.inputs|JSONInput"
      },
      {
        "label": "NumberInput",
        "route": "default.forms.inputs|NumberInput"
      },
      {
        "label": "Slider",
        "route": "default.forms.inputs|Slider"
      },
      {
        "label": "DateInput",
        "route": "default.forms.inputs|DateInput"
      },
      {
        "label": "Select",
        "route": "default.forms.inputs|Select"
      },
      {
        "label": "Checkbox",
        "route": "default.forms.inputs|Checkbox"
      },
      {
        "label": "ButtonGroupInput",
        "route": "default.forms.inputs|ButtonGroupInput"
      },
      {
        "label": "RadioInput",
        "route": "default.forms.inputs|RadioInput"
      },
      {
        "label": "Form",
        "route": "default.forms.form"
      }
    ]
  },
 {
    "label": "other",
    "route": "default.other",
    "options": [
      {
        "label": "LeftRightChooser",
        "route": "default.other.leftRightChooser"
      },
      {
        "label": "File Chooser",
        "route": "default.other.fileChooser"
      },
      {
        "label": "Timestamp",
        "route": "default.other.timestamp"
      },
      {
        "label": "PinPad",
        "route": "default.other.pinPad"
      },
      {
        "label": "Clock",
        "route": "default.other.clock"
      },
      {
        "label": "Icons",
        "route": "default.other.icons"
      },
      {
        "label": "Element Factories vs. JSX",
        "route": "default.other.jsx"
      }
    ]
  },
 {
    "label": "App Notifications",
    "route": "default.other.appNotifications",
    "options": [
      {
        "label": "App Update",
        "route": "default.other.appNotifications|Update"
      },
      {
        "label": "App Sleep Mode",
        "route": "default.other.appNotifications|Sleep"
      }
    ]
  },
 {
    "label": "Number Formats",
    "route": "default.other.numberFormats",
    "options": [
      {
        "label": "fmtNumber",
        "route": "default.other.numberFormats|fmtNumber"
      },
      {
        "label": "fmtPrice",
        "route": "default.other.numberFormats|fmtPrice"
      },
      {
        "label": "fmtQuantity",
        "route": "default.other.numberFormats|fmtQuantity"
      },
      {
        "label": "fmtPercent",
        "route": "default.other.numberFormats|fmtPercent"
      },
      {
        "label": "fmtThousands",
        "route": "default.other.numberFormats|fmtThousands"
      },
      {
        "label": "fmtMillions",
        "route": "default.other.numberFormats|fmtMillions"
      },
      {
        "label": "fmtBillions",
        "route": "default.other.numberFormats|fmtBillions"
      },
      {
        "label": "Precision",
        "route": "default.other.numberFormats|Precision"
      },
      {
        "label": "zeroPad",
        "route": "default.other.numberFormats|zeroPad"
      },
      {
        "label": "ledger",
        "route": "default.other.numberFormats|ledger"
      },
      {
        "label": "forceLedgerAlign",
        "route": "default.other.numberFormats|forceLedgerAlign"
      },
      {
        "label": "colorSpec",
        "route": "default.other.numberFormats|colorSpec"
      },
      {
        "label": "withPlusSign",
        "route": "default.other.numberFormats|withPlusSign"
      },
      {
        "label": "withSignGlyph",
        "route": "default.other.numberFormats|withSignGlyph"
      },
      {
        "label": "label",
        "route": "default.other.numberFormats|label"
      },
      {
        "label": "nullDisplay",
        "route": "default.other.numberFormats|nullDisplay"
      }
    ]
  },
 {
    "label": "Date Formats",
    "route": "default.other.dateFormats",
    "options": [
      {
        "label": "fmtDate",
        "route": "default.other.dateFormats|fmtDate"
      },
      {
        "label": "fmtCompactDate",
        "route": "default.other.dateFormats|fmtCompactDate"
      },
      {
        "label": "fmtDateTime",
        "route": "default.other.dateFormats|fmtDateTime"
      },
      {
        "label": "fmtTime",
        "route": "default.other.dateFormats|fmtTime"
      },
      {
        "label": "tooltip",
        "route": "default.other.dateFormats|tooltip"
      }
    ]
  },
 {
    "label": "Popups",
    "route": "default.other.popups",
    "options": [
      {
        "label": "Alert",
        "route": "default.other.popups|Alert"
      },
      {
        "label": "Confirm",
        "route": "default.other.popups|Confirm"
      },
      {
        "label": "Prompt",
        "route": "default.other.popups|Prompt"
      },
      {
        "label": "Message",
        "route": "default.other.popups|Message"
      },
      {
        "label": "Toast",
        "route": "default.other.popups|Toast"
      }
    ]
  }
 ]

 */
