"use client";

import { useActionState } from "react";
import { Field } from "./field";
import type { ActionState, FormAction } from "../lib/types";

type AuthFormProps = {
  mode: "login" | "signup";
  action: FormAction;
};

const initialState: ActionState = {};

export function AuthForm({ mode, action }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const signingUp = mode === "signup";
  const errors = state.fieldErrors ?? {};
  const title = signingUp ? "Make something travel." : "Good to have you back.";

  return (
    <main className="md-auth-wrap">
      <aside className="md-auth-aside">
        <div className="md-brand" role="img" aria-label="MemeD">
          <span className="md-brand-mark" aria-hidden="true">M/D</span>
          <span>MemeD</span>
        </div>
        <div className="md-auth-pitch">
          <span className="md-eyebrow">Culture moves. Creators earn.</span>
          <h1>Make the<br />internet<br />work for you.</h1>
          <p>Good campaigns meet good creators. Bring your best idea; we’ll bring the brief.</p>
          <span className="md-auth-sticker">Ideas in. Rupees out.</span>
        </div>
        <span className="md-eyebrow">A marketplace for the moment</span>
      </aside>

      <section className="md-auth-main" aria-labelledby="auth-title">
        <div className="md-auth-content">
          <span className="md-eyebrow">{signingUp ? "Join the feed" : "Your next post starts here"}</span>
          <h2 id="auth-title">{title}</h2>
          <p className="md-page-intro" style={{ marginTop: 0, marginBottom: 27 }}>
            {signingUp
              ? "Set up your account and find your side of the campaign."
              : "Sign in to pick up where your campaigns left off."}
          </p>

          {state.error ? (
            <div className="md-notice md-notice--error" role="alert" style={{ marginBottom: 18 }}>
              <span aria-hidden="true">!</span><span>{state.error}</span>
            </div>
          ) : null}
          {state.message ? (
            <div className="md-notice md-notice--success" role="status" style={{ marginBottom: 18 }}>
              <span aria-hidden="true">✓</span><span>{state.message}</span>
            </div>
          ) : null}

          <form action={formAction} className="grid gap-5" aria-busy={pending}>
            {signingUp ? (
              <Field
                label="Your name"
                name="name"
                placeholder="How should we call you?"
                autoComplete="name"
                required
                error={errors.name?.[0]}
              />
            ) : null}
            <Field
              label="Email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              error={errors.email?.[0]}
            />
            <Field
              label="Password"
              name="password"
              type="password"
              placeholder={signingUp ? "At least 8 characters" : "Enter your password"}
              autoComplete={signingUp ? "new-password" : "current-password"}
              required
              error={errors.password?.[0]}
              hint={signingUp ? "Use 8 or more characters." : undefined}
            />

            {signingUp ? (
              <fieldset className="grid gap-2 border-0 p-0" aria-describedby={errors.role?.[0] ? "auth-role-error" : undefined}>
                <legend className="md-label mb-2">I’m here as a</legend>
                <div className="grid grid-cols-2 gap-3">
                  {(["creator", "brand"] as const).map((role) => (
                    <label className="md-choice" key={role}>
                      <input type="radio" name="role" value={role} required />
                      <span className="text-sm font-bold capitalize">{role}</span>
                    </label>
                  ))}
                </div>
                {errors.role?.[0] ? <span className="md-error" id="auth-role-error" role="alert">{errors.role[0]}</span> : null}
              </fieldset>
            ) : null}

            <button className="md-button md-button--lime mt-1 w-full" type="submit" disabled={pending}>
              {pending ? (
                <>
                  <span className="md-skeleton inline-block h-3 w-3 rounded-full" aria-hidden="true" />
                  {signingUp ? "Creating your account…" : "Signing you in…"}
                </>
              ) : (
                signingUp ? "Create account" : "Sign in"
              )}
            </button>
          </form>
          <p className="md-auth-links mt-6">
            {signingUp ? "Already part of MemeD?" : "New around here?"}{" "}
            <a href={signingUp ? "/login" : "/signup"}>
              {signingUp ? "Sign in" : "Create an account"}
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
