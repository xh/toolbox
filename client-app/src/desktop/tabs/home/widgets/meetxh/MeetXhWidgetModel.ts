import {HoistModel, LoadSpec, XH} from '@xh/hoist/core';
import {action, makeObservable, observable, runInAction} from '@xh/hoist/mobx';
import {Timer} from '@xh/hoist/utils/async';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {sample} from 'lodash';

export interface XhContact {
    id: string;
    name: string;
    location: string;
    email: string;
    bio: string;
    profilePicture: string;
    tags: string[];
}

export class MeetXhWidgetModel extends HoistModel {
    @observable.ref contacts: XhContact[] = [];
    @observable spotlightId: string = null;

    /** Timestamp of the last user-driven spotlight pick - rotation holds off while recent. */
    private lastUserPick = 0;

    get spotlightContact(): XhContact {
        return this.contacts.find(it => it.id === this.spotlightId);
    }

    constructor() {
        super();
        makeObservable(this);
    }

    override onLinked() {
        this.markManaged(
            Timer.create({
                runFn: () => {
                    // Don't auto-rotate away from a member the user just chose to view.
                    if (Date.now() - this.lastUserPick > 20 * SECONDS) this.shuffle();
                },
                interval: 25 * SECONDS,
                delay: true
            })
        );
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        try {
            const contacts = await XH.fetchJson({url: 'contacts', loadSpec});
            runInAction(() => {
                this.contacts = contacts;
                this.spotlightId = sample(contacts)?.id;
            });
        } catch (e) {
            // Degrade gracefully - widget falls back to static contact CTAs.
            this.logError('Failed to load XH contacts', e);
        }
    }

    @action
    shuffle() {
        const {contacts, spotlightId} = this;
        if (contacts.length < 2) return;
        this.spotlightId = sample(contacts.filter(it => it.id !== spotlightId)).id;
    }

    @action
    spotlight(id: string) {
        this.spotlightId = id;
        this.lastUserPick = Date.now();
    }

    profilePicUrl(contact: XhContact): string {
        return `/public/contact-images/${contact.profilePicture ?? 'no-profile.png'}`;
    }
}
