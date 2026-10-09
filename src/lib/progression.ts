import type {
  Badge,
  PlayerLevel,
} from "@/types/wildmiles";

export function getPlayerLevel(
  xp: number
): PlayerLevel {
  if (xp >= 3500) {
    return {
      level: 5,
      name: "Adventure Master",
      emoji: "🏔️",
      nextLevelXp: null,
    };
  }

  if (xp >= 2000) {
    return {
      level: 4,
      name: "Quest Runner",
      emoji: "🧭",
      nextLevelXp: 3500,
    };
  }

  if (xp >= 1000) {
    return {
      level: 3,
      name: "Outdoor Explorer",
      emoji: "🌳",
      nextLevelXp: 2000,
    };
  }

  if (xp >= 500) {
    return {
      level: 2,
      name: "Trail Curious",
      emoji: "🌿",
      nextLevelXp: 1000,
    };
  }

  return {
    level: 1,
    name: "Grass Rookie",
    emoji: "🌱",
    nextLevelXp: 500,
  };
}

export function getUnlockedBadges(
  completedQuestCount: number,
  verifiedPhotoCount: number
): Badge[] {
  const badges: Badge[] = [];

  if (completedQuestCount >= 1) {
    badges.push({
      name: "First Touch",
      emoji: "🌱",
      description:
        "Completed your first WildMiles quest.",
    });
  }

  if (verifiedPhotoCount >= 1) {
    badges.push({
      name: "Proof of Grass",
      emoji: "📸",
      description:
        "Passed your first AI photo verification.",
    });
  }

  if (completedQuestCount >= 3) {
    badges.push({
      name: "Quest Streak",
      emoji: "🔥",
      description:
        "Completed 3 WildMiles quests.",
    });
  }

  if (verifiedPhotoCount >= 5) {
    badges.push({
      name: "Nature Seeker",
      emoji: "🌳",
      description:
        "Completed 5 verified photo challenges.",
    });
  }

  return badges;
}