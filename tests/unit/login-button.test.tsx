import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "button.text": "LOGIN With Google",
      "error.authFailed": "Login failed. Please try again.",
    };
    return translations[key] ?? key;
  },
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Supabase client
const mockSignInWithOAuth = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithOAuth: (...args: unknown[]) => mockSignInWithOAuth(...args),
    },
  }),
}));

const { LoginButton } = await import("@/components/login/LoginButton");

describe("LoginButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignInWithOAuth.mockResolvedValue({ error: null });
  });

  it("renders with correct text and Google icon", () => {
    render(<LoginButton />);
    expect(screen.getByText("LOGIN With Google")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /login with google/i })
    ).toBeInTheDocument();
  });

  it("has correct aria-label", () => {
    render(<LoginButton />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Login with Google account");
  });

  it("calls signInWithOAuth on click", async () => {
    render(<LoginButton />);
    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: expect.objectContaining({
        redirectTo: expect.stringContaining("/api/auth/callback"),
      }),
    });
  });

  it("sets aria-busy to true while loading", async () => {
    mockSignInWithOAuth.mockReturnValue(new Promise(() => {})); // never resolves
    render(<LoginButton />);
    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("disables button during loading", async () => {
    mockSignInWithOAuth.mockReturnValue(new Promise(() => {}));
    render(<LoginButton />);
    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(button).toBeDisabled();
  });

  it("displays error message with role='alert' on OAuth failure", async () => {
    mockSignInWithOAuth.mockResolvedValue({
      error: { message: "OAuth error" },
    });

    render(<LoginButton />);
    fireEvent.click(screen.getByRole("button"));

    const alert = await screen.findByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent("Login failed. Please try again.");
  });

  it("clears error on re-click", async () => {
    mockSignInWithOAuth
      .mockResolvedValueOnce({ error: { message: "fail" } })
      .mockReturnValueOnce(new Promise(() => {}));

    render(<LoginButton />);
    fireEvent.click(screen.getByRole("button"));

    await screen.findByRole("alert");

    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows error from URL search param", async () => {
    // Reset modules to allow re-mocking useSearchParams
    vi.resetModules();

    vi.doMock("next-intl", () => ({
      useTranslations: () => (key: string) => {
        const t: Record<string, string> = {
          "button.text": "LOGIN With Google",
          "error.authFailed": "Login failed. Please try again.",
        };
        return t[key] ?? key;
      },
    }));
    vi.doMock("next/navigation", () => ({
      useSearchParams: () => new URLSearchParams("error=auth_failed"),
    }));
    vi.doMock("@/lib/supabase/client", () => ({
      createClient: () => ({
        auth: { signInWithOAuth: vi.fn().mockResolvedValue({ error: null }) },
      }),
    }));

    const { LoginButton: ButtonWithError } = await import(
      "@/components/login/LoginButton"
    );
    render(<ButtonWithError />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Login failed. Please try again."
    );
  });
});
