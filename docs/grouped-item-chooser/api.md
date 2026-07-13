# GroupedItemChooser — API Contract (model + component)

> **Scope of this document.** This defines the **product API surface** — the typed data shapes, the
> config options and their semantics, the observable `value`, the callbacks, and the color allocator.
> It is intentionally **framework-mechanics-free**: it does *not* prescribe MobX usage, decorators,
> `hoistCmp`/`uses`/local-model wiring, file layout, or styling mechanics. Author all of that to the
> repo's conventions, using the Hoist reference and the **`GroupingChooser`** precedent
> (`cmp/grouping/GroupingChooserModel.ts`, `cmp/grouping/impl/GroupingChooserLocalModel.ts`,
> `desktop/cmp/grouping/GroupingChooser.ts`). See [`README.md`](README.md).
>
> The TypeScript below is a **contract sketch** — names and shapes to honor, not a prescription of how
> the model stores or derives them. Adjust surface naming to match Hoist conventions where they differ
> (confirm via the `hoist-*` MCP tools and existing `*ChooserConfig` interfaces).

Behavioral meaning of every field is in [`spec.md`](spec.md); this doc is the type layer over it.

---

## 1. The pieces, named

Following Hoist's `GroupingChooser` precedent, expect a set of exports:

- **`GroupedItemChooser`** — the component (desktop; a mobile variant later if needed, as
  `GroupingChooser` does).
- **`GroupedItemChooserModel`** — the backing `HoistModel`: holds the observable comparison state,
  exposes the observable **`value`**, and owns the mutation actions + color allocator.
- **`GroupedItemChooserConfig`** — the constructor config interface.
- **`GroupedItemChooserLocalModel`** *(impl)* — per-component-instance transient view state (open
  menus, pending query, drag state, popover open) — exactly the role
  `GroupingChooserLocalModel` plays. Internal (`xhImpl`).

---

## 2. Core data types

```ts
/** A leaf item is opaque to the component. The app supplies items via a kind's typeahead source,
 *  and the component tracks each by a stable `id` + its `kind`. `data` is the app's own payload,
 *  round-tripped untouched into `value` and into icon/color callbacks. */
interface ItemRef {
  id: string;          // stable identity — the allocator + reorder + uniqueness all key on this
  kind: string;        // ItemKind.key
  label: string;       // display label (from the typeahead source)
  data?: unknown;      // opaque app payload (e.g. the domain record)
}

/** A leaf *kind* — injected. Carries presentation base + its typeahead source. NO behavioral flags
 *  (grouping/transforms are component-wide, not per-kind). */
interface ItemKind {
  key: string;                 // e.g. 'company' | 'benchmark' (demo)
  label: string;               // section header in the add-menu ("Companies")
  icon: /* Hoist Icon */ any;  // type-level base icon: add-menu + node fallback (see §6)
  /** Typeahead source for this kind. Return options for the query (sync or async). */
  querySource: (query: string) => ItemOption[] | Promise<ItemOption[]>;
}

interface ItemOption { id: string; label: string; data?: unknown; }

/** Developer-supplied transform. The component records the selected key only — it performs NO
 *  computation. An empty/absent `transforms` library disables the transform feature entirely. */
interface Transform {
  key: string;          // recorded in `value`
  label: string;        // menu label
  shortLabel?: string;  // compact tag on a group's meta line (e.g. "AVG")
  isAggregate?: boolean;// hint consumed ONLY by the default getColor (mute members); no computation
}
```

`null` transform key = **"Individual" / show members** — represent "Individual" as `transformKey: null`,
not as a real transform in the library.

---

## 3. Config

