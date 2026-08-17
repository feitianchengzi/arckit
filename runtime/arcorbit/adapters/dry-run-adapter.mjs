export function createDryRunAdapter() {
  return {
    name: "dry-run",
    async *runTurn() {
      yield {
        type: "adapter.skipped",
        message: "Dry-run adapter does not start an agent process."
      };
    }
  };
}
