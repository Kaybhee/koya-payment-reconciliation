// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.
// Run:  node reconcile.js
const fs = require("fs");

let total = 0;

const lines = fs
  .readFileSync("payments.jsonl", "utf8")
  .split(/\r\n|\n|\r/)
  .filter((line) => line.trim().length > 0);

const latestAttemptByTxn = new Map();

for (const line of lines) {
  let event;
  try {
    event = JSON.parse(line);
  } catch {
    continue;
  }

  if (!event.txn_id) {
    continue;
  }

  const previous = latestAttemptByTxn.get(event.txn_id);
  if (!previous || String(event.ts || "") >= String(previous.ts || "")) {
    latestAttemptByTxn.set(event.txn_id, event);
  }
}

let count = 0;
for (const event of latestAttemptByTxn.values()) {
  if (event.status === "success") {
    total += Number(String(event.amount).replace(/,/g, ""));
    count += 1;
  }
}

const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);

if (count !== expected) {
  console.log(`Check failed: counted ${count} successful payments, expected ${expected}.`);
  console.log("Something in the data isn't being handled the way the README describes.");
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}
