/**
 * Toolbox setup for every spec file, run after hoist-react's own test setup (see vitest.config.mts).
 * Seeds the fake hoist-core with Toolbox's server state before any spec boots.
 */
import {hoistCore} from '@xh/hoist/test-support';
import {installToolboxFake} from './toolboxFake';

// Onsen UI, loaded by any mobile component, throws "Invalid state" at import unless the root
// element's computed style lists a transition property. jsdom lists only the properties set on it.
document.documentElement.style.transitionDuration = '0s';

installToolboxFake(hoistCore);
