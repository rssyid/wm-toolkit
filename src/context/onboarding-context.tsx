"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { useAppState } from "@/context/app-state-context";
import { Project } from "@/types";
import {
  DEFAULT_ONBOARDING_STORAGE,
  ONBOARDING_STEPS,
  OnboardingDetectionContext,
  OnboardingStepId,
  OnboardingStepView,
  OnboardingStoragePayload,
  pickReferenceProject,
  readOnboardingStorage,
  writeOnboardingStorage,
} from "@/lib/onboarding-guide";

interface OnboardingContextType {
  hydrated: boolean;
  steps: OnboardingStepView[];
  completedCount: number;
  totalSteps: number;
  progressPercent: number;
  isAllCompleted: boolean;
  nextRecommendedStep: OnboardingStepView | null;
  referenceProject: Project | null;
  welcomeModalOpen: boolean;
  welcomeDismissed: boolean;
  dashboardWidgetHidden: boolean;
  openWelcomeModal: () => void;
  dismissWelcomeModal: () => void;
  toggleManualStep: (stepId: OnboardingStepId) => void;
  setDashboardWidgetHidden: (hidden: boolean) => void;
  resetOnboarding: () => void;
}

const FALLBACK_ONBOARDING_CONTEXT: OnboardingContextType = {
  hydrated: false,
  steps: [],
  completedCount: 0,
  totalSteps: ONBOARDING_STEPS.length,
  progressPercent: 0,
  isAllCompleted: false,
  nextRecommendedStep: null,
  referenceProject: null,
  welcomeModalOpen: false,
  welcomeDismissed: false,
  dashboardWidgetHidden: false,
  openWelcomeModal: () => {},
  dismissWelcomeModal: () => {},
  toggleManualStep: () => {},
  setDashboardWidgetHidden: () => {},
  resetOnboarding: () => {},
};

const OnboardingContext = createContext<OnboardingContextType>(
  FALLBACK_ONBOARDING_CONTEXT
);

