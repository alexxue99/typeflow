import { getNeonAuth } from "../../lib/auth/server";

export async function GET(request: Request) {
  await getNeonAuth().signOut();
  return Response.redirect(new URL("/", request.url));
}
