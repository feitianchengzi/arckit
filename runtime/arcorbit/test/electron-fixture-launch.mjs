export function electronFixtureArguments(fixturePath, {
  platform = process.platform,
  ci = process.env.CI
} = {}) {
  const runsInCi = ci === "true" || ci === "1";
  return platform === "linux" && runsInCi
    ? ["--no-sandbox", fixturePath]
    : [fixturePath];
}
