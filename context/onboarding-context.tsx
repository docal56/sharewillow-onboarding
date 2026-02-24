"use client";

import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
  type Dispatch,
} from "react";
import { CompanyData, CSVRow, CSVSummary, PlanData } from "@/types";

interface OnboardingState {
  companyData: Partial<CompanyData>;
  csvData: CSVRow[];
  csvSummary: CSVSummary | null;
  anthropicApiKey: string;
  planData: PlanData | null;
  isGeneratingPlan: boolean;
}

type OnboardingAction =
  | { type: "SET_COMPANY_DATA"; payload: Partial<CompanyData> }
  | { type: "SET_CSV_DATA"; payload: { rows: CSVRow[]; summary: CSVSummary } }
  | { type: "SET_API_KEY"; payload: string }
  | { type: "SET_PLAN_DATA"; payload: PlanData }
  | { type: "SET_GENERATING"; payload: boolean };

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
    default:
      return state;
  }
}

const OnboardingContext = createContext<OnboardingState>(initialState);
const OnboardingDispatchContext = createContext<Dispatch<OnboardingAction>>(
  () => {}
);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(onboardingReducer, initialState);

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
