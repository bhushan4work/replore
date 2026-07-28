"use client";

import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const freeFeatures = [
  "3 repository analyses / month",
  "100 AI chat messages",
  "Project overview",
  "Dependency graph",
  "Documentation generation",
  "Community support",
];

const proFeatures = [
  "Unlimited repository analyses",
  "Unlimited AI chat",
  "Unlimited documentation",
  "Export documentation",
  "Repository history",
  "Larger repositories",
  "Priority analysis",
  "Priority support",
];

export default function Pricing() {
  return (
    <section
      id="pricing"
      className="mx-auto max-w-7xl px-6 py-32"
    >
      {/* Heading */}
      <div className="mx-auto mb-20 max-w-5xl text-center text-xl">
        <Badge
          variant="outline"
          className="border-violet-500/40 bg-violet-500/10 text-violet-300"
        >
          Pricing
        </Badge>

        <h2 className="mt-6 text-5xl font-bold tracking-tight text-white md:text-6xl">
          Simple pricing for every developer
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-xl text-zinc-400">
          Start exploring repositories for free. Upgrade when you need unlimited
          AI analysis and higher usage limits.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
        {/* FREE */}
        <Card className="flex h-full flex-col border border-zinc-800 bg-zinc-950">
          <CardHeader>
            <CardTitle className="text-3xl italic text-white">
              Free
            </CardTitle>

            <div className="mt-4 flex items-end gap-2">
              <span className="text-6xl font-bold text-white">₹0</span>

              <span className="mb-2 text-zinc-500">/month</span>
            </div>

            <p className="text-zinc-400 text-lg">
              Perfect for trying out replore.
            </p>
          </CardHeader>

          <CardContent className="flex-1 space-y-4">
            {freeFeatures.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3"
              >
                <Check className="h-5 w-5 text-emerald-500" />

                <span className="text-zinc-300 text-xl">{item}</span>
              </div>
            ))}
          </CardContent>

          <CardFooter className="pt-6 bg-black">
            <Button
              className="h-14 text-xl w-full border-zinc-700"
            >
              Get Started
            </Button>
          </CardFooter>
        </Card>

        {/* PRO */}
        <Card className="flex h-full flex-col border border-zinc-800 bg-zinc-950">
          <Badge className="absolute right-5 top-5 bg-violet-600 hover:bg-violet-600">
            Most Popular
          </Badge>

          <CardHeader>
            <CardTitle className="text-3xl text-white">
              Pro
            </CardTitle>

            <div className="mt-4 flex items-end gap-2">
              <span className="text-6xl font-bold text-white">
                ₹399
              </span>

              <span className="mb-2 text-zinc-500">/month</span>
            </div>

            <p className="text-zinc-400 text-lg">
              Everything you need for serious repository exploration.
            </p>
          </CardHeader>

          <CardContent className="flex-1 space-y-4">
            {proFeatures.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3"
              >
                <Check className="h-5 w-5 text-emerald-500" />

                <span className="text-zinc-300 text-xl">{item}</span>
              </div>
            ))}
          </CardContent>

          <CardFooter className="pt-6 bg-black">
            <Button className="h-14 text-xl w-full bg-violet-600 text-white transition hover:bg-violet-500">
              Upgrade to Pro
            </Button>
          </CardFooter>
        </Card>
      </div>

      <p className="mt-10 text-center text-xl text-zinc-500">
        No credit card required. Cancel anytime.
      </p>
    </section>
  );
}