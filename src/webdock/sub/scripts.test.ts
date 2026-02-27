import { expect } from "jsr:@std/expect/expect";
import { Webdock } from "../webdock.ts";

const client = new Webdock(false);
let testServerSlug: string;
let testScriptId: number;
let testScriptIdOnServer: number;

Deno.test({
  name: "Scripts API Integration Tests",
  async fn(t) {
    // Setup: Create a test server
    await t.step(
      "Setup: Create test server for script operations",
      async (t) => {
        const response = await client.servers.create({
          name: "test-script-server",
          locationId: "dk",
          slug: `server-${Math.random()}`,
          profileSlug: "wp-starter-2026",
          imageSlug: "webdock-ubuntu-jammy-cloud",
        });

        await t.step("should create server successfully", () => {
          expect(response.success).toBe(true);
        });

        if (!response.success) return;
        testServerSlug = response.data.body.slug;

        await client.waitForEvent(response.data.headers["x-callback-id"]);
      }
    );

    await t.step("list() - Retrieve all available scripts", async (t) => {
      const response = await client.scripts.list();

      await t.step("should return successful response", () => {
        expect(response.success).toBe(true);
      });

      if (!response.success) return;

      const scripts = response.data.body;

      await t.step("should return array of scripts", () => {
        expect(scripts).toBeInstanceOf(Array);
      });

      await t.step("should have valid script schema for all items", () => {
        scripts.forEach((script) => {
          expect(script).toMatchObject({
            id: expect.any(Number),
            name: expect.any(String),
            description: expect.any(String),
            filename: expect.any(String),
            content: expect.any(String),
          });
        });
      });
    });

    await t.step("create() - Create a new script", async (t) => {
      const testScript = {
        name: "test-script",
        filename: "test.sh",
        content: "echo 'Hello World'",
      };

      const response = await client.scripts.create(testScript);

      await t.step("should return successful response", () => {
        expect(response.success).toBe(true);
      });

      if (!response.success) return;

      const script = response.data.body;
      testScriptId = script.id;

      await t.step("should create script with correct properties", () => {
        expect(script).toMatchObject({
          id: expect.any(Number),
          name: testScript.name,
          description: expect.any(String),
          filename: testScript.filename,
          content: testScript.content,
        });
      });
    });

    await t.step("getById() - Retrieve specific script by ID", async (t) => {
      if (!testScriptId) return;

      const response = await client.scripts.getById({ scriptId: testScriptId });

      await t.step("should return successful response", () => {
        expect(response.success).toBe(true);
      });

      if (!response.success) return;

      const script = response.data.body;

      await t.step("should return script with correct id", () => {
        expect(script.id).toBe(testScriptId);
        expect(script.name).toBe("test-script");
        expect(script.filename).toBe("test.sh");
        expect(script.content).toBe("echo 'Hello World'");
        expect(script.description).toBeDefined();
      });
    });

    await t.step("update() - Modify existing script", async (t) => {
      if (!testScriptId) return;

      const updatedScript = {
        id: testScriptId,
        name: "updated-test-script",
        filename: "updated-test.sh",
        content: "echo 'Updated Test'",
      };

      const response = await client.scripts.update(updatedScript);

      await t.step("should return successful response", () => {
        expect(response.success).toBe(true);
      });

      if (!response.success) return;

      const script = response.data.body;

      await t.step("should update script with new values", () => {
        expect(script.id).toBe(testScriptId);
        expect(script.name).toBe(updatedScript.name);
        expect(script.filename).toBe(updatedScript.filename);
        expect(script.content).toBe(updatedScript.content);
        expect(script.description).toBeDefined();
      });
    });

    await t.step("createOnServer() - Deploy script to server", async (t) => {
      if (!testScriptId || !testServerSlug) return;

      const response = await client.scripts.createOnServer({
        scriptId: testScriptId,
        serverSlug: testServerSlug,
        path: "@/home/admin",
        makeScriptExecutable: true,
        executeImmediately: false,
      });

      await t.step("should return successful response", () => {
        expect(response.success).toBe(true);
      });

      if (response.success) {
        await client.waitForEvent(response.data.headers["x-callback-id"]);
      }
    });

    await t.step(
      "listOnServer() - List scripts deployed on server",
      async (t) => {
        if (!testServerSlug) return;

        const response = await client.scripts.listOnServer({
          serverSlug: testServerSlug,
        });

        await t.step("should return successful response", () => {
          expect(response.success).toBe(true);
        });

        if (!response.success) return;

        const scripts = response.data.body;

        await t.step("should return array of server scripts", () => {
          expect(scripts).toBeInstanceOf(Array);
        });

        const serverScript = scripts.find(
          (script) => script.name === "test-script"
        );
        if (!serverScript) return;
        testScriptIdOnServer = serverScript.id;
      }
    );

    await t.step("executeOnServer() - Run script on server", async (t) => {
      if (!testScriptIdOnServer || !testServerSlug) return;

      const response = await client.scripts.executeOnServer({
        serverSlug: testServerSlug,
        scriptID: testScriptIdOnServer,
      });

      await t.step("should return successful response", () => {
        expect(response.success).toBe(true);
      });

      if (response.success) {
        await client.waitForEvent(response.data.headers["x-callback-id"]);
      }
    });

    await t.step(
      "deleteScriptFromServer() - Remove script from server",
      async (t) => {
        if (!testScriptIdOnServer || !testServerSlug) return;

        const response = await client.scripts.deleteScriptFromServer({
          serverSlug: testServerSlug,
          scriptId: testScriptIdOnServer,
        });

        await t.step("should return successful response", () => {
          expect(response.success).toBe(true);
        });

        if (response.success) {
          await client.waitForEvent(response.data.headers["x-callback-id"]);
        }
      }
    );

    await t.step("delete() - Remove script from account", async (t) => {
      if (!testScriptId) return;

      const response = await client.scripts.delete({ id: testScriptId });

      await t.step("should return successful response", () => {
        expect(response.success).toBe(true);
      });

      // Verify script is deleted by trying to get it
      const getResponse = await client.scripts.getById({
        scriptId: testScriptId,
      });
      await t.step("should not find deleted script", () => {
        expect(getResponse.success).toBe(false);
      });
    });

    if (testServerSlug) {
      const deleteResponse = await client.servers.delete({
        serverSlug: testServerSlug,
      });
      if (deleteResponse.success) {
        await client.waitForEvent(deleteResponse.data.headers["x-callback-id"]);
      }
    }
  },
  sanitizeOps: false,
  sanitizeResources: false,
});
