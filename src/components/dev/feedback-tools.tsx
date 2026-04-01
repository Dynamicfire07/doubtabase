"use client";

import { Agentation } from "agentation";
import { DialRoot, useDialKit } from "dialkit";
import { MessageSquareQuote, SlidersHorizontal } from "lucide-react";
import { useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function FeedbackTools() {
  const params = useDialKit("App Feedback", {
    authPanelBlur: [16, 0, 28, 1],
    authPanelRadius: [27, 18, 42, 1],
    authStageBlur: [12, 0, 24, 1],
    landingWorkbenchBlur: [14, 0, 28, 1],
    landingWorkbenchRadius: [32, 20, 46, 1],
  });

  useEffect(() => {
    const root = document.documentElement;
    const cssVars = {
      "--auth-panel-blur": `${params.authPanelBlur}px`,
      "--auth-panel-radius": `${params.authPanelRadius / 16}rem`,
      "--auth-stage-blur": `${params.authStageBlur}px`,
      "--landing-workbench-blur": `${params.landingWorkbenchBlur}px`,
      "--landing-workbench-radius": `${params.landingWorkbenchRadius / 16}rem`,
    };

    Object.entries(cssVars).forEach(([name, value]) => {
      root.style.setProperty(name, value);
    });

    return () => {
      Object.keys(cssVars).forEach((name) => {
        root.style.removeProperty(name);
      });
    };
  }, [
    params.authPanelBlur,
    params.authPanelRadius,
    params.authStageBlur,
    params.landingWorkbenchBlur,
    params.landingWorkbenchRadius,
  ]);

  return (
    <>
      <DialRoot position="bottom-left" defaultOpen={false} />
      <Agentation />
      <Card className="pointer-events-none fixed bottom-4 left-4 z-40 hidden max-w-xs border-white/70 bg-white/88 shadow-xl md:block">
        <CardHeader className="gap-3 p-4 pb-3">
          <CardTitle className="text-sm text-slate-950">Feedback mode is live</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0 text-sm text-slate-600">
          <div className="flex items-start gap-2">
            <MessageSquareQuote className="mt-0.5 size-4 shrink-0 text-sky-700" />
            <p>Use Agentation to click any UI element and copy precise feedback for follow-up edits.</p>
          </div>
          <div className="flex items-start gap-2">
            <SlidersHorizontal className="mt-0.5 size-4 shrink-0 text-sky-700" />
            <p>Use DialKit to tune the auth and landing surface feel before we lock the styling in.</p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
