# AWS Access for Operational Tasks

Runbook for accessing the deployed Toolbox environment on XH's AWS for troubleshooting, log
inspection, and database queries. Designed for both human developers and AI coding agents (e.g.
Claude Code) — the access patterns are identical.

> **This repository is public.** This doc deliberately does **not** check in the AWS account ID,
> Identity Center portal URL, Identity Center instance ARN, RDS instance IDs / endpoints, internal
> DNS, or database credentials. Those per-environment specifics live in the **`Toolbox AWS Ops`**
> item in the **`XH Team`** 1Password vault (and, for some, your local `~/.aws/config` after
> first-time setup). See [Values you'll need](#values-youll-need) for the list and where to find
> each. Stable, low-sensitivity identifiers that *are* safe to check in (ECS cluster/service names,
> permission-set names, IAM role names, log-group names) appear throughout.

---

## Who this is for

Any XH developer or support engineer who needs to inspect or operate the **deployed** Toolbox
environment — separate from local-dev work, which needs none of this (see the root `README.md` and
`CLAUDE.md` for local setup).

If you're joining and need access, start at [First-time setup](#first-time-setup). If you're the AWS
admin onboarding someone, see [Admin tasks](#admin-tasks).

## Values you'll need

Get these from the **`Toolbox AWS Ops`** item in the **`XH Team`** 1Password vault. Don't paste them
into checked-in files.

| Value | 1Password field | Where it lives after setup |
|---|---|---|
| AWS account ID | `account_id` | `~/.aws/config` under `sso_account_id` |
| Identity Center "AWS access portal URL" | `sso_start_url` | `~/.aws/config` under `sso_start_url` |
| Identity Center region | `sso_region` (almost always `us-east-1`) | `~/.aws/config` under `sso_region` |
| RDS DNS alias (used for tunnels; resolves task-side) | `db_dns` | — |
| RDS endpoint (single instance, serves dev + prod) | `rds_dev_endpoint` | — (or re-derive via `aws rds describe-db-instances`) |
| RDS instance ID (single instance, serves dev + prod) | `rds_dev_instance_id` | — |
| Toolbox DB schema (dev / prod) | `db_schema_dev` / `db_schema_prod` | — |
| Toolbox DB user / password (shared dev+prod for now) | `db_user` / `db_password` | — |
| Identity Center instance ARN (admin only) | `identity_center_instance_arn` | — |

### Fetching values with the 1Password CLI (optional flair)

If you have the [1Password CLI](https://developer.1password.com/docs/cli/) (`op`) installed and
signed in (`op signin`), you can read any field directly instead of copy-pasting from the app — and
an AI agent assisting you can do the same:

```bash
op read "op://XH Team/Toolbox AWS Ops/account_id"
op read "op://XH Team/Toolbox AWS Ops/rds_dev_endpoint"
```

Throughout this doc, `$(op read "op://XH Team/Toolbox AWS Ops/<field>")` can be substituted inline
wherever a `<placeholder>` appears. If `op` isn't available, just open the `Toolbox AWS Ops` item in
the `XH Team` vault and copy the value.

---

## Access model

Both permission sets below are granted to the `aws-power-users` Identity Center group, so any member
of that group gets both. Two named SSO profiles per developer machine, both reusing one SSO session
named `xh`:

### `xh-toolbox-ro` (default — read-only)

Backed by the **`ToolboxReadOnly`** permission set:
- AWS managed policy: `ReadOnlyAccess`
- Inline policy: `ssm:StartSession` on Toolbox ECS tasks + the two port-forwarding documents;
  `ecs:ExecuteCommand` on the Toolbox cluster/tasks; `ssm:TerminateSession` / `ssm:ResumeSession`
  on your own sessions.

Use this for all describe / get / list / log-tail / DB-query work.

### `xh-toolbox-rw` (write ops — explicit confirmation)

Backed by the **`ToolboxReadWrite`** permission set: everything `ToolboxReadOnly` grants, plus
`ecs:UpdateService` scoped to the `toolbox` cluster (for `--force-new-deployment` and
`--desired-count` scaling).

Use only for state-changing operations, and only with **explicit per-command confirmation**. AI
agents must propose each write command and wait for the user to say "go" / "yes" / "run it" before
invoking.

> Account-wide `AdministratorAccess` / `PowerUserAccess` permission sets also exist for full admin
> work (IAM, new infrastructure). Prefer the scoped `ToolboxReadWrite` for routine deploy/scale ops —
> it's least-privilege and clearly named for support staff.

### Safety protocol for AI coding agents

| Action type | Profile | Confirmation |
|---|---|---|
| Reads against dev (describe / list / log filter / DB SELECT) | `xh-toolbox-ro` | None — proceed |
| Writes against dev (update-service / scale / DB write) | `xh-toolbox-rw` | Explicit per-command |
| Reads against prod | `xh-toolbox-ro` | Explicit per-command (different blast radius) |
| Writes against prod | `xh-toolbox-rw` | User runs the command; AI proposes |

For writes, propose the exact command in chat and wait for the user's go-ahead before running.
"Can you run it?" / "go" / "yes" all count as explicit confirmation for that single command.
Confirmation does not extend to subsequent commands.

---

## First-time setup

Prerequisite: your Identity Center user is a member of the `aws-power-users` group, which is granted
both the `ToolboxReadOnly` and `ToolboxReadWrite` permission sets on the XH AWS account. If you're
unsure, ask — or run the steps below and see whether the role-selection step lists those names.

### 1. Install the AWS tooling

```bash
brew install awscli
brew install --cask session-manager-plugin   # for SSM port-forwarding
```

Verify:
```bash
aws --version                        # expect 2.x
session-manager-plugin --version
```

### 2. Configure SSO profiles

Run the interactive wizard — it opens a browser for SSO login:

```bash
aws configure sso
```

Answer the prompts:

| Prompt | Answer |
|---|---|
| `SSO session name` | `xh` |
| `SSO start URL` | your `sso_start_url` (from 1Password — see [Values you'll need](#values-youll-need)) |
| `SSO region` | `us-east-1` |
| `SSO registration scopes` | press Enter (default: `sso:account:access`) |

A browser tab opens to the AWS access portal, which redirects to XH's **Google** sign-in (use your
`@xh.io` account). Approve, click **Allow access**. Back in the terminal:

| Prompt | Answer |
|---|---|
| Account list | pick the XH account |
| Permission set list | **`ToolboxReadOnly`** |
| `Default client Region` | `us-east-1` |
| `Default output format` | `json` |
| `Profile name` | `xh-toolbox-ro` |

If you have `ToolboxReadWrite`, create the write profile too — re-run
`aws configure sso --profile xh-toolbox-rw` and pick `ToolboxReadWrite` at the permission-set step,
or append this block to `~/.aws/config` (the `[sso-session xh]` block already exists from above; do
not duplicate it):

```ini
[profile xh-toolbox-rw]
sso_session = xh
sso_account_id = <account_id>
sso_role_name = ToolboxReadWrite
region = us-east-1
output = json
```

### 3. Verify your profile(s)

```bash
aws sts get-caller-identity --profile xh-toolbox-ro
```

Should return your assumed-role ARN mentioning `AWSReservedSSO_ToolboxReadOnly_…`. If you get
`Error loading SSO Token`, run `aws sso login --sso-session xh` and try again. Tokens last 12 hours
by default.

### 4. Install the MySQL client (for DB access)

Install the dedicated 8.4 client formula (it matches the RDS server, which runs MySQL 8.4):

```bash
brew install mysql-client@8.4
```

The 8.4 client is keg-only — invoke by full path:
`/opt/homebrew/opt/mysql-client@8.4/bin/mysql`. Add it to `PATH` in your shell rc if you'd rather not
type the path each time.

> **Auth note:** the `toolbox` DB user uses `caching_sha2_password` (MySQL 8.4 disables
> `mysql_native_password` by default). Over a plain-TCP SSM tunnel that handshake needs TLS or the
> server's RSA public key — pass `--get-server-public-key` to the `mysql` client (used in the
> examples below). GUI clients (Querious, etc.): use a Standard/TCP connection to `127.0.0.1:3307`
> and enable SSL/TLS.

### 5. Test end-to-end with a no-op describe

```bash
aws ecs list-services --cluster toolbox --profile xh-toolbox-ro
```

Returns the toolbox service ARNs (ending in `toolbox-dev` and `toolbox-prod`). If you got here
without errors, you're set up.

---

## Daily operational use

### SSM port-forward to RDS

We do NOT use a long-running EC2 bastion. Instead, use a running Toolbox ECS task as the SSM target —
the task already has VPC network access to RDS, and access lifecycle is tied to the deployed service.

Prerequisites (one-time, already in place):
- ECS service has `enableExecuteCommand: true`.
- Task IAM role (`aws-ecs-task-role`) grants the `ssmmessages:*` channel permissions.

Open the tunnel:

```bash
# Pick a running tomcat container
TASK=$(aws ecs list-tasks --cluster toolbox --service-name toolbox-dev \
  --profile xh-toolbox-ro --query 'taskArns[0]' --output text | awk -F/ '{print $NF}')
RUNTIME=$(aws ecs describe-tasks --cluster toolbox --tasks "$TASK" \
  --profile xh-toolbox-ro \
  --query 'tasks[0].containers[?name==`tomcat`].runtimeId' --output text)

# RDS host = the db_dns alias from 1Password. It resolves task-side via the private Route53 zone,
# follows any future instance swap, and is the same host for both dev and prod (one shared instance).
# Start the port forward (blocks; Ctrl-C to close):
RDS_HOST=$(op read "op://XH Team/Toolbox AWS Ops/db_dns")
aws ssm start-session \
  --target "ecs:toolbox_${TASK}_${RUNTIME}" \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters "host=${RDS_HOST},portNumber=3306,localPortNumber=3307" \
  --profile xh-toolbox-ro
```

Localhost port `3307` now forwards to RDS:3306. Leave the session running in one terminal; connect
with `mysql` from another:

```bash
/opt/homebrew/opt/mysql-client@8.4/bin/mysql \
  -h 127.0.0.1 -P 3307 --get-server-public-key \
  -u "$(op read 'op://XH Team/Toolbox AWS Ops/db_user')" \
  -p"$(op read 'op://XH Team/Toolbox AWS Ops/db_password')" \
  "$(op read 'op://XH Team/Toolbox AWS Ops/db_schema_dev')"
```

Dev and prod share the **same RDS instance** in separate schemas (`db_schema_dev` /
`db_schema_prod`), with a **shared** DB user/password (`db_user` / `db_password`). One tunnel reaches
both schemas; for prod work, relay through a `toolbox-prod` task and select `db_schema_prod`. If the
user/password split per-env later, add per-env fields to the 1Password item and update this doc.

> **Credentials note:** The deployed Toolbox tasks source their instance config from
> `APP_TOOLBOX_*` **environment variables** on the ECS task definition, with the secret values
> (`dbUser`, `dbPassword`, `smtpUser`, `smtpPassword`) injected from **AWS Secrets Manager**
> (`toolbox/dev/app`, `toolbox/prod/app`). For operational DB access, the same `toolbox`
> user/password is mirrored in the `db_user` /
> `db_password` / `db_schema_dev` / `db_schema_prod` values of the `Toolbox AWS Ops` 1Password item
> (the read-only SSO profile cannot read the Secrets Manager value directly).

### ECS Exec (interactive shell into a task)

```bash
aws ecs execute-command \
  --cluster toolbox \
  --task <task-id> \
  --container tomcat \
  --interactive \
  --command /bin/sh \
  --profile xh-toolbox-ro
```

Same prerequisites as the SSM port-forward.

### CloudWatch Logs

| Service | Log group |
|---|---|
| `toolbox-dev` (tomcat + nginx) | `/ecs/toolbox-dev` |
| `toolbox-prod` (tomcat + nginx) | `/ecs/toolbox-prod` |

Stream naming: `ecs/<container>/<task-id>` (e.g. `ecs/tomcat/6c5f16b2bda2487...`).

Common query patterns:

```bash
# Tail recent errors across all tasks
aws logs filter-log-events \
  --log-group-name /ecs/toolbox-dev \
  --start-time $(($(date +%s)*1000 - 3600000)) \
  --filter-pattern 'ERROR' \
  --profile xh-toolbox-ro \
  --query 'events[].[timestamp,logStreamName,message]' --output text

# List recent log streams (most recent first)
aws logs describe-log-streams \
  --log-group-name /ecs/toolbox-dev \
  --order-by LastEventTime --descending --limit 6 \
  --profile xh-toolbox-ro
```

CloudWatch filter patterns do not accept `@` — escape or omit when grepping for usernames.
Multi-token filters use `?term1 ?term2` syntax (OR), not Boolean AND.

### ECS service operations (read)

```bash
# Describe service state
aws ecs describe-services --cluster toolbox --services toolbox-dev \
  --profile xh-toolbox-ro --output table

# List running tasks
aws ecs list-tasks --cluster toolbox --service-name toolbox-dev \
  --profile xh-toolbox-ro --query 'taskArns[]' --output text | tr '\t' '\n'

# Per-task detail (running status, ExecuteCommand flag, container runtime IDs)
aws ecs describe-tasks --cluster toolbox --tasks <task-arn1> <task-arn2> ... \
  --profile xh-toolbox-ro
```

### Write operations (require `xh-toolbox-rw` + confirmation)

```bash
# Force a new rolling deployment (dev)
aws ecs update-service --cluster toolbox --service toolbox-dev \
  --force-new-deployment --profile xh-toolbox-rw

# Scale down then back up
aws ecs update-service --cluster toolbox --service toolbox-dev \
  --desired-count 0 --profile xh-toolbox-rw
aws ecs update-service --cluster toolbox --service toolbox-dev \
  --desired-count 2 --profile xh-toolbox-rw
```

> Routine deploys normally happen via GitHub Actions (see [Build and Deploy](build-and-deploy.md)) —
> the `Deploy Snapshot` / `Deploy Release` workflows run the same `update-service` call. Use the
> manual commands above for ad-hoc redeploys or recovery.

---

## Resource inventory (discoverable, low sensitivity)

| Resource | Identifier |
|---|---|
| ECS cluster | `toolbox` |
| Toolbox services | `toolbox-dev`, `toolbox-prod` |
| Containers per task | `tomcat`, `nginx`, `aws-otel-collector` |
| Task IAM role | `aws-ecs-task-role` |
| Execution IAM role | `ecsTaskExecutionRole` |
| Read-only permission set | `ToolboxReadOnly` |
| Read-write permission set | `ToolboxReadWrite` |
| Log groups | `/ecs/toolbox-dev`, `/ecs/toolbox-prod` |

The AWS account ID, Identity Center ARN/URL, RDS instance IDs/endpoints, internal DNS, and DB
credentials are deliberately not listed here — get them from the `Toolbox AWS Ops` 1Password item.

---

## Admin tasks

### Onboarding a new operator

Authentication is **federated through XH's Google identity provider** — IAM Identity Center does not
manage AWS passwords or MFA, so there's no activation email and nothing for the operator to set up;
they sign in with their existing `@xh.io` Google account. We do **not** have SCIM auto-provisioning
enabled (it carries extra cost on the Google side), so the admin still creates the Identity Center
user record manually. The current AWS admin does the following (the operator's local
[First-time setup](#first-time-setup) only works after these steps):

1. **Create the user in IAM Identity Center** — AWS Console → IAM Identity Center → Users → Add user.
   Use the operator's `@xh.io` email as the username so it maps to their Google identity. No password
   or MFA is configured here — Google handles authentication.
2. **Add the user to the `aws-power-users` group** — IAM Identity Center → Groups → `aws-power-users`
   → Add members. That group is already granted both the `ToolboxReadOnly` and `ToolboxReadWrite`
   permission sets on the XH account, so no per-user permission-set assignment is needed. (To grant
   only read access to someone outside that group, assign `ToolboxReadOnly` to their user directly.)
3. **Hand off the per-environment values** — point them at the `Toolbox AWS Ops` item in the
   `XH Team` 1Password vault (account ID, portal URL). Don't share via a checked-in file.

For departing operators: remove them from the `aws-power-users` group (and, on full offboarding,
disable their `@xh.io` Google account, which cuts federated sign-in). SSO tokens expire within 12
hours; revocation is effectively immediate.

### Instance configuration & secrets

The deployed services read their Hoist instance config from the **ECS task definition**, not a file:

- **Non-secret settings** are plain `environment` entries (`APP_TOOLBOX_ENVIRONMENT`,
  `APP_TOOLBOX_DB_HOST`, `APP_TOOLBOX_DB_SCHEMA`, `APP_TOOLBOX_SMTP_HOST`). To change one, register a
  new task-definition revision with the updated value and redeploy.
- **Secret settings** come from the AWS Secrets Manager secrets **`toolbox/dev/app`** and
  **`toolbox/prod/app`** (JSON keys `dbUser`, `dbPassword`, `smtpUser`, `smtpPassword`), wired into
  the task definition's `secrets:` array. To rotate one, update the secret value and force a new
  deployment so tasks pick it up. `ecsTaskExecutionRole` is granted `secretsmanager:GetSecretValue`
  on `toolbox/dev/app-*` and `toolbox/prod/app-*` (inline policies `xhToolboxDevSecretsAccess` /
  `xhToolboxProdSecretsAccess`) — adding a key to an existing secret needs no policy change, but a new
  secret *name* does.

Registering a task definition or pointing a service at a new revision needs `iam:PassRole` on the
task/execution roles, which `ToolboxReadWrite` does **not** grant — use an admin profile for those.
(Plain `--force-new-deployment` and `--desired-count` scaling work with `ToolboxReadWrite`.)

### Permission-set definitions

`ToolboxReadOnly` and `ToolboxReadWrite` both attach the `ReadOnlyAccess` managed policy plus an
inline policy. The read-only inline policy (replace `<account-id>`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "StartSsmPortForwardSession",
      "Effect": "Allow",
      "Action": "ssm:StartSession",
      "Resource": [
        "arn:aws:ecs:us-east-1:<account-id>:task/toolbox/*",
        "arn:aws:ssm:*::document/AWS-StartPortForwardingSessionToRemoteHost",
        "arn:aws:ssm:*::document/AWS-StartPortForwardingSession"
      ]
    },
    {
      "Sid": "ExecuteCommandOnToolboxTasks",
      "Effect": "Allow",
      "Action": "ecs:ExecuteCommand",
      "Resource": [
        "arn:aws:ecs:us-east-1:<account-id>:cluster/toolbox",
        "arn:aws:ecs:us-east-1:<account-id>:task/toolbox/*"
      ]
    },
    {
      "Sid": "ManageOwnSsmSessions",
      "Effect": "Allow",
      "Action": ["ssm:TerminateSession", "ssm:ResumeSession"],
      "Resource": "arn:aws:ssm:*:*:session/${aws:userid}-*"
    }
  ]
}
```

`ToolboxReadWrite` adds one statement to the above:

```json
{
  "Sid": "UpdateToolboxServices",
  "Effect": "Allow",
  "Action": "ecs:UpdateService",
  "Resource": "arn:aws:ecs:us-east-1:<account-id>:service/toolbox/*"
}
```

---

## When this doc gets stale

The CLI commands are point-in-time recipes. If they stop working, check first whether:

- The Identity Center URL or account ID changed (see the `Toolbox AWS Ops` 1Password item)
- A permission set (`ToolboxReadOnly` / `ToolboxReadWrite`) was renamed or had its inline policy trimmed
- ECS Exec was disabled on the service (`enableExecuteCommand` flag)
- The task IAM role lost the `ssmmessages:*` permissions
- The RDS instance behind the `db_dns` / `rds_*` 1Password values was swapped (update those values)
- A Secrets Manager secret was renamed, or a new one needs the `ecsTaskExecutionRole` `GetSecretValue` grant

Then update this file. The runbook is checked in deliberately so it travels with the codebase, not
anyone's individual notes — but keep the public/private split intact: identifiers stay here, secrets
stay in 1Password.
