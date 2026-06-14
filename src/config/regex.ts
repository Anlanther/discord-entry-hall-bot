// Terms: woman, she, her, they, them
export const TERMS_REGEX: RegExp = /\b(woman|she|her|they|them)\b/i;

// Source detection
export const SOURCE_REGEX: RegExp =
  /\b(?:twitter|fair|ig|friend|browser|online|x|insta|reel(?:s)?|instagram|google|facebook|tiktok|youtube|reddit|snapchat|linkedin|pinterest|threads|discord)\b[\w-]*(?::\/\/)?[\w.-]*|@[\w.-]{2,}|social\s+media|chatgpt|googling|searching/i;
