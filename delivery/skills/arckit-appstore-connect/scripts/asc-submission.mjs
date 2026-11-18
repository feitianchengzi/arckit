import { isMain } from './cli-entry.mjs';
// Deterministic helpers; business declarations and user approval remain Agent-owned.
import { jwt, allPages, request, redact } from './asc-api.mjs';
import { loadProfile } from './asc-auth.mjs';

export function selectLatestBuild({ data, included = [], complete }, appId, platform) {
  if (complete !== true) throw new Error('Complete paginated build inventory required');
  if (!['IOS', 'MAC_OS'].includes(platform)) throw new Error('Select IOS or MAC_OS');
  const versions = new Map(included.filter(r => r.type === 'preReleaseVersions').map(r => [r.id, r]));
  const candidates = [];
  for (const b of data) {
    if (b.type !== 'builds' || b.relationships?.app?.data?.id !== appId) continue;
    const v = versions.get(b.relationships?.preReleaseVersion?.data?.id);
    if (!v) throw new Error('Missing preReleaseVersion; cannot establish latest platform build');
    if (v.attributes?.platform !== platform) continue;
    if (!Number.isFinite(Date.parse(b.attributes?.uploadedDate))) throw new Error('Missing upload time');
    candidates.push({ b, v });
  }
  candidates.sort((a, b) => Date.parse(b.b.attributes.uploadedDate) - Date.parse(a.b.attributes.uploadedDate));
  if (!candidates.length) return { status: 'blocked_no_testflight', appId, platform };
  const { b, v } = candidates[0];
  if (candidates[1] && Date.parse(candidates[1].b.attributes.uploadedDate) === Date.parse(b.attributes.uploadedDate))
    throw new Error('Latest upload time is ambiguous; resolve explicitly');
  const result = { appId, platform, buildId: b.id, version: v.attributes.version,
    buildNumber: b.attributes.version, uploadedDate: b.attributes.uploadedDate };
  // Never filter ineligible builds before sorting: that would silently select an older build.
  const reasons = [];
  if (b.attributes.processingState !== 'VALID') reasons.push('processing_not_valid');
  if (b.attributes.buildAudienceType === 'INTERNAL_ONLY') reasons.push('internal_only');
  if (!['APP_STORE_ELIGIBLE', 'INTERNAL_ONLY'].includes(b.attributes.buildAudienceType)) reasons.push('audience_unknown');
  if (!result.version || !result.buildNumber) reasons.push('version_unknown');
  return { ...result, status: reasons.length ? 'blocked_latest_build' : 'selected', reasons };
}

export async function latestBuild({ appId, platform, token, fetchImpl }) {
  const query = new URLSearchParams({ 'filter[app]': appId, include: 'app,preReleaseVersion', limit: '200' });
  const r = await allPages({ path: `/v1/builds?${query}`, token, fetchImpl });
  return selectLatestBuild({ ...r.body, complete: r.body.meta.complete }, appId, platform);
}

export function submissionReceipt(submission, items, version, buildId) {
  const s = submission?.data;
  const v = version?.data;
  if (s?.type !== 'reviewSubmissions' || v?.type !== 'appStoreVersions' ||
      v.relationships?.build?.data?.id !== buildId ||
      !items?.data?.some(i => i.relationships?.appStoreVersion?.data?.id === v.id))
    return { status: 'outcome_unknown', reason: 'submission_version_build_link_unverified' };
  if (s.attributes?.platform !== v.attributes?.platform)
    return { status: 'outcome_unknown', reason: 'platform_mismatch' };
  const state = s.attributes?.state;
  if (['WAITING_FOR_REVIEW', 'IN_REVIEW', 'COMPLETED'].includes(state) && s.attributes?.submittedDate)
    return { status: 'submitted', submissionId: s.id, versionId: v.id, buildId,
      state, submittedDate: s.attributes.submittedDate };
  return { status: 'not_confirmed_submitted', submissionId: s.id, state };
}

async function main(args) {
  const [action, ...rest] = args;
  if (!action || action === '--help') {
    console.log('asc-submission.mjs latest --app ID --platform IOS|MAC_OS --profile NAME\nasc-submission.mjs receipt --submission ID --version ID --build ID --profile NAME\nRead-only; latest requires complete inventory, receipt reads once and never waits for approval.');
    return;
  }
  const opts = {};
  for (let i = 0; i < rest.length; i += 2) {
    if (!['--app','--platform','--profile','--submission','--version','--build'].includes(rest[i]) || !rest[i+1]) throw new Error('Invalid option');
    opts[rest[i].slice(2)] = rest[i+1];
  }
  if (!['latest', 'receipt'].includes(action)) throw new Error('Unknown action');
  for (const k of action === 'latest' ? ['app','platform','profile'] : ['submission','version','build','profile'])
    if (!opts[k]) throw new Error(`Missing --${k}`);
  const p = await loadProfile(opts.profile);
  const token = jwt({ ASC_KEY_ID: p.keyId, ASC_ISSUER_ID: p.issuerId }, p.privateKey);
  let result;
  if (action === 'latest') result = await latestBuild({ appId: opts.app, platform: opts.platform, token });
  else {
    const sid = encodeURIComponent(opts.submission), vid = encodeURIComponent(opts.version);
    const [s, items, v] = await Promise.all([
      request({path:`/v1/reviewSubmissions/${sid}`, token}),
      allPages({path:`/v1/reviewSubmissions/${sid}/items?include=appStoreVersion`, token}),
      request({path:`/v1/appStoreVersions/${vid}?include=build`, token})
    ]);
    result = submissionReceipt(s.body, items.body, v.body, opts.build);
  }
  console.log(JSON.stringify(redact(result), null, 2));
}
if (isMain(import.meta.url))
  main(process.argv.slice(2)).catch(e => { console.error(JSON.stringify(redact(e.result ?? {kind:'local_error',message:e.message}))); process.exitCode=1; });
