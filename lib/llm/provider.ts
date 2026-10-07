import "server-only";
import type {
  MessiDecision,
  PublicScenario,
  Tendencies,
} from "../football/types";
export type MessiScenarioInput = {
  scenario: PublicScenario;
  tendencies: Tendencies;
  seasonProfile: unknown[];
};
export interface LLMProvider {
  readonly name: string;
  readonly model: string;
  decideScenario(input: MessiScenarioInput): Promise<MessiDecision>;
}
