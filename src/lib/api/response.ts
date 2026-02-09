import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function validationErrorResponse(error: ZodError) {
  return NextResponse.json(
    {
      error: "Validation error",
      details: error.flatten(),
    },
    { status: 400 },
  );
}

export function badRequestResponse(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFoundResponse(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function internalErrorResponse() {
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 },
  );
}
