// The production shape check. It is Naive's validator on requirement.schema.json.
// loadRequirement still checks the thirteen function ids when a bind runs. This file does not
// admit a term and it does not call the term engine.

import { Validator } from "naive-framework/src/records/validate.mjs";
import requirementSchema from "./schemas/requirement.schema.json" with { type: "json" };

const schemaId = "$id" in requirementSchema && typeof requirementSchema.$id === "string" ? requirementSchema.$id : "requirement.schema.json";
const schemas = new Map([[schemaId, requirementSchema]]);
const validator = new Validator(schemas);

/** True only when Naive's validator accepts the record and the function id is one of the thirteen. */
export function naiveRequirementCheck(functionIds: readonly string[]): { accepted(record: unknown): boolean } {
  return {
    accepted(record: unknown): boolean {
      const problems = validator.validate(JSON.parse(JSON.stringify(record)), requirementSchema, schemaId);
      if (problems.length > 0) return false;
      if (record === null || typeof record !== "object" || Array.isArray(record)) return false;
      const functionId = (record as { functionId?: unknown }).functionId;
      return typeof functionId === "string" && functionIds.includes(functionId);
    },
  };
}
