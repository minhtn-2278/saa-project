import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock next/navigation
const mockPush = vi.fn();
let mockPathname = "/";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
  usePathname: () => mockPathname,
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const t: Record<string, string> = {
      "nav.aboutSAA": "About SAA 2025",
      "nav.awardsInfo": "Awards Information",
      "nav.sunKudos": "Sun* Kudos",
      "nav.rules": "Community Standards",
      "nav.profile": "Profile",
      "nav.signOut": "Sign out",
      "login.footer.copyright": "Copyright Sun* 2025",
    };
    return t[key] ?? key;
  },
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, priority, ...rest } = props;
    return <img {...rest} data-fill={fill ? "true" : undefined} data-priority={priority ? "true" : undefined} />;
  },
}));

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signOut: vi.fn().mockResolvedValue({}) },
  }),
}));

const { AppHeader } = await import("@/components/shared/AppHeader");

describe("AppHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = "/";
  });

  it("renders logo, nav links, and controls", () => {
    render(<AppHeader />);

    expect(screen.getByAltText("SAA 2025")).toBeInTheDocument();
    expect(screen.getByText("About SAA 2025")).toBeInTheDocument();
    expect(screen.getByText("Awards Information")).toBeInTheDocument();
    expect(screen.getByText("Sun* Kudos")).toBeInTheDocument();
  });

  it("hides nav links when showNav=false", () => {
    render(<AppHeader showNav={false} />);

    expect(screen.queryByText("About SAA 2025")).not.toBeInTheDocument();
    expect(screen.queryByText("Awards Information")).not.toBeInTheDocument();
  });

  it("shows active link with aria-current='page' for current path", () => {
    mockPathname = "/";
    render(<AppHeader />);

    const activeLink = screen.getByText("About SAA 2025");
    expect(activeLink).toHaveAttribute("aria-current", "page");

    const otherLink = screen.getByText("Awards Information");
    expect(otherLink).not.toHaveAttribute("aria-current");
  });

  it("shows notification badge when count > 0", () => {
    render(<AppHeader notificationCount={5} />);

    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("hides notification badge when count is 0", () => {
    render(<AppHeader notificationCount={0} />);

    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("renders user avatar button with menu", () => {
    render(<AppHeader />);

    const avatarButton = screen.getByLabelText("User menu");
    expect(avatarButton).toBeInTheDocument();

    fireEvent.click(avatarButton);

    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Sign out")).toBeInTheDocument();
  });

  it("logo click scrolls to top when already on homepage", () => {
    mockPathname = "/";
    window.scrollTo = vi.fn();

    render(<AppHeader />);

    const logo = screen.getByAltText("SAA 2025").closest("a")!;
    fireEvent.click(logo);

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth",
    });
  });

  it("logo click navigates to / when on other page", () => {
    mockPathname = "/awards";
    render(<AppHeader />);

    const logo = screen.getByAltText("SAA 2025").closest("a")!;
    fireEvent.click(logo);

    expect(mockPush).toHaveBeenCalledWith("/");
  });
});
