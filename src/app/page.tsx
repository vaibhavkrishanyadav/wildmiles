"use client";

import { useRef, useState } from "react";
import RunMap from "@/components/RunMap";

type Challenge = {
  title: string;
  instruction: string;
  type: string;
  requiresPhoto: boolean;
  xp: number;
};

type Quest = {
  title: string;
  summary: string;
  warmup: string;

  challenges: {
    movement: Challenge;
    exploration: Challenge;
    photo: Challenge;
    finish: Challenge;
  };

  completionBonus: number;
  totalXp: number;

  settings: {
    duration: number;
    difficulty: string;
    mode: string;
  };
};

type RunPoint = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
};

type QuestCheckpoint = {
  type: string;
  title: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  distanceKm: number;
};

export default function Home() {
  const [duration, setDuration] = useState(30);
  const [difficulty, setDifficulty] = useState("easy");
  const [mode, setMode] = useState("exploration");

  const [quest, setQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [completedChallenges, setCompletedChallenges] = useState<string[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoVerifying, setPhotoVerifying] = useState(false);
  const [photoResult, setPhotoResult] = useState<{
    verified: boolean;
    confidence: number;
    reason: string;
    observation: string;
  } | null>(null);
  const [totalXp, setTotalXp] = useState(() => {
    if (typeof window === "undefined") {
      return 0;
    }

    return Number(
      localStorage.getItem("wildmiles_total_xp") || 0
    );
  });
  const [completedQuestCount, setCompletedQuestCount] = useState(() => {
    if (typeof window === "undefined") {
      return 0;
    }

    return Number(
      localStorage.getItem("wildmiles_completed_quests") || 0
    );
  });
  const [verifiedPhotoCount, setVerifiedPhotoCount] = useState(() => {
    if (typeof window === "undefined") {
      return 0;
    }
    return Number(
      localStorage.getItem("wildmiles_verified_photos") || 0
    );
  });
  const [questRewardSaved, setQuestRewardSaved] = useState(false);
  const [runActive, setRunActive] = useState(false);
  const [runPoints, setRunPoints] = useState<RunPoint[]>([]);
  const [distanceKm, setDistanceKm] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState("");
  const [runStartedAt, setRunStartedAt] = useState<number | null>(null);
  const [runFinished, setRunFinished] = useState(false);
  const [questCheckpoints, setQuestCheckpoints] = useState<QuestCheckpoint[]>([]);
  const [runRecap, setRunRecap] = useState<{
    title: string;
    recap: string;
    highlight: string;
    closingLine: string;
  } | null>(null);

  const [recapLoading, setRecapLoading] =  useState(false);

  const gpsWatchId = useRef<number | null>(null);
  const timerId = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastAcceptedPoint = useRef<RunPoint | null>(null);

  const playerLevel = getPlayerLevel(totalXp);
  const unlockedBadges = getUnlockedBadges();

  const averagePace =
  distanceKm > 0
    ? elapsedSeconds / 60 / distanceKm
    : 0;

  async function generateQuest() {
    try {
      setLoading(true);
      setError("");
      setQuest(null);

      const response = await fetch("/api/quest", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          duration,
          difficulty,
          mode,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate quest");
      }

      setCompletedChallenges([]);
      setPhotoPreview(null);
      setPhotoResult(null);
      setQuestRewardSaved(false);
      setQuestCheckpoints([]);
      setQuest(data.quest);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleChallenge(type: string) {
    if (!quest) {
      return;
    }

    let updatedChallenges: string[];

    if (completedChallenges.includes(type)) {
      updatedChallenges =
        completedChallenges.filter(
          (item) => item !== type
        );

      setQuestCheckpoints((current) =>
        current.filter(
          (checkpoint) =>
            checkpoint.type !== type
        )
      );
    } else {
      updatedChallenges = [
        ...completedChallenges,
        type,
      ];

      const challenge =
        Object.values(
          quest.challenges
        ).find(
          (item) =>
            item.type === type
        );

      if (challenge) {
        recordQuestCheckpoint(
          type,
          challenge.title
        );
      }
    }

    setCompletedChallenges(
      updatedChallenges
    );

    saveQuestCompletion(
      updatedChallenges
    );
  }

  function recordQuestCheckpoint(
    type: string,
    title: string
  ) {
    const latestPoint =
      runPoints[runPoints.length - 1];

    if (!latestPoint) {
      return;
    }

    const alreadyRecorded =
      questCheckpoints.some(
        (checkpoint) => checkpoint.type === type
      );

    if (alreadyRecorded) {
      return;
    }

    const checkpoint: QuestCheckpoint = {
      type,
      title,
      latitude: latestPoint.latitude,
      longitude: latestPoint.longitude,
      timestamp: Date.now(),
      distanceKm,
    };

    setQuestCheckpoints((current) => [
      ...current,
      checkpoint,
    ]);
  }

  function getEarnedXp() {
    if (!quest) return 0;

    let earned = 0;

    Object.values(quest.challenges).forEach((challenge) => {
      if (completedChallenges.includes(challenge.type)) {
        earned += challenge.xp;
      }
    });

    if (completedChallenges.length === 4) {
      earned += quest.completionBonus;
    }

    return earned;
  }

  function handlePhotoUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      const result = reader.result;

      if (typeof result === "string") {
        setPhotoPreview(result);
        setPhotoResult(null);
      }
    };

    reader.readAsDataURL(file);
  }

  async function verifyPhoto() {
    if (!quest || !photoPreview) {
      return;
    }

    try {
      setPhotoVerifying(true);
      setError("");
      setPhotoResult(null);

      const response = await fetch("/api/verify-photo", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          challenge:
            quest.challenges.photo.instruction,

          image: photoPreview,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Photo verification failed"
        );
      }

      setPhotoResult(data.verification);

      if (
        data.verification.verified &&
        !completedChallenges.includes("photo")
      ) {
        const updatedChallenges = [
          ...completedChallenges,
          "photo",
        ];

        setCompletedChallenges(updatedChallenges);

        recordQuestCheckpoint(
          "photo",
          quest.challenges.photo.title
        );

        setVerifiedPhotoCount((current) => {
          const updated = current + 1;

          localStorage.setItem(
            "wildmiles_verified_photos",
            String(updated)
          );

          return updated;
        });

        saveQuestCompletion(updatedChallenges);
      }
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Photo verification failed"
      );
    } finally {
      setPhotoVerifying(false);
    }
  }

  function getPlayerLevel(xp: number) {
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

  function getUnlockedBadges() {
    const badges = [];

    if (completedQuestCount >= 1) {
      badges.push({
        name: "First Touch",
        emoji: "🌱",
        description: "Completed your first WildMiles quest.",
      });
    }

    if (verifiedPhotoCount >= 1) {
      badges.push({
        name: "Proof of Grass",
        emoji: "📸",
        description: "Passed your first AI photo verification.",
      });
    }

    if (completedQuestCount >= 3) {
      badges.push({
        name: "Quest Streak",
        emoji: "🔥",
        description: "Completed 3 WildMiles quests.",
      });
    }

    if (verifiedPhotoCount >= 5) {
      badges.push({
        name: "Nature Seeker",
        emoji: "🌳",
        description: "Completed 5 verified photo challenges.",
      });
    }

    return badges;
  }

  function saveQuestCompletion(completed: string[]) {
    if (!quest) return;

    if (
      completed.length === 4 &&
      !questRewardSaved
    ) {
      let earnedXp = 0;

      Object.values(quest.challenges).forEach((challenge) => {
        if (completed.includes(challenge.type)) {
          earnedXp += challenge.xp;
        }
      });

      earnedXp += quest.completionBonus;

      setTotalXp((current) => {
        const updated = current + earnedXp;

        localStorage.setItem(
          "wildmiles_total_xp",
          String(updated)
        );

        return updated;
      });

      setCompletedQuestCount((current) => {
        const updated = current + 1;

        localStorage.setItem(
          "wildmiles_completed_quests",
          String(updated)
        );

        return updated;
      });

      setQuestRewardSaved(true);
    }
  }

  function startRun() {
    if (!navigator.geolocation) {
      setGpsError(
        "Geolocation is not supported by this browser."
      );
      return;
    }

    setGpsError("");
    setRunPoints([]);
    setDistanceKm(0);
    setElapsedSeconds(0);
    lastAcceptedPoint.current = null;
    setGpsAccuracy(null);
    setRunFinished(false);
    setRunRecap(null);

    const startTime = Date.now();

    setRunStartedAt(startTime);
    setRunActive(true);

    timerId.current = setInterval(() => {
      setElapsedSeconds(
        Math.floor((Date.now() - startTime) / 1000)
      );
    }, 1000);

    gpsWatchId.current =
      navigator.geolocation.watchPosition(
        (position) => {
          const point: RunPoint = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };

          // Always display the latest reported accuracy,
          // even if we reject the point from the route.
          setGpsAccuracy(position.coords.accuracy);

          const previousPoint =
            lastAcceptedPoint.current;

          const accepted = shouldAcceptGpsPoint(
            previousPoint,
            point
          );

          if (!accepted) {
            console.log(
              "GPS point rejected",
              {
                accuracy: point.accuracy,
                latitude: point.latitude,
                longitude: point.longitude,
              }
            );

            return;
          }

          if (previousPoint) {
            const addedDistance =
              calculateDistanceKm(
                previousPoint.latitude,
                previousPoint.longitude,
                point.latitude,
                point.longitude
              );

            setDistanceKm(
              (currentDistance) =>
                currentDistance + addedDistance
            );
          }

          lastAcceptedPoint.current = point;

          setRunPoints((currentPoints) => [
            ...currentPoints,
            point,
          ]);
        },

        (error) => {
          console.error("GPS error:", error);

          if (error.code === 1) {
            setGpsError(
              "Location permission was denied."
            );
          } else if (error.code === 2) {
            setGpsError(
              "Your location could not be determined."
            );
          } else if (error.code === 3) {
            setGpsError(
              "Location request timed out."
            );
          } else {
            setGpsError(
              "Unable to access your location."
            );
          }
        },

        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 15000,
        }
      );
  }

  function stopRun() {
    if (gpsWatchId.current !== null) {
      navigator.geolocation.clearWatch(
        gpsWatchId.current
      );

      gpsWatchId.current = null;
    }

    if (timerId.current !== null) {
      clearInterval(timerId.current);

      timerId.current = null;
    }

    setRunActive(false);
    setRunFinished(true);
  }

  async function generateRunRecap() {
    if (!quest) {
      return;
    }

    try {
      setRecapLoading(true);
      setRunRecap(null);

      const completedChallengeDetails =
        Object.values(quest.challenges)
          .filter((challenge) =>
            completedChallenges.includes(
              challenge.type
            )
          )
          .map((challenge) => ({
            type: challenge.type,
            title: challenge.title,
            instruction: challenge.instruction,
          }));

      const checkpointDetails =
        questCheckpoints.map(
          (checkpoint) => ({
            type: checkpoint.type,
            title: checkpoint.title,
            distanceKm:
              checkpoint.distanceKm.toFixed(2),
          })
        );

      const response = await fetch(
        "/api/run-recap",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            distanceKm:
              distanceKm.toFixed(2),

            elapsedTime:
              formatTime(elapsedSeconds),

            averagePace:
              `${formatPace(averagePace)} /km`,

            questTitle:
              quest.title,

            completedChallenges:
              completedChallengeDetails,

            checkpoints:
              checkpointDetails,

            photoObservation:
              photoResult?.verified
                ? photoResult.observation
                : null,
          }),
        }
      );

      const data = await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Failed to generate recap"
        );
      }

      setRunRecap(data.recap);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to generate run recap"
      );
    } finally {
      setRecapLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">

      <div className="mx-auto max-w-4xl px-6 py-12">

        {/* HEADER */}

        <header className="mb-12">

          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-lime-400">
            WildMiles
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Turn your run into an adventure.
          </h1>

          <p className="mt-4 max-w-2xl text-lg text-zinc-400">
            Local AI creates the quest.
            You create the miles.
          </p>

        </header>

        <section className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-sm uppercase tracking-widest text-zinc-500">
                Your WildMiles Level
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                {playerLevel.emoji} Level {playerLevel.level}
              </h2>

              <p className="mt-1 text-lime-400">
                {playerLevel.name}
              </p>

            </div>


            <div className="text-left sm:text-right">

              <p className="text-sm text-zinc-500">
                Total XP
              </p>

              <p className="text-3xl font-bold">
                {totalXp}
              </p>

            </div>

          </div>


          {playerLevel.nextLevelXp && (

            <div className="mt-6">

              <div className="mb-2 flex justify-between text-sm text-zinc-400">

                <span>
                  Level progress
                </span>

                <span>
                  {totalXp} / {playerLevel.nextLevelXp} XP
                </span>

              </div>

              <div className="h-3 overflow-hidden rounded-full bg-zinc-800">

                <div
                  className="h-full bg-lime-400 transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      (totalXp / playerLevel.nextLevelXp) * 100,
                      100
                    )}%`,
                  }}
                />

              </div>

            </div>

          )}

        </section>

        {unlockedBadges.length > 0 && (

          <section className="mb-8">

            <p className="mb-3 text-sm uppercase tracking-widest text-zinc-500">
              Badges
            </p>

            <div className="grid gap-3 sm:grid-cols-2">

              {unlockedBadges.map((badge) => (

                <div
                  key={badge.name}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
                >

                  <div className="flex items-start gap-3">

                    <div className="text-3xl">
                      {badge.emoji}
                    </div>

                    <div>

                      <p className="font-semibold">
                        {badge.name}
                      </p>

                      <p className="mt-1 text-sm text-zinc-400">
                        {badge.description}
                      </p>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          </section>

        )}

        {/* QUEST SETTINGS */}

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8">

          <h2 className="mb-8 text-2xl font-semibold">
            Build today&apos;s quest
          </h2>


          {/* DURATION */}

          <div className="mb-8">

            <p className="mb-3 text-sm font-medium text-zinc-300">
              How long do you want to run?
            </p>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

              {[20, 30, 45, 60].map((value) => (

                <button
                  key={value}
                  onClick={() => setDuration(value)}
                  className={`rounded-xl border px-4 py-3 font-medium transition ${
                    duration === value
                      ? "border-lime-400 bg-lime-400 text-black"
                      : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500"
                  }`}
                >
                  {value} min
                </button>

              ))}

            </div>

          </div>


          {/* DIFFICULTY */}

          <div className="mb-8">

            <p className="mb-3 text-sm font-medium text-zinc-300">
              Difficulty
            </p>

            <div className="grid grid-cols-3 gap-3">

              {["easy", "moderate", "hard"].map((value) => (

                <button
                  key={value}
                  onClick={() => setDifficulty(value)}
                  className={`rounded-xl border px-4 py-3 capitalize transition ${
                    difficulty === value
                      ? "border-lime-400 bg-lime-400 text-black"
                      : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500"
                  }`}
                >
                  {value}
                </button>

              ))}

            </div>

          </div>


          {/* MODE */}

          <div className="mb-8">

            <p className="mb-3 text-sm font-medium text-zinc-300">
              What kind of adventure?
            </p>

            <div className="grid gap-3 sm:grid-cols-2">

              <ModeButton
                title="🧭 Exploration"
                description="Discover unfamiliar streets and places."
                selected={mode === "exploration"}
                onClick={() => setMode("exploration")}
              />

              <ModeButton
                title="🌿 Nature"
                description="Look for interesting things outdoors."
                selected={mode === "nature"}
                onClick={() => setMode("nature")}
              />

              <ModeButton
                title="⚡ Fitness"
                description="More running and movement challenges."
                selected={mode === "fitness"}
                onClick={() => setMode("fitness")}
              />

              <ModeButton
                title="🎲 Surprise Me"
                description="Let WildMiles decide your adventure."
                selected={mode === "surprise"}
                onClick={() => setMode("surprise")}
              />

            </div>

          </div>


          {/* GENERATE BUTTON */}

          <button
            onClick={generateQuest}
            disabled={loading}
            className="w-full rounded-xl bg-lime-400 px-6 py-4 text-lg font-bold text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
          >

            {loading
              ? "Creating your adventure..."
              : "Generate My Quest"}

          </button>

        </section>


        {/* ERROR */}

        {error && (

          <div className="mt-6 rounded-xl border border-red-900 bg-red-950 p-4 text-red-300">
            {error}
          </div>

        )}


        {/* GENERATED QUEST */}

        {quest && (

          <section className="mt-10">

            <div className="mb-6">

              <p className="text-sm font-medium uppercase tracking-widest text-lime-400">
                Today&apos;s Quest
              </p>

              <h2 className="mt-2 text-4xl font-bold">
                {quest.title}
              </h2>

              <p className="mt-3 text-zinc-400">
                {quest.summary}
              </p>

            </div>


            {/* QUEST META */}

            <div className="mb-6 grid grid-cols-3 gap-3">

              <Stat
                label="Duration"
                value={`${quest.settings.duration} min`}
              />

              <Stat
                label="Difficulty"
                value={quest.settings.difficulty}
              />

              <Stat
                label="Total XP"
                value={`${quest.totalXp} XP`}
              />

            </div>


            {/* WARMUP */}

            <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">

              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Warm Up
              </p>

              <p className="text-zinc-200">
                {quest.warmup}
              </p>

            </div>

            <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-zinc-400">
                    Quest Progress
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    {completedChallenges.length} / 4
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-zinc-400">
                    XP Earned
                  </p>

                  <p className="mt-1 text-2xl font-bold text-lime-400">
                    {getEarnedXp()} XP
                  </p>
                </div>

              </div>


              <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-800">

                <div
                  className="h-full bg-lime-400 transition-all duration-300"
                  style={{
                    width: `${(completedChallenges.length / 4) * 100}%`,
                  }}
                />

              </div>

            </div>

            {/* CHALLENGES */}

            <div className="space-y-4">

              <ChallengeCard
                emoji="🏃"
                challenge={quest.challenges.movement}
                completed={completedChallenges.includes("movement")}
                onToggle={() => toggleChallenge("movement")}
                runActive={runActive}
              />

              <ChallengeCard
                emoji="🧭"
                challenge={quest.challenges.exploration}
                completed={completedChallenges.includes("exploration")}
                onToggle={() => toggleChallenge("exploration")}
                runActive={runActive}
              />

              <PhotoChallengeCard
                challenge={quest.challenges.photo}
                completed={completedChallenges.includes("photo")}
                photoPreview={photoPreview}
                photoResult={photoResult}
                verifying={photoVerifying}
                onPhotoUpload={handlePhotoUpload}
                onVerify={verifyPhoto}
                runActive={runActive}
              />

              <ChallengeCard
                emoji="🏁"
                challenge={quest.challenges.finish}
                completed={completedChallenges.includes("finish")}
                onToggle={() => toggleChallenge("finish")}
                runActive={runActive}
              />

            </div>


            {/* COMPLETION BONUS */}

            <div
              className={`mt-6 rounded-2xl border p-5 ${
                completedChallenges.length === 4
                  ? "border-lime-500 bg-lime-950/40"
                  : "border-zinc-800 bg-zinc-900"
              }`}
            >

              <div className="flex items-center justify-between">

                <div>

                  <p
                    className={`font-semibold ${
                      completedChallenges.length === 4
                        ? "text-lime-300"
                        : "text-zinc-300"
                    }`}
                  >
                    {completedChallenges.length === 4
                      ? "Quest Complete 🌿"
                      : "Complete all challenges"}
                  </p>

                  <p className="mt-1 text-sm text-zinc-400">
                    {completedChallenges.length === 4
                      ? "You earned the full quest bonus."
                      : "Finish every challenge to unlock the bonus."}
                  </p>

                </div>

                <p className="text-xl font-bold text-lime-400">
                  +{quest.completionBonus} XP
                </p>

              </div>

            </div>

          </section>

        )}

        <section className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8">

          <div className="flex items-center justify-between gap-4">

            <div>

              <p className="text-sm font-semibold uppercase tracking-widest text-lime-400">
                Live Run
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Outdoor Tracker
              </h2>

            </div>

            <div
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                runActive
                  ? "bg-lime-400/10 text-lime-400"
                  : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {runActive ? "● Tracking" : "Not running"}
            </div>

          </div>


          {/* LIVE STATS */}

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">

            <RunStat
              label="Time"
              value={formatTime(elapsedSeconds)}
            />

            <RunStat
              label="Distance"
              value={`${distanceKm.toFixed(2)} km`}
            />

            <RunStat
              label="Avg Pace"
              value={`${formatPace(averagePace)} /km`}
            />

            <RunStat
              label="GPS"
              value={
                gpsAccuracy !== null
                  ? `±${Math.round(gpsAccuracy)} m`
                  : "--"
              }
            />

          </div>
          
          <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-800">

            {runPoints.length > 0 ? (

              <RunMap
                points={runPoints}
                checkpoints={questCheckpoints}
              />

            ) : (

              <div className="flex h-[400px] items-center justify-center bg-zinc-950">

                <div className="text-center">

                  <p className="text-4xl">
                    🗺️
                  </p>

                  <p className="mt-3 font-semibold text-zinc-300">
                    Your route will appear here
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    Start your run to begin GPS tracking.
                  </p>

                </div>

              </div>

            )}

            {quest && (
              <div className="border-t border-zinc-800 bg-zinc-950 p-4">

                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  Quest Checkpoints
                </p>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">

                  <CheckpointStatus
                    emoji="🏃"
                    label="Movement"
                    completed={
                      completedChallenges.includes(
                        "movement"
                      )
                    }
                  />

                  <CheckpointStatus
                    emoji="🧭"
                    label="Explore"
                    completed={
                      completedChallenges.includes(
                        "exploration"
                      )
                    }
                  />

                  <CheckpointStatus
                    emoji="📸"
                    label="Photo"
                    completed={
                      completedChallenges.includes(
                        "photo"
                      )
                    }
                  />

                  <CheckpointStatus
                    emoji="🏁"
                    label="Finish"
                    completed={
                      completedChallenges.includes(
                        "finish"
                      )
                    }
                  />

                </div>

              </div>
            )}

          </div>

          {/* GPS ERROR */}

          {gpsError && (
            <div className="mt-5 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
              {gpsError}
            </div>
          )}


          {/* START / STOP */}

          <div className="mt-8">

            {!runActive ? (

              <button
                onClick={startRun}
                className="w-full rounded-xl bg-lime-400 px-6 py-4 text-lg font-bold text-black transition hover:bg-lime-300"
              >
                ▶ Start Run
              </button>

            ) : (

              <button
                onClick={stopRun}
                className="w-full rounded-xl bg-red-500 px-6 py-4 text-lg font-bold text-white transition hover:bg-red-400"
              >
                ■ Stop Run
              </button>

            )}

          </div>


          {/* GPS POINT COUNT */}

          {runActive && (
            <p className="mt-4 text-center text-xs text-zinc-500">
              Valid GPS points: {runPoints.length}
              {gpsAccuracy !== null &&
                ` • Current accuracy ±${Math.round(gpsAccuracy)} m`}
            </p>
          )}

        </section>

        {runFinished && (

          <section className="mt-6 rounded-3xl border border-lime-900 bg-lime-950/20 p-6">

            <p className="text-sm font-semibold uppercase tracking-widest text-lime-400">
              Run Complete
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Nice miles 🌿
            </h2>


            <div className="mt-6 grid grid-cols-3 gap-3">

              <RunStat
                label="Distance"
                value={`${distanceKm.toFixed(2)} km`}
              />

              <RunStat
                label="Time"
                value={formatTime(elapsedSeconds)}
              />

              <RunStat
                label="Avg Pace"
                value={`${formatPace(averagePace)} /km`}
              />

            </div>

            <div className="mt-6">
              <button
                onClick={generateRunRecap}
                disabled={recapLoading}
                className="w-full rounded-xl bg-lime-400 px-6 py-4 font-bold text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {recapLoading
                  ? "Writing your adventure..."
                  : "✨ Generate Adventure Recap"}
              </button>
            </div>

            {runRecap && (
              <div className="mt-6 rounded-2xl border border-lime-900 bg-zinc-950 p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-lime-400">
                  WildMiles Story
                </p>
                <h3 className="mt-2 text-2xl font-bold">
                  {runRecap.title}
                </h3>
                <p className="mt-4 leading-7 text-zinc-300">
                  {runRecap.recap}
                </p>
                <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <p className="text-xs uppercase tracking-wider text-zinc-500">
                    Adventure Highlight
                  </p>
                  <p className="mt-2 text-zinc-200">
                    🌿 {runRecap.highlight}
                  </p>
                </div>
                <p className="mt-5 font-medium text-lime-300">
                  {runRecap.closingLine}
                </p>
              </div>

            )}

          </section>

        )}

      </div>

    </main>
  );
}


function ModeButton({
  title,
  description,
  selected,
  onClick,
}: {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {

  return (

    <button
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${
        selected
          ? "border-lime-400 bg-lime-400/10"
          : "border-zinc-700 bg-zinc-800 hover:border-zinc-500"
      }`}
    >

      <p className="font-semibold">
        {title}
      </p>

      <p className="mt-1 text-sm text-zinc-400">
        {description}
      </p>

    </button>

  );
}

