import { User } from "discord.js";
import { ACCOUNT_AGE_REQUIREMENT_MS } from "../config/constants";
import { SOURCE_REGEX, TERMS_REGEX } from "../config/regex";
import { MessageCheckResult } from "../types";

export function isVerifiedMessage(content: string): boolean {
  const text = content || "";
  const lines = text.split("\n").length;
  return TERMS_REGEX.test(text) && SOURCE_REGEX.test(text) && lines >= 4;
}

export function isAccountOldEnough(user: User): boolean {
  const accountAge = Date.now() - user.createdAt.getTime();
  return accountAge >= ACCOUNT_AGE_REQUIREMENT_MS;
}

export function checkMessageRequirements(
  content: string,
  author: User,
): MessageCheckResult {
  const termsMatch = TERMS_REGEX.test(content);
  const sourceMatch = SOURCE_REGEX.test(content);
  const passesVerification = isVerifiedMessage(content);
  const isOldEnough = isAccountOldEnough(author);

  return {
    termsMatch,
    sourceMatch,
    passesVerification,
    isOldEnough,
    meetsAllConditions: passesVerification && isOldEnough,
  };
}

export function getFailureReason(content: string, author: User): string {
  const {
    termsMatch,
    sourceMatch: sourceMatch,
    isOldEnough,
  } = checkMessageRequirements(content, author);
  const reasons: string[] = [];

  if (!termsMatch) reasons.push("missing terms (she/her, woman)");
  if (!sourceMatch) reasons.push("missing source");
  if (!isOldEnough) {
    const days = Math.floor(
      (Date.now() - author.createdAt.getTime()) / (24 * 60 * 60 * 1000),
    );
    reasons.push(`account too young (${days} days old)`);
  }

  return reasons.join(", ");
}
