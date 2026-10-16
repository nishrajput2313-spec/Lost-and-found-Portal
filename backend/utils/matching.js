const Item = require("../models/Item");

// Very small stopword list so keyword overlap isn't dominated by filler words.
const STOPWORDS = new Set([
  "the", "a", "an", "with", "and", "of", "in", "on", "at", "my", "is",
  "it", "to", "for", "was", "has", "have", "had", "near", "by",
]);

function keywords(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function keywordOverlapScore(a, b) {
  const setA = new Set(keywords(a));
  const setB = new Set(keywords(b));
  if (setA.size === 0 || setB.size === 0) return 0;
  let shared = 0;
  setA.forEach((w) => {
    if (setB.has(w)) shared += 1;
  });
  return shared / Math.max(setA.size, setB.size); // 0..1
}

function daysBetween(dateA, dateB) {
  return Math.abs(new Date(dateA) - new Date(dateB)) / 86400000;
}

/**
 * Scores a candidate item against a source item on a 0-100 scale:
 *  - 40 pts: same category (required to even be considered)
 *  - 30 pts: title/description keyword overlap
 *  - 15 pts: same location
 *  - 15 pts: reported within the date window (closer = more points)
 */
function scoreMatch(source, candidate, dateWindowDays) {
  if (source.category !== candidate.category) return 0;

  let score = 40;

  const textOverlap = keywordOverlapScore(
    `${source.title} ${source.description}`,
    `${candidate.title} ${candidate.description}`
  );
  score += textOverlap * 30;

  if (source.location.toLowerCase() === candidate.location.toLowerCase()) {
    score += 15;
  }

  const gap = daysBetween(source.date, candidate.date);
  if (gap <= dateWindowDays) {
    score += 15 * (1 - gap / dateWindowDays);
  }

  return Math.round(score);
}

/**
 * Finds "found" items that could match a "lost" item, or vice versa.
 * Only returns candidates scoring above `minScore`, sorted best-first.
 */
async function findMatches(sourceItem, { dateWindowDays = 14, minScore = 40, limit = 5 } = {}) {
  const oppositeType = sourceItem.type === "lost" ? "found" : "lost";

  const candidates = await Item.find({
    _id: { $ne: sourceItem._id },
    type: oppositeType,
    category: sourceItem.category,
    status: { $in: ["posted", "claimed"] },
    isActive: true,
  }).populate("postedBy", "name");

  return candidates
    .map((candidate) => ({
      item: candidate,
      score: scoreMatch(sourceItem, candidate, dateWindowDays),
    }))
    .filter((m) => m.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

module.exports = { findMatches, scoreMatch };
