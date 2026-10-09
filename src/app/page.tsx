"use client";

import {
  useRef,
  useState,
} from "react";

import type {
  ChangeEvent,
} from "react";

import Header from "@/components/Header";
import PlayerProfile from "@/components/PlayerProfile";
import BadgeList from "@/components/BadgeList";
import QuestBuilder from "@/components/QuestBuilder";
import QuestView from "@/components/QuestView";
import RunTracker from "@/components/RunTracker";
import RunRecap from "@/components/RunRecap";

import type {
  PhotoVerificationResult,
  Quest,
  QuestCheckpoint,
  RunPoint,
  RunRecap as RunRecapType,
} from "@/types/wildmiles";

import {
  calculateDistanceKm,
  formatPace,
  formatTime,
  shouldAcceptGpsPoint,
} from "@/lib/gps";

import {
  getPlayerLevel,
  getUnlockedBadges,
} from "@/lib/progression";

import {
  GPS_CONFIG,
  STORAGE_KEYS,
} from "@/lib/constants";


export default function Home() {
  const [
    duration,
    setDuration,
  ] = useState(30);

  const [
    difficulty,
    setDifficulty,
  ] = useState("easy");

  const [
    mode,
    setMode,
  ] = useState(
    "exploration"
  );


  const [
    quest,
    setQuest,
  ] =
    useState<Quest | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    completedChallenges,
    setCompletedChallenges,
  ] =
    useState<string[]>([]);


  const [
    photoPreview,
    setPhotoPreview,
  ] =
    useState<string | null>(
      null
    );

  const [
    photoVerifying,
    setPhotoVerifying,
  ] = useState(false);

  const [
    photoResult,
    setPhotoResult,
  ] =
    useState<
      PhotoVerificationResult | null
    >(null);


  const [
    totalXp,
    setTotalXp,
  ] = useState(() => {
    if (
      typeof window ===
      "undefined"
    ) {
      return 0;
    }

    return Number(
      localStorage.getItem(
        STORAGE_KEYS.TOTAL_XP
      ) || 0
    );
  });


  const [
    completedQuestCount,
    setCompletedQuestCount,
  ] = useState(() => {
    if (
      typeof window ===
      "undefined"
    ) {
      return 0;
    }

    return Number(
      localStorage.getItem(
        STORAGE_KEYS.COMPLETED_QUESTS
      ) || 0
    );
  });


  const [
    verifiedPhotoCount,
    setVerifiedPhotoCount,
  ] = useState(() => {
    if (
      typeof window ===
      "undefined"
    ) {
      return 0;
    }

    return Number(
      localStorage.getItem(
        STORAGE_KEYS.VERIFIED_PHOTOS
      ) || 0
    );
  });


  const [
    questRewardSaved,
    setQuestRewardSaved,
  ] = useState(false);


  const [
    runActive,
    setRunActive,
  ] = useState(false);

  const [
    runPoints,
    setRunPoints,
  ] =
    useState<RunPoint[]>([]);

  const [
    distanceKm,
    setDistanceKm,
  ] = useState(0);

  const [
    elapsedSeconds,
    setElapsedSeconds,
  ] = useState(0);

  const [
    gpsAccuracy,
    setGpsAccuracy,
  ] =
    useState<
      number | null
    >(null);

  const [
    gpsError,
    setGpsError,
  ] = useState("");

  const [
    runFinished,
    setRunFinished,
  ] = useState(false);


  const [
    questCheckpoints,
    setQuestCheckpoints,
  ] =
    useState<
      QuestCheckpoint[]
    >([]);


  const [
    runRecap,
    setRunRecap,
  ] =
    useState<
      RunRecapType | null
    >(null);

  const [
    recapLoading,
    setRecapLoading,
  ] = useState(false);


  const gpsWatchId =
    useRef<
      number | null
    >(null);

  const timerId =
    useRef<
      ReturnType<
        typeof setInterval
      > | null
    >(null);

  const lastAcceptedPoint =
    useRef<
      RunPoint | null
    >(null);


  const playerLevel =
    getPlayerLevel(
      totalXp
    );

  const unlockedBadges =
    getUnlockedBadges(
      completedQuestCount,
      verifiedPhotoCount
    );


  const averagePace =
    distanceKm > 0
      ? elapsedSeconds /
        60 /
        distanceKm
      : 0;


  async function generateQuest() {
    try {
      setLoading(true);
      setError("");
      setQuest(null);

      const response =
        await fetch(
          "/api/quest",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                duration,
                difficulty,
                mode,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Failed to generate quest"
        );
      }

      setCompletedChallenges(
        []
      );

      setPhotoPreview(
        null
      );

      setPhotoResult(
        null
      );

      setQuestRewardSaved(
        false
      );

      setQuestCheckpoints(
        []
      );

      setQuest(
        data.quest
      );
    } catch (error) {
      console.error(
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setLoading(
        false
      );
    }
  }


  function recordQuestCheckpoint(
    type: string,
    title: string
  ) {
    const latestPoint =
      runPoints[
        runPoints.length -
          1
      ];

    if (!latestPoint) {
      return;
    }

    const alreadyRecorded =
      questCheckpoints.some(
        (checkpoint) =>
          checkpoint.type ===
          type
      );

    if (
      alreadyRecorded
    ) {
      return;
    }

    const checkpoint:
      QuestCheckpoint = {
        type,
        title,

        latitude:
          latestPoint.latitude,

        longitude:
          latestPoint.longitude,

        timestamp:
          Date.now(),

        distanceKm,
      };

    setQuestCheckpoints(
      (current) => [
        ...current,
        checkpoint,
      ]
    );
  }


  function saveQuestCompletion(
    completed: string[]
  ) {
    if (!quest) {
      return;
    }

    if (
      completed.length ===
        4 &&
      !questRewardSaved
    ) {
      let earnedXp = 0;

      Object.values(
        quest.challenges
      ).forEach(
        (challenge) => {
          if (
            completed.includes(
              challenge.type
            )
          ) {
            earnedXp +=
              challenge.xp;
          }
        }
      );

      earnedXp +=
        quest.completionBonus;


      setTotalXp(
        (current) => {
          const updated =
            current +
            earnedXp;

          localStorage.setItem(
            STORAGE_KEYS.TOTAL_XP,
            String(updated)
          );

          return updated;
        }
      );


      setCompletedQuestCount(
        (current) => {
          const updated =
            current + 1;

          localStorage.setItem(
            STORAGE_KEYS.COMPLETED_QUESTS,
            String(updated)
          );

          return updated;
        }
      );


      setQuestRewardSaved(
        true
      );
    }
  }


  function toggleChallenge(
    type: string
  ) {
    if (!quest) {
      return;
    }

    let updatedChallenges:
      string[];


    if (
      completedChallenges.includes(
        type
      )
    ) {
      updatedChallenges =
        completedChallenges.filter(
          (item) =>
            item !== type
        );

      setQuestCheckpoints(
        (current) =>
          current.filter(
            (checkpoint) =>
              checkpoint.type !==
              type
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
            item.type ===
            type
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


  function getEarnedXp() {
    if (!quest) {
      return 0;
    }

    let earned = 0;

    Object.values(
      quest.challenges
    ).forEach(
      (challenge) => {
        if (
          completedChallenges.includes(
            challenge.type
          )
        ) {
          earned +=
            challenge.xp;
        }
      }
    );

    if (
      completedChallenges.length ===
      4
    ) {
      earned +=
        quest.completionBonus;
    }

    return earned;
  }


  function handlePhotoUpload(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setError(
        "Please select an image file."
      );

      return;
    }

    const reader =
      new FileReader();

    reader.onloadend =
      () => {
        const result =
          reader.result;

        if (
          typeof result ===
          "string"
        ) {
          setPhotoPreview(
            result
          );

          setPhotoResult(
            null
          );
        }
      };

    reader.readAsDataURL(
      file
    );
  }


  async function verifyPhoto() {
    if (
      !quest ||
      !photoPreview
    ) {
      return;
    }

    try {
      setPhotoVerifying(
        true
      );

      setError("");

      setPhotoResult(
        null
      );


      const response =
        await fetch(
          "/api/verify-photo",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                challenge:
                  quest
                    .challenges
                    .photo
                    .instruction,

                image:
                  photoPreview,
              }),
          }
        );


      const data =
        await response.json();


      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Photo verification failed"
        );
      }


      setPhotoResult(
        data.verification
      );


      if (
        data.verification
          .verified &&
        !completedChallenges.includes(
          "photo"
        )
      ) {
        const updatedChallenges =
          [
            ...completedChallenges,
            "photo",
          ];

        setCompletedChallenges(
          updatedChallenges
        );


        recordQuestCheckpoint(
          "photo",
          quest.challenges
            .photo.title
        );


        setVerifiedPhotoCount(
          (current) => {
            const updated =
              current + 1;

            localStorage.setItem(
              STORAGE_KEYS.VERIFIED_PHOTOS,
              String(updated)
            );

            return updated;
          }
        );


        saveQuestCompletion(
          updatedChallenges
        );
      }
    } catch (error) {
      console.error(
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Photo verification failed"
      );
    } finally {
      setPhotoVerifying(
        false
      );
    }
  }


  function startRun() {
    if (
      !navigator.geolocation
    ) {
      setGpsError(
        "Geolocation is not supported by this browser."
      );

      return;
    }

    setGpsError("");

    setRunPoints([]);

    setDistanceKm(0);

    setElapsedSeconds(
      0
    );

    lastAcceptedPoint.current =
      null;

    setGpsAccuracy(
      null
    );

    setRunFinished(
      false
    );

    setRunRecap(null);


    const startTime =
      Date.now();

    setRunActive(true);


    timerId.current =
      setInterval(
        () => {
          setElapsedSeconds(
            Math.floor(
              (
                Date.now() -
                startTime
              ) / 1000
            )
          );
        },
        1000
      );


    gpsWatchId.current =
      navigator.geolocation
        .watchPosition(
          (position) => {
            const point:
              RunPoint = {
                latitude:
                  position
                    .coords
                    .latitude,

                longitude:
                  position
                    .coords
                    .longitude,

                accuracy:
                  position
                    .coords
                    .accuracy,

                timestamp:
                  position.timestamp,
              };


            setGpsAccuracy(
              position
                .coords
                .accuracy
            );


            const previousPoint =
              lastAcceptedPoint
                .current;


            const accepted =
              shouldAcceptGpsPoint(
                previousPoint,
                point
              );


            if (!accepted) {
              console.log(
                "GPS point rejected",
                {
                  accuracy:
                    point.accuracy,

                  latitude:
                    point.latitude,

                  longitude:
                    point.longitude,
                }
              );

              return;
            }


            if (
              previousPoint
            ) {
              const addedDistance =
                calculateDistanceKm(
                  previousPoint.latitude,
                  previousPoint.longitude,
                  point.latitude,
                  point.longitude
                );


              setDistanceKm(
                (
                  currentDistance
                ) =>
                  currentDistance +
                  addedDistance
              );
            }


            lastAcceptedPoint.current =
              point;


            setRunPoints(
              (
                currentPoints
              ) => [
                ...currentPoints,
                point,
              ]
            );
          },


          (error) => {
            console.error(
              "GPS error:",
              error
            );

            if (
              error.code === 1
            ) {
              setGpsError(
                "Location permission was denied."
              );
            } else if (
              error.code === 2
            ) {
              setGpsError(
                "Your location could not be determined."
              );
            } else if (
              error.code === 3
            ) {
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
            enableHighAccuracy:
              true,

            maximumAge: 0,

            timeout:
              GPS_CONFIG.GEOLOCATION_TIMEOUT_MS,
          }
        );
  }


  function stopRun() {
    if (
      gpsWatchId.current !==
      null
    ) {
      navigator.geolocation.clearWatch(
        gpsWatchId.current
      );

      gpsWatchId.current =
        null;
    }


    if (
      timerId.current !==
      null
    ) {
      clearInterval(
        timerId.current
      );

      timerId.current =
        null;
    }


    setRunActive(false);

    setRunFinished(true);
  }


  async function generateRunRecap() {
    if (!quest) {
      return;
    }

    try {
      setRecapLoading(
        true
      );

      setRunRecap(
        null
      );


      const completedChallengeDetails =
        Object.values(
          quest.challenges
        )
          .filter(
            (challenge) =>
              completedChallenges.includes(
                challenge.type
              )
          )
          .map(
            (challenge) => ({
              type:
                challenge.type,

              title:
                challenge.title,

              instruction:
                challenge.instruction,
            })
          );


      const checkpointDetails =
        questCheckpoints.map(
          (checkpoint) => ({
            type:
              checkpoint.type,

            title:
              checkpoint.title,

            distanceKm:
              checkpoint.distanceKm.toFixed(
                2
              ),
          })
        );


      const response =
        await fetch(
          "/api/run-recap",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                distanceKm:
                  distanceKm.toFixed(
                    2
                  ),

                elapsedTime:
                  formatTime(
                    elapsedSeconds
                  ),

                averagePace:
                  `${formatPace(
                    averagePace
                  )} /km`,

                questTitle:
                  quest.title,

                completedChallenges:
                  completedChallengeDetails,

                checkpoints:
                  checkpointDetails,

                photoObservation:
                  photoResult
                    ?.verified
                    ? photoResult.observation
                    : null,
              }),
          }
        );


      const data =
        await response.json();


      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Failed to generate recap"
        );
      }


      setRunRecap(
        data.recap
      );
    } catch (error) {
      console.error(
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to generate run recap"
      );
    } finally {
      setRecapLoading(
        false
      );
    }
  }


  return (
    <main className="min-h-screen bg-zinc-950 text-white">

      <div className="mx-auto max-w-4xl px-6 py-12">

        <Header />


        <PlayerProfile
          totalXp={
            totalXp
          }
          playerLevel={
            playerLevel
          }
        />


        <BadgeList
          badges={
            unlockedBadges
          }
        />


        <QuestBuilder
          duration={
            duration
          }
          difficulty={
            difficulty
          }
          mode={
            mode
          }
          loading={
            loading
          }
          onDurationChange={
            setDuration
          }
          onDifficultyChange={
            setDifficulty
          }
          onModeChange={
            setMode
          }
          onGenerateQuest={
            generateQuest
          }
        />


        {error && (
          <div className="mt-6 rounded-xl border border-red-900 bg-red-950 p-4 text-red-300">
            {error}
          </div>
        )}


        <QuestView
          quest={
            quest
          }
          completedChallenges={
            completedChallenges
          }
          earnedXp={
            getEarnedXp()
          }
          runActive={
            runActive
          }
          photoPreview={
            photoPreview
          }
          photoResult={
            photoResult
          }
          photoVerifying={
            photoVerifying
          }
          onToggleChallenge={
            toggleChallenge
          }
          onPhotoUpload={
            handlePhotoUpload
          }
          onVerifyPhoto={
            verifyPhoto
          }
        />


        <RunTracker
          runActive={
            runActive
          }
          elapsedSeconds={
            elapsedSeconds
          }
          distanceKm={
            distanceKm
          }
          averagePace={
            averagePace
          }
          gpsAccuracy={
            gpsAccuracy
          }
          gpsError={
            gpsError
          }
          runPoints={
            runPoints
          }
          questCheckpoints={
            questCheckpoints
          }
          completedChallenges={
            completedChallenges
          }
          hasQuest={
            Boolean(quest)
          }
          onStartRun={
            startRun
          }
          onStopRun={
            stopRun
          }
        />


        <RunRecap
          runFinished={
            runFinished
          }
          distanceKm={
            distanceKm
          }
          elapsedSeconds={
            elapsedSeconds
          }
          averagePace={
            averagePace
          }
          recap={
            runRecap
          }
          recapLoading={
            recapLoading
          }
          onGenerateRecap={
            generateRunRecap
          }
        />

      </div>

    </main>
  );
}