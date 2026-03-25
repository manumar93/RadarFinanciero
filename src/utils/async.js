async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function runOne() {
    while (true) {
      const current = nextIndex;
      nextIndex += 1;

      if (current >= items.length) return;

      try {
        results[current] = {
          status: "fulfilled",
          value: await worker(items[current], current),
        };
      } catch (error) {
        results[current] = { status: "rejected", reason: error };
      }
    }
  }

  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, () =>
    runOne()
  );

  await Promise.all(workers);
  return results;
}

module.exports = { mapWithConcurrency };
