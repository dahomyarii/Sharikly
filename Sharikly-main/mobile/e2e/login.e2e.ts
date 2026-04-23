import { device, element, by, expect as detoxExpect } from "detox";

describe("Auth smoke", () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("shows login form fields", async () => {
    await detoxExpect(element(by.id("login-email"))).toBeVisible();
    await detoxExpect(element(by.id("login-password"))).toBeVisible();
  });
});
