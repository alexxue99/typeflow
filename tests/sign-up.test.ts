import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isUsernameAvailable: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("../app/lib/auth/usernames", () => ({
  isUsernameAvailable: mocks.isUsernameAvailable,
}));

vi.mock("../app/lib/auth/server", () => ({
  getNeonAuth: () => ({ signUp: { email: mocks.signUp } }),
}));

import { signUpWithEmail } from "../app/auth/sign-up/actions";

function signupForm(username: string) {
  const form = new FormData();
  form.set("username", username);
  form.set("email", "person@example.com");
  form.set("password", "password123");
  return form;
}

describe("email sign up", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isUsernameAvailable.mockResolvedValue(true);
    mocks.signUp.mockResolvedValue({ error: null });
  });

  it("rejects a username that is already in use", async () => {
    mocks.isUsernameAvailable.mockResolvedValue(false);

    await expect(signUpWithEmail(null, signupForm("ExistingUser"))).resolves.toEqual({
      error: "That username is already in use.",
    });
    expect(mocks.isUsernameAvailable).toHaveBeenCalledWith("ExistingUser");
    expect(mocks.signUp).not.toHaveBeenCalled();
  });

  it("creates the account when the username is available", async () => {
    await expect(signUpWithEmail(null, signupForm("NewUser"))).resolves.toEqual({ success: true });

    expect(mocks.signUp).toHaveBeenCalledWith({
      name: "NewUser",
      email: "person@example.com",
      password: "password123",
    });
  });
});