```ts
interface GroupedItemChooserConfig {
  //--- Content ---
  /** Injected leaf kinds (presentation + typeahead source). Order drives add-menu section order. */
  kinds: ItemKind[];

  /** Host-supplied groups, offered in the add-menu and rendered LOCKED when added (see spec §4). */
  providedGroups?: ProvidedGroupDef[];

  /** Initial comparison contents (value-or-fn, per GroupingChooser's initialValue pattern). */
  initialValue?: EntryInput[] | (() => EntryInput[]);

  /** Optional single pinned anchor item (spec §2.3). */
  anchorItem?: ItemRef;

  //--- Features (component-wide, not per-kind) ---
  /** Enable grouping: checkboxes, action bar, nesting. Default true. */
  enableGrouping?: boolean;

  /** Enable drag-reorder (grips) at both levels. Default true. */
  enableReordering?: boolean;

  /** Transform library. Empty/absent ⇒ transform feature OFF. */
  transforms?: Transform[];

  /** Transform key adopted by a NEWLY user-defined group. null = Individual. Default null. */
  defaultTransform?: string | null;

  //--- Icons & color (spec §6) ---
  /** Per-node icon override. Return null/undefined ⇒ omit icon element. Falls back to kind.icon
   *  for items; groups have NO base (callback-only). */
  getIcon?: (node: ChooserNode) => /* Hoist Icon */ any | null;

  /** Per-node series color. Falls back to the pooled allocator over `palette`. */
  getColor?: (node: ChooserNode) => string | null;

  /** Palette the model-bound allocator draws from (pooled; released on removal). */
  palette?: string[];

  //--- Placement ---
  displayMode?: 'inline' | 'popover';   // default 'inline'

  //--- Emit-only callbacks (the component NEVER writes to a store itself; app owns persistence) ---
  onChange?: (value: GroupedItemChooserValue) => void;      // or observe model.value directly
  onSaveGroup?: (group: GroupEntry) => void;                // persist a user group as provided
  // (further host hooks — e.g. update/delete a saved definition — are the app's concern, not the
  //  component's; add only if a concrete need appears. Keep the component decoupled.)
}

/** A provided group definition supplied by the host. `id` stable; members by item id+kind. */
interface ProvidedGroupDef {
  id: string;
  label: string;
  members: Array<{ id: string; kind: string; label: string; data?: unknown }>;
  transformKey?: string | null;   // initial transform for the provided group
}

/** Compact form accepted by initialValue — either a leaf item or a group. */
type EntryInput =
  | { type: 'item'; item: ItemRef }
  | { type: 'group'; label: string; source?: 'provided' | 'user';
      transformKey?: string | null; members: ItemRef[] };
```

---

## 4. Observable value (the deliverable output)

The whole point of the component. A **maximum one-level-deep hierarchy of sorted items, optionally
organized into groups** — an ordered top level mixing leaf entries and group entries; each group an
ordered member list plus its selected transform key. **Ordering at both levels is significant.** Every
series carries its resolved **color**. No dedupe, no computation.

```ts
type GroupedItemChooserValue = Entry[];   // ordered top level (anchor first if present)

type Entry = LeafEntry | GroupEntry;

interface LeafEntry {
  type: 'item';
  id: string;            // ItemRef.id
  kind: string;
  item: ItemRef;
  color: string;         // resolved series color (emitted so consumer viz matches)
  isAnchor?: boolean;
}

interface GroupEntry {
  type: 'group';
  id: string;
  label: string;
  source: 'provided' | 'user';
  transformKey: string | null;   // null = Individual / show members
  members: Array<{ id: string; kind: string; item: ItemRef; color: string }>; // ordered
  color: string;                  // the group's own series color (used when a transform is active)
}
```

**Consuming apps** flatten/plot this and own any dedupe of items that recur across multiple
no-transform groups (spec §5). The demo's chart/legend is exactly such a consumer and is **not** part
of the component.

---

## 5. Model behavior (actions, not mechanics)

The model owns the mutations that back the interactions in [`spec.md`](spec.md) §3. Expect actions in
this spirit (name to Hoist conventions):

- add leaf at top level · add provided group (as a locked copy) · remove entry
- create user group from a set of item refs · ungroup · duplicate provided group → editable copy
- add member to group · remove member · move member (to another group / to top level) · reorder
  (top-level entries; members within a group)
