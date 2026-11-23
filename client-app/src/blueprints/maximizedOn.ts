/**
 * True if the editor's maximize setting takes effect on a route: only while a blueprint of the
 * type is open, where the editor's controls can restore it, so any other page keeps the app's nav.
 */
export function maximizedOn(
    maximize: 'off' | 'expand' | 'fill',
    routeName: string,
    libraryRoute: string
): boolean {
    if (maximize === 'off' || !routeName || !libraryRoute) return false;
    return routeName.startsWith(`${libraryRoute}.`);
}
