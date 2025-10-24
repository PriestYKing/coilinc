import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Header {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

interface QueryParam {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
  size: number;
}

interface RequestTab {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: Header[];
  params: QueryParam[];
  bodyType: string;
  body: string;
  authType: string;
  authToken: string;
  response?: ApiResponse;
  loading?: boolean;
  collectionId?: string; // Link to collection
}

interface Collection {
  id: string;
  name: string;
  description?: string;
  requests: string[]; // Array of request IDs
  createdAt: string;
}

interface RequestStore {
  requestTabs: RequestTab[];
  activeRequestTab: string;
  collections: Collection[];
  activeCollection: string | null;

  // Request operations
  addRequestTab: (tab: RequestTab) => void;
  removeRequestTab: (id: string) => void;
  updateRequestTab: (id: string, updates: Partial<RequestTab>) => void;
  setActiveRequestTab: (id: string) => void;

  // Collection operations
  addCollection: (collection: Collection) => void;
  removeCollection: (id: string) => void;
  updateCollection: (id: string, updates: Partial<Collection>) => void;
  setActiveCollection: (id: string | null) => void;
  addRequestToCollection: (requestId: string, collectionId: string) => void;
  removeRequestFromCollection: (
    requestId: string,
    collectionId: string,
  ) => void;

  // Import operations
  importFromJSON: (data: any) => void;
  importFromPostman: (data: any) => void;
  importFromCurl: (curlCommand: string) => void;
  importFromText: (text: string) => void;
}

export const useRequestStore = create<RequestStore>()(
  persist(
    (set, get) => ({
      requestTabs: [
        {
          id: "1",
          name: "New Request",
          method: "GET",
          url: "",
          headers: [{ id: "h1", key: "", value: "", enabled: true }],
          params: [{ id: "p1", key: "", value: "", enabled: true }],
          bodyType: "none",
          body: "",
          authType: "none",
          authToken: "",
        },
      ],
      activeRequestTab: "1",
      collections: [],
      activeCollection: null,

      // Request operations
      addRequestTab: (tab) =>
        set((state) => ({
          requestTabs: [...state.requestTabs, tab],
        })),

      removeRequestTab: (id) =>
        set((state) => {
          // Prevent deletion if it's the last request
          if (state.requestTabs.length <= 1) {
            console.warn("Cannot delete the last request");
            return state;
          }

          // Remove from collections
          const updatedCollections = state.collections.map((col) => ({
            ...col,
            requests: col.requests.filter((reqId) => reqId !== id),
          }));

          const remainingTabs = state.requestTabs.filter(
            (tab) => tab.id !== id,
          );

          return {
            requestTabs: remainingTabs,
            collections: updatedCollections,
            activeRequestTab:
              state.activeRequestTab === id && remainingTabs.length > 0
                ? remainingTabs[0].id
                : state.activeRequestTab,
          };
        }),

      updateRequestTab: (id, updates) =>
        set((state) => ({
          requestTabs: state.requestTabs.map((tab) =>
            tab.id === id ? { ...tab, ...updates } : tab,
          ),
        })),

      setActiveRequestTab: (id) => set({ activeRequestTab: id }),

      // Collection operations
      addCollection: (collection) =>
        set((state) => ({
          collections: [...state.collections, collection],
        })),

      removeCollection: (id) =>
        set((state) => {
          // Remove collectionId from all requests in this collection
          const collection = state.collections.find((col) => col.id === id);
          const updatedTabs = state.requestTabs.map((tab) =>
            collection?.requests.includes(tab.id)
              ? { ...tab, collectionId: undefined }
              : tab,
          );

          return {
            collections: state.collections.filter((col) => col.id !== id),
            requestTabs: updatedTabs,
            activeCollection:
              state.activeCollection === id ? null : state.activeCollection,
          };
        }),

      updateCollection: (id, updates) =>
        set((state) => ({
          collections: state.collections.map((col) =>
            col.id === id ? { ...col, ...updates } : col,
          ),
        })),

      setActiveCollection: (id) => set({ activeCollection: id }),

      addRequestToCollection: (requestId, collectionId) =>
        set((state) => ({
          collections: state.collections.map((col) =>
            col.id === collectionId && !col.requests.includes(requestId)
              ? { ...col, requests: [...col.requests, requestId] }
              : col,
          ),
          requestTabs: state.requestTabs.map((tab) =>
            tab.id === requestId ? { ...tab, collectionId } : tab,
          ),
        })),

      removeRequestFromCollection: (requestId, collectionId) =>
        set((state) => ({
          collections: state.collections.map((col) =>
            col.id === collectionId
              ? {
                  ...col,
                  requests: col.requests.filter((id) => id !== requestId),
                }
              : col,
          ),
          requestTabs: state.requestTabs.map((tab) =>
            tab.id === requestId ? { ...tab, collectionId: undefined } : tab,
          ),
        })),
      // Import from JSON (BlitzTest format)
      importFromJSON: (data: any) => {
        try {
          const { requests, collections } = data;

          if (requests && Array.isArray(requests)) {
            set((state) => ({
              requestTabs: [...state.requestTabs, ...requests],
            }));
          }

          if (collections && Array.isArray(collections)) {
            set((state) => ({
              collections: [...state.collections, ...collections],
            }));
          }
        } catch (error) {
          console.error("Import error:", error);
          throw new Error("Invalid import format");
        }
      },

      // Import from Postman Collection
      importFromPostman: (data: any) => {
        try {
          const convertPostmanToBlitzTest = (collection: any) => {
            const requests: any[] = [];
            const collectionId = Date.now().toString();

            const processItem = (item: any) => {
              if (item.request) {
                const requestId = `imported-${Date.now()}-${Math.random()}`;
                const method = item.request.method || "GET";
                const url =
                  typeof item.request.url === "string"
                    ? item.request.url
                    : item.request.url?.raw || "";

                // Convert headers
                const headers = (item.request.header || []).map(
                  (h: any, idx: number) => ({
                    id: `h${Date.now()}-${idx}`,
                    key: h.key,
                    value: h.value,
                    enabled: !h.disabled,
                  }),
                );

                // Convert query params
                const params = (item.request.url?.query || []).map(
                  (q: any, idx: number) => ({
                    id: `p${Date.now()}-${idx}`,
                    key: q.key,
                    value: q.value,
                    enabled: !q.disabled,
                  }),
                );

                // Convert body
                let bodyType = "none";
                let body = "";
                if (item.request.body) {
                  bodyType = item.request.body.mode || "none";
                  if (bodyType === "raw") {
                    body = item.request.body.raw || "";
                  } else if (bodyType === "formdata") {
                    bodyType = "form";
                  }
                }

                requests.push({
                  id: requestId,
                  name: item.name,
                  method,
                  url,
                  headers:
                    headers.length > 0
                      ? headers
                      : [{ id: "h1", key: "", value: "", enabled: true }],
                  params:
                    params.length > 0
                      ? params
                      : [{ id: "p1", key: "", value: "", enabled: true }],
                  bodyType,
                  body,
                  authType: "none",
                  authToken: "",
                  collectionId,
                });
              }

              // Process nested items
              if (item.item && Array.isArray(item.item)) {
                item.item.forEach(processItem);
              }
            };

            // Process collection items
            if (collection.item && Array.isArray(collection.item)) {
              collection.item.forEach(processItem);
            }

            return {
              requests,
              collection: {
                id: collectionId,
                name: collection.info?.name || "Imported Collection",
                description: collection.info?.description || "",
                requests: requests.map((r) => r.id),
                createdAt: new Date().toISOString(),
              },
            };
          };

          const { requests, collection } = convertPostmanToBlitzTest(data);

          set((state) => ({
            requestTabs: [...state.requestTabs, ...requests],
            collections: [...state.collections, collection],
          }));
        } catch (error) {
          console.error("Postman import error:", error);
          throw new Error("Invalid Postman collection format");
        }
      },

      // Import from cURL command
      importFromCurl: (curlCommand: string) => {
        try {
          const parseCurl = (curl: string) => {
            console.log("Original cURL:", curl);

            const requestId = `curl-${Date.now()}`;
            let method = "GET";
            let url = "";
            const headers: any[] = [];
            const params: any[] = [];
            let body = "";
            let bodyType = "none";

            // Step 1: Remove comments (everything after #)
            let normalized = curl
              .split("\n")
              .map((line) => {
                const commentIndex = line.indexOf("#");
                return commentIndex > -1
                  ? line.substring(0, commentIndex)
                  : line;
              })
              .join("\n");

            // Step 2: Remove backslash line continuations
            normalized = normalized.replace(/\\\s*\n\s*/g, " ");

            // Step 3: Normalize whitespace (but preserve JSON structure)
            normalized = normalized.replace(/\s+/g, " ").trim();

            console.log("Normalized cURL:", normalized);

            // Step 4: Extract method
            const methodMatch =
              normalized.match(/--request\s+([A-Z]+)/i) ||
              normalized.match(/-X\s+([A-Z]+)/i);
            if (methodMatch) {
              method = methodMatch[1].toUpperCase();
            }
            console.log("Method:", method);

            // Step 5: Extract URL (with query params)
            let urlMatch = normalized.match(/curl\s+['"]([^'"]+)['"]/);
            if (!urlMatch) {
              urlMatch = normalized.match(/curl\s+([^\s-]+)/);
            }
            if (!urlMatch) {
              urlMatch = normalized.match(/(https?:\/\/[^\s'"]+)/);
            }

            if (urlMatch) {
              const fullUrl = urlMatch[1];

              // Split URL and query params
              const urlParts = fullUrl.split("?");
              url = urlParts[0];

              if (urlParts[1]) {
                // Parse query parameters
                const queryString = urlParts[1];
                const queryPairs = queryString.split("&");

                queryPairs.forEach((pair, idx) => {
                  const [key, value] = pair.split("=");
                  if (key) {
                    params.push({
                      id: `p${Date.now()}-${idx}`,
                      key: decodeURIComponent(key),
                      value: decodeURIComponent(value || ""),
                      enabled: true,
                    });
                  }
                });
              }
            }
            console.log("URL:", url);
            console.log("Query Params:", params);

            // Step 6: Extract headers
            const headerRegex =
              /--header\s+["']([^"']+)["']|-H\s+["']([^"']+)["']/g;
            let headerMatch;
            let headerIndex = 0;

            while ((headerMatch = headerRegex.exec(normalized)) !== null) {
              const headerValue = headerMatch[1] || headerMatch[2];
              const colonIndex = headerValue.indexOf(":");

              if (colonIndex > -1) {
                const key = headerValue.substring(0, colonIndex).trim();
                const value = headerValue.substring(colonIndex + 1).trim();

                headers.push({
                  id: `h${Date.now()}-${headerIndex++}`,
                  key,
                  value,
                  enabled: true,
                });
              }
            }

            // Step 7: Extract cookies and add as header
            const cookieRegex = /--cookie\s+["']([^"']+)["']/g;
            let cookieMatch;
            const cookies: string[] = [];

            while ((cookieMatch = cookieRegex.exec(normalized)) !== null) {
              cookies.push(cookieMatch[1]);
            }

            if (cookies.length > 0) {
              headers.push({
                id: `h${Date.now()}-${headerIndex++}`,
                key: "Cookie",
                value: cookies.join("; "),
                enabled: true,
              });
            }

            console.log("Headers:", headers);

            // Step 8: Extract body (handles multi-line JSON)
            // Find --data or -d and extract everything until the next --flag
            let bodyMatch = null;

            // Try to find --data with quotes (single or double)
            bodyMatch = normalized.match(/--data\s+['"](.+?)['"](?=\s+--|$)/s);

            if (!bodyMatch) {
              bodyMatch = normalized.match(/-d\s+['"](.+?)['"](?=\s+--|$)/s);
            }

            if (!bodyMatch) {
              bodyMatch = normalized.match(
                /--data-raw\s+['"](.+?)['"](?=\s+--|$)/s,
              );
            }

            if (!bodyMatch) {
              bodyMatch = normalized.match(
                /--data-binary\s+['"](.+?)['"](?=\s+--|$)/s,
              );
            }

            if (bodyMatch) {
              body = bodyMatch[1];
              console.log("Raw body found:", body);

              // Try to parse and pretty-print JSON
              try {
                // Remove escaped newlines and normalize
                const cleanBody = body.replace(/\s+/g, " ").trim();

                const parsed = JSON.parse(cleanBody);
                body = JSON.stringify(parsed, null, 2);
                bodyType = "json";
                console.log("Parsed as JSON");
              } catch (e) {
                console.log("Body is not valid JSON, using raw:", e);
                bodyType = "raw";
              }
            } else {
              console.log("No body found");
            }

            console.log("Final Body:", body);
            console.log("Body Type:", bodyType);

            // Ensure we have at least empty default values
            if (headers.length === 0) {
              headers.push({ id: "h1", key: "", value: "", enabled: true });
            }

            if (params.length === 0) {
              params.push({ id: "p1", key: "", value: "", enabled: true });
            }

            const result = {
              id: requestId,
              name: `${method} ${url.split("/").pop() || "Request"}`,
              method,
              url,
              headers,
              params,
              bodyType,
              body,
              authType: "none",
              authToken: "",
            };

            console.log("Final result:", result);
            return result;
          };

          const request = parseCurl(curlCommand);

          // Validate that we at least have a URL
          if (!request.url) {
            throw new Error(
              "Could not extract URL from cURL command. Please check the format.",
            );
          }

          set((state) => ({
            requestTabs: [...state.requestTabs, request],
          }));

          return request;
        } catch (error) {
          console.error("cURL import error:", error);
          throw error;
        }
      },

      // Import from text file (tries to detect format)
      importFromText: (text: string) => {
        try {
          // Try to detect if it's cURL
          if (text.trim().startsWith("curl")) {
            get().importFromCurl(text);
            return;
          }

          // Try to parse as JSON
          try {
            const data = JSON.parse(text);

            // Check if it's Postman format
            if (data.info && data.item) {
              get().importFromPostman(data);
              return;
            }

            // Check if it's BlitzTest format
            if (data.requests || data.collections) {
              get().importFromJSON(data);
              return;
            }
          } catch {
            // Not JSON, treat as plain text
          }

          // Create a simple GET request with the text as URL or body
          const requestId = `text-${Date.now()}`;
          const isUrl =
            text.startsWith("http://") || text.startsWith("https://");

          const request = {
            id: requestId,
            name: `Text Import ${new Date().toLocaleString()}`,
            method: "GET",
            url: isUrl ? text.trim() : "",
            headers: [{ id: "h1", key: "", value: "", enabled: true }],
            params: [{ id: "p1", key: "", value: "", enabled: true }],
            bodyType: isUrl ? "none" : "raw",
            body: isUrl ? "" : text,
            authType: "none",
            authToken: "",
          };

          set((state) => ({
            requestTabs: [...state.requestTabs, request],
          }));
        } catch (error) {
          console.error("Text import error:", error);
          throw new Error("Could not parse text content");
        }
      },
    }),
    {
      name: "blitztest-storage",
    },
  ),
);
