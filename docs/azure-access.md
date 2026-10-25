# Azure / Entra Access for Operational Tasks

Runbook for connecting to XH's Microsoft Entra tenant to troubleshoot, monitor, and administer our
identity setup - app registrations, their credentials, directory groups, and audit logs. Designed
for both human developers and AI coding agents (e.g. Claude Code) - the access patterns are
identical.

This is the Azure counterpart to [AWS Access for Operational Tasks](aws-access.md). The two docs
are siblings in intent but cover different ground: AWS is where Toolbox is *deployed*, Azure is
where some of its *identity* lives.

> [!WARNING]
> **This repository is public.** This doc deliberately does **not** check in the tenant ID,
> operator application IDs, or client secrets. Those live in the
> **`Toolbox Azure Ops`** item in the **`XH Team`** 1Password vault - see
> [Values you'll need](#values-youll-need). Stable, low-sensitivity identifiers that *are* safe to
> check in (app registration names, group names, directory role names) appear throughout.

---

## Scope - directory plane only

This runbook covers the Entra **directory plane**: identities, app registrations, groups, and audit
logs. It deliberately does **not** cover the Azure subscription's resource plane.

Toolbox is deployed on AWS ECS; nothing of ours runs on Azure compute. The operator accounts below
hold **zero** Azure RBAC role assignments by design, and the subscription is untouched. If we ever
deploy something to Azure, that belongs in a new section or a new doc - not bolted onto these
credentials.

## Who this is for

Any XH developer or coding agent who needs to inspect or change XH's Entra configuration - checking
why an OAuth flow is failing, auditing which app registrations exist and when their credentials
expire, managing directory groups used for role resolution, or adding a credential to a
registration for testing.

## Two kinds of principal - read this before anything else

The single most common confusion here. Two entirely different things are called "an app" in Entra:

| | **Application identity** | **Operator identity** |
|---|---|---|
| Examples | `Toolbox`, `xh-hoist-directory-reader` | `xh-toolbox-ops-ro`, `xh-toolbox-ops-rw` |
| Authenticates as | the application, calling Graph at runtime | a human or agent, running `az` commands |
| Credential type | whatever the app needs (secret or certificate) | client secret |
| Role here | **the object being administered** | **the actor doing the administering** |

`xh-hoist-directory-reader` is a *shared* registration that backs Hoist's `EntraIdService` for
group-directory reads across multiple apps. It is a thing you inspect and maintain. It is never the
thing you log in as to do maintenance.

Adding a certificate to that registration is a **task performed by** an operator identity. Keep the
two straight and everything below is obvious; conflate them and nothing makes sense.

## Values you'll need

Get these from the **`Toolbox Azure Ops`** item in the **`XH Team`** 1Password vault. Don't paste
them into checked-in files.

| Value | 1Password field |
|---|---|
| Entra tenant ID | `tenant_id` |
| Read-only operator app ID / secret | `ops_ro_app_id` / `ops_ro_secret` |
| Read-write operator app ID / secret | `ops_rw_app_id` / `ops_rw_secret` |
| Credential expiry dates (for rotation) | `ops_ro_secret_expires` / `ops_rw_secret_expires` |

With the [1Password CLI](https://developer.1password.com/docs/cli/) (`op`) installed and signed in,
read any field directly - and an AI agent assisting you can do the same:

```bash
op read "op://XH Team/Toolbox Azure Ops/tenant_id"
```

Throughout this doc, `$(op read "op://XH Team/Toolbox Azure Ops/<field>")` substitutes inline
wherever a `<placeholder>` appears.

> [!NOTE]
> The tenant ID and the Toolbox OAuth client ID are *also* hardcoded in
> `grails-app/services/io/xh/toolbox/security/EntraIdConfig.groovy` in this public repo. Neither is
> secret in any meaningful sense - both appear in the browser network traffic of any user signing
> in. They are routed through 1Password here for consistency with the AWS runbook, not because
> exposure would be harmful. The **client secrets** genuinely are sensitive.

---

## Access model

AWS IAM Identity Center has a single "permission set" object. Entra splits the same ground across
**two** mechanisms, and our tiers use both:

- **Entra directory roles** - `Global Reader`, `Application Administrator`, `Groups Administrator`.
  Assignable to users *and* service principals. No consent step. These cover directory **objects**.
- **Microsoft Graph application permissions** - e.g. `AuditLog.Read.All`. Granted to a service
  principal and then **admin-consented** by a Global Administrator. These cover Graph **APIs** that
  directory roles don't reach.

We use directory roles for everything they cover, and add a Graph permission only where a verified
gap exists.

### `xh-toolbox-ops-ro` (default - read-only)

| Grant | Type |
|---|---|
| `Global Reader` | directory role |
| `AuditLog.Read.All` | Graph application permission (admin-consented) |

Use for all inspection, troubleshooting, and monitoring. **Verified**: this tier can list and show
app registrations, read credential display names and expiry dates, list groups and their members,
and read directory audit logs. **Verified**: it cannot create a group (`Insufficient privileges`).

### `xh-toolbox-ops-rw` (write ops)

Everything `ops-ro` has, plus:

| Grant | Type |
|---|---|
| `Application Administrator` | directory role |
| `Groups Administrator` | directory role |

Use for creating and modifying app registrations, adding or rotating their credentials, and
managing directory groups.

### What neither tier can do - deliberately

Neither operator can **grant admin consent**, **assign directory roles**, or **create service
principals**. Those remain Global Administrator operations performed by a human.

This boundary is intentional and should stay: it means an agent operating with these credentials
cannot widen its own permissions. Everything else here is relaxed for convenience; this one is not.

> [!NOTE]
> **Accepted risk.** `Application Administrator` is a documented privilege-escalation path - it can
> add a credential to *any* app registration, including privileged ones, then authenticate as it.
> This is accepted because the tenant is a low-stakes internal test bed. If that ever changes,
> replace the role with the Graph permission `Application.ReadWrite.OwnedBy` plus explicit
> per-registration ownership, which scopes writes to only the registrations the operator owns.

---

## Session isolation - the big difference from AWS

**The AWS CLI takes `--profile` per command. The Azure CLI has no equivalent** - `az login`
replaces the active session wholesale. Tiers are separated instead by pointing `az` at different
config directories with the `AZURE_CONFIG_DIR` environment variable.

| Config dir | Session |
|---|---|
| `~/.azure` | reserved for a human's own interactive Global Admin login |
| `~/.azure-xh-ops-ro` | the read-only operator |
| `~/.azure-xh-ops-rw` | the read-write operator |

Because forgetting the export silently lands your command in whatever the *default* directory holds
- quite possibly a Global Admin session - **`az account show` is a required first command, not a
nicety.**

```bash
export AZURE_CONFIG_DIR=~/.azure-xh-ops-ro
az account show --query '{user:user.name,type:user.type}' -o json
```

A correct result shows `"type": "servicePrincipal"` and the app ID you expect. If it shows
`"type": "user"`, you are in somebody's admin session - stop and fix the export.

### Safety protocol for AI coding agents

The AWS runbook keys its protocol on dev vs prod. The Entra tenant has no such split, and it is
**shared and unsegmented** - other registrations and identities live alongside Toolbox's, and
nothing scopes a mistake to Toolbox. So the protocol keys on **blast radius** instead.

| Action | Tier | Confirmation |
|---|---|---|
| Any read - registrations, credential expiry, groups, members, audit logs | `ops-ro` | none - proceed |
| Create or modify objects the operator itself created (`toolbox-test-*`) | `ops-rw` | none - proceed |
| Modify a pre-existing shared object (e.g. a credential on `xh-hoist-directory-reader`) | `ops-rw` | explicit per-command |
| Delete anything, or reset a credential others depend on | `ops-rw` | explicit per-command |
| Grant admin consent, assign directory roles, create service principals | human Global Admin | agent cannot - by design |

**Naming convention: prefix anything you create for testing with `toolbox-test-`.** This gives an
agent a self-service sandbox inside a shared tenant and makes cleanup a one-liner:

```bash
az ad group list --query "[?starts_with(displayName,'toolbox-test')].displayName" -o tsv
az ad app list --all --query "[?starts_with(displayName,'toolbox-test')].displayName" -o tsv
```

---

## First-time setup

### 1. Install the tooling

```bash
brew install azure-cli
az version          # verified against 2.89.1
```

### 2. Log in as an operator

```bash
export AZURE_CONFIG_DIR=~/.azure-xh-ops-ro

az login --service-principal \
  -u "$(op read 'op://XH Team/Toolbox Azure Ops/ops_ro_app_id')" \
  -p "$(op read 'op://XH Team/Toolbox Azure Ops/ops_ro_secret')" \
  -t "$(op read 'op://XH Team/Toolbox Azure Ops/tenant_id')" \
  --allow-no-subscriptions
```

> [!IMPORTANT]
> **`--allow-no-subscriptions` is required.** These operator principals hold no Azure RBAC role
> assignments (by design - see [Scope](#scope---directory-plane-only)), so the CLI finds no
> subscriptions for them and, without this flag, fails outright with
> `ERROR: No subscriptions found for <app-id>`. This is verified behaviour, not a precaution.

Swap `ops_ro_*` for `ops_rw_*` and the config dir for `~/.azure-xh-ops-rw` to get the write tier.

### 3. Verify

```bash
az account show --query '{user:user.name,type:user.type,tenant:tenantId}' -o json
az ad app list --all --query 'length(@)' -o tsv
```

The first must report `servicePrincipal`; the second returns a count. If you got here, you're set up.

A human admin logging in interactively uses the default config dir and their own account instead:

```bash
unset AZURE_CONFIG_DIR
az login --tenant "$(op read 'op://XH Team/Toolbox Azure Ops/tenant_id')"
```

(Interactive user login does *not* need `--allow-no-subscriptions` - a human admin can see the
subscription.)

---

## Daily operational use

The commands below are representative, not exhaustive - enough to confirm each tier works and to
establish the vocabulary. They are not a runbook for any specific task.

### Reads (`ops-ro`)

```bash
# All app registrations
az ad app list --all --query '[].{name:displayName,appId:appId}' -o table

# One registration in detail
az ad app show --id <app-id> -o json

# Credential inventory and expiry - the most useful monitoring query in this doc
az ad app show --id <app-id> \
  --query '{secrets:passwordCredentials[].{name:displayName,expires:endDateTime},
            certs:keyCredentials[].{name:displayName,expires:endDateTime}}' -o json

# Groups, and who is in one
az ad group list --query '[].{name:displayName,id:id}' -o table
az ad group member list --group <group-name-or-id> --query '[].userPrincipalName' -o tsv

# Directory audit logs - who changed what, recently
az rest --method GET \
  --url 'https://graph.microsoft.com/v1.0/auditLogs/directoryAudits?$top=20' \
  --query 'value[].{when:activityDateTime,what:activityDisplayName,who:initiatedBy.user.userPrincipalName}' \
  -o table
```

> [!NOTE]
> **Sign-in logs are not available in this tenant.** `auditLogs/signIns` returns
> `Authentication_RequestFromNonPremiumTenantOrB2CTenant` - the endpoint requires an Entra ID P1 or
> P2 licence, which we don't hold. This is a licensing limit, not a permissions problem; granting
> more permissions will not fix it. Use `auditLogs/directoryAudits` (which does work) for change
> history, and the application's own server-side logs for OAuth failures.

### Writes (`ops-rw`)

```bash
export AZURE_CONFIG_DIR=~/.azure-xh-ops-rw   # and re-verify with az account show

# Create a sandbox group
az ad group create --display-name "toolbox-test-<purpose>" \
  --mail-nickname "toolbox-test-<purpose>"

# Create a sandbox app registration
az ad app create --display-name "toolbox-test-<purpose>"

# Add a credential to a registration
az ad app credential reset --id <app-id> --display-name "<name>" --years 1 --append
```

> [!CAUTION]
> **`az ad app credential reset` destroys existing credentials unless you pass `--append`.**
> Microsoft's own reference states it "clears all passwords and keys and generates a new password
> credential" by default. Run it without `--append` against `xh-hoist-directory-reader` and you
> will delete the secret every consuming app authenticates with. **Always pass `--append` when
> touching a registration you did not create.** (Verified: with `--append`, pre-existing
> credentials survive.)

### Operational gotchas - all observed in practice

| Symptom | Cause | What to do |
|---|---|---|
| `Resource '<guid>' does not exist` right after creating an app or group | Graph replication lag | Wait ~25s and retry. The object was created. |
| `Error due to concurrent requests being made to the tenant` | Graph write throttling | Space writes out; retry after ~20s. Don't parallelise directory writes. |
| A newly granted permission still returns `Forbidden` | App-role claims are baked into the cached access token at issue time | `az logout` and log in again to get a fresh token |
| `No subscriptions found for <app-id>` | Missing `--allow-no-subscriptions` on an operator login | Add the flag |
| Commands behave with unexpected privilege | `AZURE_CONFIG_DIR` not exported - you're in the default session | `az account show`, then fix the export |

---

## Resource inventory (discoverable, low sensitivity)

| Resource | Identifier |
|---|---|
| Read-only operator | `xh-toolbox-ops-ro` |
| Read-write operator | `xh-toolbox-ops-rw` |
| Toolbox OAuth client registration | `Toolbox` |
| Shared Hoist directory-reader registration | `xh-hoist-directory-reader` |
| Group used for Toolbox role resolution | `toolbox-admin` |
| Directory roles in use | `Global Reader`, `Application Administrator`, `Groups Administrator` |
| Graph permission granted to operators | `AuditLog.Read.All` (application, admin-consented) |

Tenant ID, operator app IDs, and secrets are deliberately not listed - get them
from the `Toolbox Azure Ops` 1Password item.

---

## Admin tasks

These require a human **Global Administrator** signed in interactively (`unset AZURE_CONFIG_DIR`).

### How the operator principals were created

Recorded so they can be recreated or audited. `az ad sp create-for-rbac` assigns **no** Azure RBAC
role when `--role`/`--scopes` are omitted, which is what keeps the subscription untouched:

```bash
az ad sp create-for-rbac --name xh-toolbox-ops-ro --years 1
az ad sp create-for-rbac --name xh-toolbox-ops-rw --years 1
```

Directory roles are then assigned through Graph - there is no first-class `az ad` command for this.
A role must be *activated* from its template before it can take members (`Groups Administrator` was
already active in this tenant; `Global Reader` and `Application Administrator` were not):

```bash
# Activate a role from its template, if not already active
az rest --method POST --url "https://graph.microsoft.com/v1.0/directoryRoles" \
  --headers "Content-Type=application/json" \
  --body '{"roleTemplateId":"<template-id>"}'

# Add a service principal as a member of an activated role
az rest --method POST \
  --url "https://graph.microsoft.com/v1.0/directoryRoles/<role-id>/members/\$ref" \
  --headers "Content-Type=application/json" \
  --body '{"@odata.id":"https://graph.microsoft.com/v1.0/directoryObjects/<sp-object-id>"}'
```

Resolve template and role IDs from the tenant rather than hardcoding GUIDs:

```bash
az rest --method GET --url "https://graph.microsoft.com/v1.0/directoryRoleTemplates" \
  --query "value[].{name:displayName,template:id}" -o table
az rest --method GET --url "https://graph.microsoft.com/v1.0/directoryRoles" \
  --query "value[].{name:displayName,roleId:id}" -o table
```

The Graph permission was added and consented with:

```bash
az ad app permission add --id <operator-app-id> \
  --api 00000003-0000-0000-c000-000000000000 \
  --api-permissions b0afded3-3588-46d8-8b3d-9842eff778da=Role   # AuditLog.Read.All
az ad app permission admin-consent --id <operator-app-id>
```

Consent can silently fail to take under throttling - always verify afterwards, and re-issue if the
list comes back empty:

```bash
az rest --method GET \
  --url "https://graph.microsoft.com/v1.0/servicePrincipals/<sp-object-id>/appRoleAssignments" \
  --query 'value[].{api:resourceDisplayName,role:appRoleId}' -o table
```

### Rotating an operator secret

Operator secrets are issued for **1 year** (the verified lifetime in this tenant). Before expiry:

```bash
az ad app credential reset --id <operator-app-id> --display-name "rotated-<date>" --years 1 --append
```

Update `ops_*_secret` and `ops_*_secret_expires` in the `Toolbox Azure Ops` 1Password item, confirm
the new credential works, then remove the old one with `az ad app credential delete`.

### Onboarding and offboarding an operator

There are no per-person operator accounts - the two service principals are shared, and access is
governed by access to the 1Password item. To onboard, grant the person access to the `XH Team`
vault and point them at this doc. To offboard, remove their vault access; if they may have copied
the secrets, rotate them as above.

Human admins sign in with their own `@xh.io` Azure account and their own directory roles - they do
not use the operator principals.

---

## When this doc gets stale

The commands here are point-in-time recipes. If they stop working, check first whether:

- An operator secret expired (see `ops_*_secret_expires` in 1Password) - the symptom is a login failure
- A directory role assignment was removed from `xh-toolbox-ops-ro` / `xh-toolbox-ops-rw`
- The `AuditLog.Read.All` grant lost its admin consent
- The tenant gained an Entra ID P1/P2 licence - if so, sign-in logs become available and the note
  above should be revised
- An app registration referenced here was renamed or deleted
- Azure CLI changed the behaviour of `az ad app credential reset` or the `create-for-rbac` default

Then update this file. The runbook is checked in deliberately so it travels with the codebase, not
anyone's individual notes - but keep the public/private split intact: identifiers stay here,
secrets stay in 1Password.

------------------------------------------

info@xh.io | <https://xh.io/>
