const OAUTH_CALLBACK_PATH = "/auth/callback";
const DEFAULT_POST_LOGIN_PATH = "/dashboard";

function getSafeNextPath(nextPath: string) {
  return nextPath.startsWith("/") ? nextPath : DEFAULT_POST_LOGIN_PATH;
}

function buildOAuthRedirectTo(baseUrl: string, nextPath: string) {
  return `${baseUrl}${OAUTH_CALLBACK_PATH}?next=${encodeURIComponent(
    getSafeNextPath(nextPath),
  )}`;
}

export function getOAuthRedirectTo(nextPath = DEFAULT_POST_LOGIN_PATH) {
  if (typeof window !== "undefined") {
    return buildOAuthRedirectTo(window.location.origin, nextPath);
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return buildOAuthRedirectTo(process.env.NEXT_PUBLIC_APP_URL, nextPath);
  }

  return undefined;
}

export function getAuthErrorMessage(errorCode: string | null) {
  switch (errorCode) {
    case "oauth_callback":
      return "Google sign-in failed. Please try again.";
    case "oauth_provider":
      return "Google sign-in was canceled or denied.";
    default:
      return null;
  }
}