function CheckpointStatus({
  emoji,
  label,
  completed,
}: {
  emoji: string;
  label: string;
  completed: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        completed
          ? "border-lime-800 bg-lime-950/30"
          : "border-zinc-800 bg-zinc-900"
      }`}
    >
      <div className="flex items-center gap-2">

        <span>
          {completed
            ? "✅"
            : emoji}
        </span>

        <span
          className={
            completed
              ? "text-sm text-lime-300"
              : "text-sm text-zinc-400"
          }
        >
          {label}
        </span>

      </div>
    </div>
  );
}

function shouldAcceptGpsPoint(
  previous: RunPoint | null,
  current: RunPoint
) {
  // Reject inaccurate GPS readings
  if (current.accuracy > 30) {
    return false;
  }

  // Always accept the first reasonably accurate point
  if (!previous) {
    return true;
  }

  const distanceKm = calculateDistanceKm(
    previous.latitude,
    previous.longitude,
    current.latitude,
    current.longitude
  );

  const distanceMeters = distanceKm * 1000;

  // Ignore tiny GPS drift
  if (distanceMeters < 5) {
    return false;
  }

  const timeSeconds =
    (current.timestamp - previous.timestamp) / 1000;

  if (timeSeconds <= 0) {
    return false;
  }

  const speedMetersPerSecond =
    distanceMeters / timeSeconds;

  // Reject impossible jumps.
  // 10 m/s = 36 km/h, well above normal running speed.
  if (speedMetersPerSecond > 10) {
    return false;
  }

  return true;
}

function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const earthRadiusKm = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadiusKm * c;
}

function formatTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function formatPace(paceMinutes: number) {
  if (!Number.isFinite(paceMinutes) || paceMinutes <= 0) {
    return "--:--";
  }

  const minutes = Math.floor(paceMinutes);

  const seconds = Math.round(
    (paceMinutes - minutes) * 60
  );

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function RunStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">

      <p className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold">
        {value}
      </p>

    </div>
  );
}

function ChallengeCard({
  emoji,
  challenge,
  completed,
  onToggle,
  runActive,
}: {
  emoji: string;
  challenge: Challenge;
  completed: boolean;
  onToggle: () => void;
  runActive: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 transition ${
        completed
          ? "border-lime-500 bg-lime-950/30"
          : "border-zinc-800 bg-zinc-900"
      }`}
    >
      <div className="flex items-start gap-4">

        <div className="text-3xl">
          {completed ? "✅" : emoji}
        </div>

        <div className="flex-1">

          <div className="flex items-center justify-between gap-4">

            <h3
              className={`text-lg font-semibold ${
                completed ? "text-lime-300" : ""
              }`}
            >
              {challenge.title}
            </h3>

            <span className="whitespace-nowrap text-sm font-semibold text-lime-400">
              +{challenge.xp} XP
            </span>

          </div>

          <p className="mt-2 text-zinc-400">
            {challenge.instruction}
          </p>

          {challenge.requiresPhoto && (
            <p className="mt-3 text-sm font-medium text-lime-300">
              📷 Photo proof required
            </p>
          )}

          <button
            onClick={onToggle}
            disabled={!runActive}
            className={`mt-4 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              completed
                ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                : "bg-lime-400 text-black hover:bg-lime-300"
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {!runActive && !completed
              ? "Start Run First"
              : completed
                ? "Undo"
                : "Complete Challenge"}
          </button>

        </div>
      </div>
    </div>
  );
}

function PhotoChallengeCard({
  challenge,
  completed,
  photoPreview,
  photoResult,
  verifying,
  onPhotoUpload,
  onVerify,
  runActive,
}: {
  challenge: Challenge;
  completed: boolean;

  photoPreview: string | null;

  photoResult: {
    verified: boolean;
    confidence: number;
    reason: string;
    observation: string;
  } | null;

  verifying: boolean;

  onPhotoUpload: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;

  onVerify: () => void;
  runActive: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 transition ${
        completed
          ? "border-lime-500 bg-lime-950/30"
          : "border-zinc-800 bg-zinc-900"
      }`}
    >
      <div className="flex items-start gap-4">

        <div className="text-3xl">
          {completed ? "✅" : "📸"}
        </div>

        <div className="flex-1">

          <div className="flex items-center justify-between gap-4">

            <h3 className="text-lg font-semibold">
              {challenge.title}
            </h3>

            <span className="whitespace-nowrap text-sm font-semibold text-lime-400">
              +{challenge.xp} XP
            </span>

          </div>

          <p className="mt-2 text-zinc-400">
            {challenge.instruction}
          </p>

          <p className="mt-3 text-sm font-medium text-lime-300">
            📷 AI verified photo proof required
          </p>


          {/* PHOTO UPLOAD */}

          {!completed && runActive && (
            <div className="mt-5">

              <label className="inline-block cursor-pointer rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-700">

                📷 Choose Photo

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={onPhotoUpload}
                  className="hidden"
                />

              </label>

            </div>
          )}

          {!runActive && !completed && (
            <p className="mt-4 text-sm text-zinc-500">
              Start your run before completing this challenge.
            </p>
          )}

          {/* IMAGE PREVIEW */}

          {photoPreview && (
            <div className="mt-5">

              <img
                src={photoPreview}
                alt="WildMiles challenge proof"
                className="max-h-80 rounded-xl border border-zinc-800 object-cover"
              />

            </div>
          )}


          {/* VERIFY BUTTON */}

          {photoPreview && !completed && (
            <button
              onClick={onVerify}
              disabled={verifying}
              className="mt-4 rounded-lg bg-lime-400 px-4 py-2 text-sm font-bold text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {verifying
                ? "AI is checking..."
                : "Verify Photo"}
            </button>
          )}


          {/* VERIFICATION RESULT */}

          {photoResult && (
            <div
              className={`mt-5 rounded-xl border p-4 ${
                photoResult.verified
                  ? "border-lime-800 bg-lime-950/30"
                  : "border-red-900 bg-red-950/30"
              }`}
            >

              <p
                className={`font-semibold ${
                  photoResult.verified
                    ? "text-lime-300"
                    : "text-red-300"
                }`}
              >
                {photoResult.verified
                  ? "✅ Quest Verified"
                  : "❌ Quest Not Verified"}
              </p>

              <p className="mt-2 text-sm text-zinc-300">
                {photoResult.reason}
              </p>

              {photoResult.observation && (
                <p className="mt-3 text-sm text-zinc-400">
                  🌿 {photoResult.observation}
                </p>
              )}

              <p className="mt-3 text-xs text-zinc-500">
                Confidence:{" "}
                {Math.round(
                  photoResult.confidence * 100
                )}
                %
              </p>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (

    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">

      <p className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </p>

      <p className="mt-1 capitalize font-semibold">
        {value}
      </p>

    </div>

  );
}