export type ConsoleAuthStep = "landing" | "password" | "enroll" | "verify";

export type ConsoleAuthChallenge = {
  challengeToken: string;
  nextStep: "TOTP_ENROLL" | "TOTP_VERIFY";
  qrCodeDataUrl?: string;
  manualEntryKey?: string;
};
