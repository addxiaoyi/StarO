import { oauthProviderAuthServerMetadata } from "@better-auth/oauth-provider";
import { getAuth } from "@/lib/auth";

function metadataHandler(request: Request) {
  return oauthProviderAuthServerMetadata(getAuth())(request);
}

export const GET = metadataHandler;
export const HEAD = metadataHandler;
