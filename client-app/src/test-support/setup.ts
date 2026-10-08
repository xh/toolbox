/**
 * Toolbox setup for every spec file, run after hoist-react's own test setup (see vitest.config.mts).
 * Seeds the fake hoist-core with Toolbox's server state before any spec boots.
 */
import {hoistCore} from '@xh/hoist/test-support';
import {installToolboxFake} from './toolboxFake';

installToolboxFake(hoistCore);
