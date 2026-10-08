import {XH} from '@xh/hoist/core';
import {hoistCore, initTestAppAsync} from '@xh/hoist/test-support';
import {beforeAll, expect, it} from 'vitest';
import {AuthModel} from './AuthModel';

// The Toolbox server with OAuth turned off, for a user with no session.
beforeAll(async () => {
    hoistCore.route('GET', 'xh/authConfig', () => ({useOAuth: false}));
    hoistCore.authenticated = false;
    await expect(initTestAppAsync({authModelClass: AuthModel})).rejects.toThrow(
        "state is 'LOGIN_REQUIRED'"
    );
});

it('turns on the forms login and stops at LOGIN_REQUIRED', () => {
    expect(XH.appSpec.enableLoginForm).toBe(true);
    expect(XH.appState).toBe('LOGIN_REQUIRED');
});

it('builds no OAuth client', () => {
    expect((XH.authModel as AuthModel).client).toBeUndefined();
});