- set group transform · rename user group · toggle expand
- selection: toggle / clear / act-on-selection (group, move-out, remove)

**Invariants the model must hold** (all in spec §5): per-container uniqueness (never global);
same item allowed in multiple containers; empty group auto-removed; one-member group preserved;
anchor pinned/immutable; locked groups reject membership mutation but allow transform changes.

Transient UI state (open menu/popup, pending query text, drag source, popover open) belongs in the
**LocalModel**, not the shared model — mirror `GroupingChooserLocalModel`.

---

## 6. Icons &amp; color — the callback contract

Single resolution path (spec §6). Both callbacks receive one **node context** union:

```ts
type ChooserNode = ItemNode | GroupNode;

interface ItemNode {
  nodeType: 'item';
  kind: string;
  level: 'top' | 'member';
  item: ItemRef;
  group?: { id: string; label: string; source: 'provided' | 'user' }; // present iff level === 'member'
  transform?: Transform;   // the parent group's active transform, iff a member of a transformed group
}

interface GroupNode {
  nodeType: 'group';
  group: { id: string; label: string; source: 'provided' | 'user' };
  transform?: Transform;   // the group's active transform, if any
  members: ItemRef[];
  kinds: string[];         // distinct member kinds — lets the app pick homogeneous vs mixed glyphs
}
```

**`getIcon(node)`** → an `Icon` or `null`.
- Precedence: **callback → else type-level base**. Items fall back to `kind.icon`; **groups are
  callback-only** (no base). `null`/`undefined` ⇒ **omit the icon element** for any node.
- The **add-menu** shows `kind.icon` verbatim — callbacks do **not** fire there, and **no color** is
  applied there.

**`getColor(node)`** → a color string or `null`. Falls back to the **pooled allocator**. Colors are
resolved for nodes only (never the menu) and are written into `value`.

**Color allocator (model-bound; the one shared utility apps shouldn't rebuild):**

```ts
interface ColorAllocator {
  palette: string[];
  allocate(key: string): string;  // stable per identity key; returns the same color for the same key
  release(key: string): void;     // returns the color to the pool when a series is removed
}
```

- Keyed to **stable series identity** (the entry/member id), so reorder never recolors.
- **Pool/stack semantics**: released colors return to the pool and are reused, so long-lived
  comparisons don't drift off the end of the palette.
- Exposed to callbacks (e.g. via the node's model reference or a passed helper) *and* used by the
  default `getColor`. The default `getColor` mutes member colors when the parent group's
  `transform.isAggregate` is true.

---

## 7. Anchor

`anchorItem` renders a single pinned entry at the top: pinned, faint accent-tinted row, **not**
selectable/removable/draggable/groupable, and force-sorted to the top. Optional; omit for apps with no
focal item. It appears in `value` as a `LeafEntry` with `isAnchor: true`.

---

## 8. Toolbox example consumer (out of the component)

For the Toolbox demo tab that exercises this, the finance sample data maps on as:

- **kinds:** `company` (icon `fa-building`, typeahead over a ticker list) and `benchmark`
  (icon `fa-chart-line`, typeahead over an index list) — `benchmark` is just a second kind to
  demonstrate **mixed-type leaf items**; nothing benchmark-specific belongs in the API.
- **providedGroups:** a couple of peer sets (the demo's "Analyst Peer Set", "Company Proxy Peers").
- **transforms:** `[{key:'avg',label:'Avg',shortLabel:'AVG',isAggregate:true}, {key:'median',…,
  isAggregate:true}, {key:'sum',…,isAggregate:true}]`; `defaultTransform: 'avg'`.
- **anchorItem:** the subject company.
- The **chart + legend** in that tab is the *example consumer* of `value` — build it with Hoist's
  chart component, keep it **outside** `GroupedItemChooser`. Look to existing Toolbox example tabs for
  how a tab hosts a model + a control + a chart together.
