/**
 * Pairing algorithm for MockLoop scheduling.
 *
 * - Generates all possible unique pairs from active users
 * - Scores each pair: daysSinceLastPaired + roleAlternation bonus
 * - Greedily selects highest-scored pairs
 * - Odd users: person who sat out most recently gets priority
 */

interface UserInfo {
  id: string;
  name: string | null;
  email: string;
  timezone?: string | null;
}

interface PairingHistoryEntry {
  userAId: string;
  userBId: string;
  roleA: string;
  roleB: string;
  scheduledDate: Date;
}

export interface ProposedPairing {
  userA: UserInfo;
  userB: UserInfo;
  roleA: "INTERVIEWER" | "INTERVIEWEE";
  roleB: "INTERVIEWER" | "INTERVIEWEE";
}

/**
 * Generate optimal pairings from active users based on history.
 */
export function generatePairings(
  activeUsers: UserInfo[],
  history: PairingHistoryEntry[]
): ProposedPairing[] {
  if (activeUsers.length < 2) return [];

  const now = new Date();

  // Build a map of last pairing date for each pair
  const pairKey = (a: string, b: string) =>
    [a, b].sort().join("::");

  const lastPairedMap = new Map<string, Date>();
  const lastRoleMap = new Map<string, string>(); // userId -> last role

  for (const h of history) {
    const key = pairKey(h.userAId, h.userBId);
    const existing = lastPairedMap.get(key);
    if (!existing || h.scheduledDate > existing) {
      lastPairedMap.set(key, h.scheduledDate);
    }
    // Track last role for each user
    if (
      !lastRoleMap.has(h.userAId) ||
      h.scheduledDate > (lastPairedMap.get(h.userAId + "::role") ?? new Date(0))
    ) {
      lastRoleMap.set(h.userAId, h.roleA);
    }
    if (
      !lastRoleMap.has(h.userBId) ||
      h.scheduledDate > (lastPairedMap.get(h.userBId + "::role") ?? new Date(0))
    ) {
      lastRoleMap.set(h.userBId, h.roleB);
    }
  }

  // Track who participated in each round to find who sat out
  const participatedInLast = new Set<string>();
  if (history.length > 0) {
    // Find the most recent scheduled date
    const lastDate = history.reduce(
      (max, h) => (h.scheduledDate > max ? h.scheduledDate : max),
      history[0].scheduledDate
    );
    for (const h of history) {
      if (h.scheduledDate.getTime() === lastDate.getTime()) {
        participatedInLast.add(h.userAId);
        participatedInLast.add(h.userBId);
      }
    }
  }

  // Generate all possible pairs with scores
  interface ScoredPair {
    userA: UserInfo;
    userB: UserInfo;
    score: number;
    roleA: "INTERVIEWER" | "INTERVIEWEE";
    roleB: "INTERVIEWER" | "INTERVIEWEE";
  }

  const scoredPairs: ScoredPair[] = [];

  for (let i = 0; i < activeUsers.length; i++) {
    for (let j = i + 1; j < activeUsers.length; j++) {
      const a = activeUsers[i];
      const b = activeUsers[j];
      const key = pairKey(a.id, b.id);

      // Days since last paired (higher = better)
      const lastPaired = lastPairedMap.get(key);
      const daysSince = lastPaired
        ? Math.floor(
            (now.getTime() - lastPaired.getTime()) / (1000 * 60 * 60 * 24)
          )
        : 9999; // never paired

      // Determine roles — alternate from last time
      const lastRoleA = lastRoleMap.get(a.id);
      const lastRoleB = lastRoleMap.get(b.id);

      let roleA: "INTERVIEWER" | "INTERVIEWEE";
      let roleB: "INTERVIEWER" | "INTERVIEWEE";

      if (lastRoleA === "INTERVIEWER") {
        roleA = "INTERVIEWEE";
        roleB = "INTERVIEWER";
      } else if (lastRoleA === "INTERVIEWEE") {
        roleA = "INTERVIEWER";
        roleB = "INTERVIEWEE";
      } else {
        // No history — assign randomly
        roleA = "INTERVIEWER";
        roleB = "INTERVIEWEE";
      }

      // Role alternation bonus
      let roleBonus = 0;
      if (lastRoleA && roleA !== lastRoleA) roleBonus += 10;
      if (lastRoleB && roleB !== lastRoleB) roleBonus += 10;

      scoredPairs.push({
        userA: a,
        userB: b,
        score: daysSince + roleBonus,
        roleA,
        roleB,
      });
    }
  }

  // Sort by score descending
  scoredPairs.sort((a, b) => b.score - a.score);

  // Greedy selection — pick highest-scored pair, remove both users
  const used = new Set<string>();
  const result: ProposedPairing[] = [];

  // If odd number, prioritize the person who sat out last round
  let priorityUser: string | null = null;
  if (activeUsers.length % 2 === 1) {
    // Find user who didn't participate last round
    const satOut = activeUsers.filter(
      (u) => !participatedInLast.has(u.id)
    );
    if (satOut.length > 0) {
      priorityUser = satOut[0].id;
    }
  }

  // If there's a priority user, ensure they get paired first
  if (priorityUser) {
    const priorityPairs = scoredPairs.filter(
      (p) => p.userA.id === priorityUser || p.userB.id === priorityUser
    );
    if (priorityPairs.length > 0) {
      const best = priorityPairs[0];
      result.push({
        userA: best.userA,
        userB: best.userB,
        roleA: best.roleA,
        roleB: best.roleB,
      });
      used.add(best.userA.id);
      used.add(best.userB.id);
    }
  }

  // Fill remaining pairs
  for (const pair of scoredPairs) {
    if (used.has(pair.userA.id) || used.has(pair.userB.id)) continue;
    result.push({
      userA: pair.userA,
      userB: pair.userB,
      roleA: pair.roleA,
      roleB: pair.roleB,
    });
    used.add(pair.userA.id);
    used.add(pair.userB.id);
  }

  return result;
}
