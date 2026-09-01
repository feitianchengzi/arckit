# feedback-console-web deploy scripts

This directory contains build and OSS deploy scripts for `feedback-console-web`.

## Files

- `build-vite.sh`: build helper
- `deploy-feedback-console.sh`: deploy entry (bash)
- `deploy-feedback-console.py`: deploy worker (python)
- `publish-root-index.sh`: upload root `index.html` SPA fallback
- `publish-root-index.py`: root SPA fallback worker

## Safety defaults

- Deploy target is controlled by `OSS_PREFIX`.
- If `OSS_PREFIX` is missing, default prefix is `console`.
- Root deploy is blocked by default.
- To allow root deploy, set `ALLOW_ROOT_DEPLOY=1` in `.env` explicitly.
- Root `index.html` sync is opt-in and only overwrites the single root object.
- To sync root entry after deploy, set `SYNC_ROOT_INDEX=1` and `ROOT_INDEX_TARGET=/console`.

## Required `.env`

```env
OSS_ACCESS_KEY_ID=xxx
OSS_ACCESS_KEY_SECRET=xxx
OSS_ENDPOINT=https://oss-cn-xxx.aliyuncs.com
OSS_BUCKET_NAME=your-bucket

# optional
OSS_PREFIX=console
OSS_CUSTOM_DOMAIN=feedbacks.feitianchengzi.com
ALLOW_ROOT_DEPLOY=0
SYNC_ROOT_INDEX=1
ROOT_INDEX_TARGET=/console
```

## Usage

```bash
cd webapps/feedback-console-web
npm run deploy:oss
```

With `SYNC_ROOT_INDEX=1`, the deploy will also upload bucket root `index.html`
as an SPA fallback. Direct `/console/*` links keep their original path, while the
bucket root still redirects to `ROOT_INDEX_TARGET`. It does not delete or overwrite `sdk/`
or any other prefix.

Use `/console` as the public console entry. Avoid `/console/` because OSS
website hosting treats trailing-slash paths as directory requests.
The generated root redirect automatically appends `deploy_v=<timestamp>` to
avoid stale browser cache after deployment.

Publish root redirect (`/` -> `/console` by default):

```bash
cd webapps/feedback-console-web
npm run publish:root-index
# real upload
npm run publish:root-index:execute
```
