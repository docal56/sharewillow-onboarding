"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type ReactNode,
  type Dispatch,
} from "react";
import { CompanyData, CSVRow, CSVSummary, PlanData } from "@/types";

const STORAGE_KEY = "sharewillow-onboarding";

interface OnboardingState {
  companyData: Partial<CompanyData>;
  csvData: CSVRow[];
  csvSummary: CSVSummary | null;
  anthropicApiKey: string;
  planData: PlanData | null;
  isGeneratingPlan: boolean;
}

type OnboardingAction =
  | { type: "HYDRATE"; payload: OnboardingState }
  | { type: "SET_COMPANY_DATA"; payload: Partial<CompanyData> }
  | { type: "SET_CSV_DATA"; payload: { rows: CSVRow[]; summary: CSVSummary } }
  | { type: "SET_API_KEY"; payload: string }
  | { type: "SET_PLAN_DATA"; payload: PlanData }
  | { type: "SET_GENERATING"; payload: boolean }
  | { type: "RESET" };

const initialState: OnboardingState = {
  companyData: {},
  csvData: [],
  csvSummary: null,
  anthropicApiKey: "",
  planData: null,
  isGeneratingPlan: false,
};

function onboardingReducer(
  state: OnboardingState,
  action: OnboardingAction
): OnboardingState {
  switch (action.type) {
    case "HYDRATE":
      return { ...action.payload, isGeneratingPlan: false };
    case "SET_COMPANY_DATA":
      return {
        ...state,
        companyData: { ...state.companyData, ...action.payload },
      };
    case "SET_CSV_DATA":
      return {
        ...state,
        csvData: action.payload.rows,
        csvSummary: action.payload.summary,
      };
    case "SET_API_KEY":
      return { ...state, anthropicApiKey: action.payload };
    case "SET_PLAN_DATA":
      return { ...state, planData: action.payload, isGeneratingPlan: false };
    case "SET_GENERATING":
      return { ...state, isGeneratingPlan: action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

const OnboardingContext = createContext<OnboardingState>(initialState);
const OnboardingDispatchContext = createContext<Dispatch<OnboardingAction>>(
  () => {}
);

function saveState(state: OnboardingState) {
  try {
    // Don't persist transient UI state or the API key
    const { isGeneratingPlan: _, anthropicApiKey: __, ...rest } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable — silently ignore
  }
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(onboardingReducer, initialState);

  // Hydrate from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        dispatch({ type: "HYDRATE", payload: { ...initialState, ...parsed } });
      }
    } catch {
      // Corrupt storage — ignore
    }
  }, []);

  // Persist on every state change (skip the initial render before hydration)
  const hydrated = useRef(false);
  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }
    saveState(state);
  }, [state]);

  return (
    <OnboardingContext.Provider value={state}>
      <OnboardingDispatchContext.Provider value={dispatch}>
        {children}
      </OnboardingDispatchContext.Provider>
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  return useContext(OnboardingContext);
}

export function useOnboardingDispatch() {
  return useContext(OnboardingDispatchContext);
}

export function useResetOnboarding() {
  const dispatch = useContext(OnboardingDispatchContext);
  return useCallback(() => {
    clearState();
    dispatch({ type: "RESET" });
  }, [dispatch]);
}
