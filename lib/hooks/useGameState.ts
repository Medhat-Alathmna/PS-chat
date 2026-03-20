"use client";

import { useState, useCallback, useEffect } from "react";
import { GameId, GameState, GameStatus, GameDifficulty, GameSessionSummary } from "@/lib/types/games";
// GameDifficulty kept for optional backward-compat fields in GameState/GameSessionSummary
import { getGameConfig } from "@/lib/data/games";
import { createGameSession, updateGameSession } from "@/lib/api/games-backend";

const STORAGE_KEY_PREFIX = "falastin_game_state_";

function getStorageKey(gameId: GameId, profileId?: string): string {
  return profileId
    ? `${STORAGE_KEY_PREFIX}${profileId}_${gameId}`
    : `${STORAGE_KEY_PREFIX}${gameId}`;
}

function createInitialState(gameId: GameId, difficulty?: GameDifficulty): GameState {
  const config = getGameConfig(gameId);
  return {
    gameId,
    score: 0,
    round: 1,
    totalRounds: config.rounds,
    correctAnswers: 0,
    wrongAnswers: 0,
    hintsUsed: 0,
    status: "playing",
    difficulty,
    startedAt: Date.now(),
  };
}

export function useGameState(
  gameId: GameId,
  difficulty?: GameDifficulty,
  profileId?: string,
  isAuthenticated?: boolean,
) {
  const [state, setState] = useState<GameState>(() => {
    // Try to resume from localStorage
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(getStorageKey(gameId, profileId));
        if (stored) {
          const parsed = JSON.parse(stored) as GameState;
          if (parsed.status === "playing") return parsed;
        }
      } catch {
        // ignore
      }
    }
    return createInitialState(gameId, difficulty);
  });

  const [summary, setSummary] = useState<GameSessionSummary | null>(null);

  // Persist to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(getStorageKey(gameId, profileId), JSON.stringify(state));
    }
  }, [state, gameId, profileId]);

  // Create backend session once when the game starts (status transitions to "playing")
  useEffect(() => {
    if (!isAuthenticated || !profileId || state.sessionId !== undefined) return;
    if (state.status !== "playing") return;

    createGameSession(profileId, gameId, state.difficulty).then((id) => {
      if (id) {
        setState((prev) => ({ ...prev, sessionId: id }));
      } else {
        // Mark as null so we don't retry on every render
        setState((prev) => ({ ...prev, sessionId: null }));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, profileId, gameId, state.status]);

  // Process a correct answer
  // advanceRound=false for games that use advance_round tool (avoids double increment)
  const onCorrectAnswer = useCallback((basePoints: number, advanceRound = true) => {
    setState((prev) => ({
      ...prev,
      score: prev.score + basePoints,
      correctAnswers: prev.correctAnswers + 1,
      ...(advanceRound ? {
        round: typeof prev.totalRounds === "number"
          ? Math.min(prev.round + 1, prev.totalRounds + 1)
          : prev.round + 1,
      } : {}),
    }));
  }, []);

  // Process a wrong answer
  // advanceRound=false for games that use advance_round tool (player retries same round)
  const onWrongAnswer = useCallback((advanceRound = true) => {
    setState((prev) => ({
      ...prev,
      wrongAnswers: prev.wrongAnswers + 1,
      ...(advanceRound ? {
        round: typeof prev.totalRounds === "number"
          ? Math.min(prev.round + 1, prev.totalRounds + 1)
          : prev.round + 1,
      } : {}),
    }));
  }, []);

  // Process a hint used
  const onHintUsed = useCallback((pointsDeduction: number) => {
    setState((prev) => ({
      ...prev,
      hintsUsed: prev.hintsUsed + 1,
      score: Math.max(0, prev.score - pointsDeduction),
    }));
  }, []);

  // Process round advance (creative games)
  const onRoundAdvance = useCallback((pointsEarned: number) => {
    setState((prev) => ({
      ...prev,
      score: prev.score + pointsEarned,
      round: typeof prev.totalRounds === "number"
        ? Math.min(prev.round + 1, prev.totalRounds + 1)
        : prev.round + 1,
    }));
  }, []);

  // End the game
  const onGameEnd = useCallback((totalScore: number, correctAnswers: number, totalRounds: number) => {
    const config = getGameConfig(gameId);
    const finishedAt = Date.now();

    setState((prev) => ({
      ...prev,
      score: totalScore,
      correctAnswers,
      status: "finished" as GameStatus,
      finishedAt,
    }));

    const correctRatio = totalRounds > 0 ? correctAnswers / totalRounds : 0;
    const gameSummary: GameSessionSummary = {
      gameId,
      score: totalScore,
      correctAnswers,
      totalRounds,
      hintsUsed: state.hintsUsed,
      difficulty: state.difficulty,
      duration: finishedAt - state.startedAt,
      bonusEarned: correctRatio >= 0.7,
      stickerUnlocked: correctRatio >= 0.7,
    };

    setSummary(gameSummary);

    // Sync final stats to backend (fire-and-forget)
    if (isAuthenticated && profileId && state.sessionId) {
      updateGameSession(profileId, state.sessionId, {
        score: totalScore,
        correctAnswers,
        wrongAnswers: state.wrongAnswers,
        hintsUsed: state.hintsUsed,
        status: "finished",
      });
    }

    // Clear saved state
    if (typeof window !== "undefined") {
      localStorage.removeItem(getStorageKey(gameId, profileId));
    }

    return gameSummary;
  }, [gameId, profileId, isAuthenticated, state.hintsUsed, state.difficulty, state.startedAt, state.sessionId, state.wrongAnswers]);

  // Reset game
  const resetGame = useCallback(() => {
    setState(createInitialState(gameId));
    setSummary(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(getStorageKey(gameId, profileId));
    }
  }, [gameId, profileId]);

  // city-explorer uses advance_round tool to handle round progression
  // (check_answer should NOT advance the round)
  const hasExplicitAdvanceRound = gameId === "city-explorer";

  // Process tool call results from AI
  const processToolResult = useCallback((toolName: string, result: Record<string, unknown>) => {
    switch (toolName) {
      case "check_answer": {
        const config = getGameConfig(gameId);
        if (result.correct) {
          onCorrectAnswer(result.pointsEarned as number || config.pointsPerCorrect, !hasExplicitAdvanceRound);
        } else {
          onWrongAnswer(!hasExplicitAdvanceRound);
        }
        break;
      }
      case "give_hint": {
        onHintUsed(result.pointsDeduction as number || 2);
        break;
      }
      case "advance_round": {
        onRoundAdvance(result.pointsEarned as number || 0);
        break;
      }
      case "end_game": {
        onGameEnd(
          result.totalScore as number || state.score,
          result.correctAnswers as number || state.correctAnswers,
          result.totalRounds as number || state.round
        );
        break;
      }
    }
  }, [gameId, hasExplicitAdvanceRound, onCorrectAnswer, onWrongAnswer, onHintUsed, onRoundAdvance, onGameEnd, state.score, state.correctAnswers, state.round]);

  return {
    state,
    summary,
    onCorrectAnswer,
    onWrongAnswer,
    onHintUsed,
    onRoundAdvance,
    onGameEnd,
    resetGame,
    processToolResult,
  };
}