export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  const {
    isLoading,
    activeUserId,
    userProfile,
    projects,
    afces,
    prs,
    vendorEvaluations,
    pos,
    goodsHandovers,
    uspks,
    technicalEvaluations,
    spkContracts,
    dailyProgress,
    weeklyProgress,
  } = useAppState();

  const [storage, setStorage] = useState<OnboardingStoragePayload>({
    ...DEFAULT_ONBOARDING_STORAGE,
  });
  const [hydratedForUserId, setHydratedForUserId] = useState<string | null>(
    null
  );
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);
  const autoOpenedUserRef = useRef<string | null>(null);

  const hydrated = Boolean(activeUserId && hydratedForUserId === activeUserId);

  // Hidrasi state onboarding per pengguna dari localStorage setelah mount di klien
  useEffect(() => {
    if (!activeUserId) {
      setStorage({ ...DEFAULT_ONBOARDING_STORAGE });
      setHydratedForUserId(null);
      setWelcomeModalOpen(false);
      autoOpenedUserRef.current = null;
      return;
    }

    const loaded = readOnboardingStorage(activeUserId);
    setStorage(loaded);
    setHydratedForUserId(activeUserId);
  }, [activeUserId]);

  const persistStorage = useCallback(
    (
      updater: (prev: OnboardingStoragePayload) => OnboardingStoragePayload
    ) => {
      setStorage((prev) => {
        const next = updater(prev);
        if (activeUserId) {
          writeOnboardingStorage(activeUserId, next);
        }
        return next;
      });
    },
    [activeUserId]
  );

  // Tandai kunjungan ke halaman Laporan sebagai selesai otomatis untuk Langkah 7
  useEffect(() => {
    if (!hydrated || !pathname.startsWith("/reports")) return;
    if (!storage.visitedReports) {
      persistStorage((prev) => ({
        ...prev,
        visitedReports: true,
      }));
    }
  }, [hydrated, pathname, storage.visitedReports, persistStorage]);

  const detectionContext: OnboardingDetectionContext = useMemo(
    () => ({
      activeUserId,
      userProfile,
      projects,
      afces,
      prs,
      vendorEvaluations,
      pos,
      goodsHandovers,
      uspks,
      technicalEvaluations,
      spkContracts,
      dailyProgress,
      weeklyProgress,
      visitedReports: storage.visitedReports,
    }),
    [
      activeUserId,
      userProfile,
      projects,
      afces,
      prs,
      vendorEvaluations,
      pos,
      goodsHandovers,
      uspks,
      technicalEvaluations,
      spkContracts,
      dailyProgress,
      weeklyProgress,
      storage.visitedReports,
    ]
  );

  const referenceProject = useMemo(
    () => pickReferenceProject(projects, activeUserId),
    [projects, activeUserId]
  );

  const steps: OnboardingStepView[] = useMemo(() => {
    const manualSet = new Set(storage.manualCompletedStepIds);
    return ONBOARDING_STEPS.map((step) => {
      const isAutoCompleted = step.detectCompleted(detectionContext);
      const isManualCompleted = manualSet.has(step.id);
      return {
        ...step,
        isAutoCompleted,
        isManualCompleted,
        isCompleted: isAutoCompleted || isManualCompleted,
        resolvedHref: step.resolveHref(detectionContext),
        resolvedActionLabel: step.actionLabel(detectionContext),
      };
    });
  }, [detectionContext, storage.manualCompletedStepIds]);

  const totalSteps = steps.length;
  const completedCount = useMemo(
    () => steps.filter((s) => s.isCompleted).length,
    [steps]
  );
  const progressPercent =
    totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;
  const isAllCompleted = totalSteps > 0 && completedCount === totalSteps;

  const nextRecommendedStep = useMemo(
    () => steps.find((s) => !s.isCompleted) ?? null,
    [steps]
  );

  // Munculkan modal sambutan sekali saat login pertama jika belum pernah dilewati
  useEffect(() => {
    if (
      !hydrated ||
      isLoading ||
      !activeUserId ||
      pathname === "/login" ||
      storage.welcomeDismissed ||
      isAllCompleted
    ) {
      return;
    }

    if (autoOpenedUserRef.current === activeUserId) {
      return;
    }

    autoOpenedUserRef.current = activeUserId;
    setWelcomeModalOpen(true);
  }, [
    hydrated,
    isLoading,
    activeUserId,
    pathname,
    storage.welcomeDismissed,
    isAllCompleted,
  ]);

  const openWelcomeModal = useCallback(() => {
    setWelcomeModalOpen(true);
  }, []);

  const dismissWelcomeModal = useCallback(() => {
    setWelcomeModalOpen(false);
    persistStorage((prev) => ({
      ...prev,
      welcomeDismissed: true,
      welcomeDismissedAt: prev.welcomeDismissedAt || new Date().toISOString(),
    }));
  }, [persistStorage]);

  const toggleManualStep = useCallback(
    (stepId: OnboardingStepId) => {
      persistStorage((prev) => {
        const exists = prev.manualCompletedStepIds.includes(stepId);
        const manualCompletedStepIds = exists
          ? prev.manualCompletedStepIds.filter((id) => id !== stepId)
          : [...prev.manualCompletedStepIds, stepId];
        return {
          ...prev,
          manualCompletedStepIds,
        };
      });
    },
    [persistStorage]
  );

  const setDashboardWidgetHidden = useCallback(
    (hidden: boolean) => {
      persistStorage((prev) => ({
        ...prev,
        dashboardWidgetHidden: hidden,
      }));
    },
    [persistStorage]
  );

  const resetOnboarding = useCallback(() => {
    persistStorage((prev) => ({
      ...prev,
      dashboardWidgetHidden: false,
      manualCompletedStepIds: [],
      visitedReports: false,
      welcomeDismissed: true,
    }));
  }, [persistStorage]);

  const value = useMemo<OnboardingContextType>(
    () => ({
      hydrated,
      steps,
      completedCount,
      totalSteps,
      progressPercent,
      isAllCompleted,
      nextRecommendedStep,
      referenceProject,
      welcomeModalOpen,
      welcomeDismissed: storage.welcomeDismissed,
      dashboardWidgetHidden: storage.dashboardWidgetHidden,
      openWelcomeModal,
      dismissWelcomeModal,
      toggleManualStep,
      setDashboardWidgetHidden,
      resetOnboarding,
    }),
    [
      hydrated,
      steps,
      completedCount,
      totalSteps,
      progressPercent,
      isAllCompleted,
      nextRecommendedStep,
      referenceProject,
      welcomeModalOpen,
      storage.welcomeDismissed,
      storage.dashboardWidgetHidden,
      openWelcomeModal,
      dismissWelcomeModal,
      toggleManualStep,
      setDashboardWidgetHidden,
      resetOnboarding,
    ]
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextType {
  return useContext(OnboardingContext);
}
