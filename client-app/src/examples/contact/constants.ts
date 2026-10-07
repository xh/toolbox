/**
 * Shared constants for the Contact example app.
 *
 * `PERSIST_APP` lives here rather than on `AppModel` so that `ContactService` and
 * `DirectoryPanelModel` can read it without importing `AppModel` - which imports
 * `ContactService` in turn, forming a runtime import cycle.
 */
export const PERSIST_APP = {prefKey: 'contactAppState'};
