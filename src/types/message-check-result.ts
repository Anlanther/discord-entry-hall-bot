export interface MessageCheckResult {
  termsMatch: boolean;
  sourceMatch: boolean;
  passesVerification: boolean;
  isOldEnough: boolean;
  meetsAllConditions: boolean;
}
