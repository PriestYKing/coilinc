"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MethodBadge } from "@/components/method-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Send,
  Trash2,
  X,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useRequestStore } from "@/lib/store";
import { toast } from "sonner";
import json5 from "json5";
import { Checkbox } from "@/components/ui/checkbox";

// Types
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

export default function Home() {
  const {
    requestTabs,
    activeRequestTab,
    addRequestTab,
    removeRequestTab,
    updateRequestTab,
    setActiveRequestTab,
  } = useRequestStore();

  const [copied, setCopied] = useState(false);
  const [bodyError, setBodyError] = useState<string | null>(null);

  // Get current active tab
  const currentTab = requestTabs.find((tab) => tab.id === activeRequestTab);
  useEffect(() => {
    if (!currentTab) {
      setBodyError(null);
      return;
    }
    if (currentTab.bodyType === "json") {
      try {
        JSON.parse(currentTab.body || "");
        setBodyError(null);
      } catch {
        setBodyError("Invalid JSON format");
      }
    } else {
      setBodyError(null);
    }
  }, [currentTab?.body, currentTab?.bodyType]);

  // Debug effect
  useEffect(() => {
    console.log("Current tab:", currentTab);
    if (currentTab?.response) {
      console.log("Response exists:", currentTab.response);
    }
  }, [currentTab]);

  // Add new request tab
  const addNewRequestTab = () => {
    const newId = Date.now().toString();
    addRequestTab({
      id: newId,
      name: "New Request",
      method: "GET",
      url: "",
      headers: [{ id: "h1", key: "", value: "", enabled: true }],
      params: [{ id: "p1", key: "", value: "", enabled: true }],
      bodyType: "none",
      body: "",
      authType: "none",
      authToken: "",
    });
    setActiveRequestTab(newId);
  };

  // Close tab
  const closeRequestTab = (id: string) => {
    removeRequestTab(id);
  };

  // Update tab field
  const updateTabField = (field: string, value: any) => {
    if (currentTab) {
      updateRequestTab(currentTab.id, { [field]: value });
    }
  };

  function beautifyBody(body: string): string {
    try {
      // JSON5 can parse many invalid JSONs, but outputs strict JSON
      return JSON.stringify(json5.parse(body), null, 2);
    } catch {
      // If it's really broken, try to add spacing for visibility
      return prettifyByLines(body);
    }
  }

  // fallback: add newlines/indents where possible
  function prettifyByLines(raw: string): string {
    return raw
      .replace(/([{}[\],])/g, "$1\n") // put braces, brackets, commas on their own line
      .replace(/\n\s*\n/g, "\n") // remove double empty lines
      .replace(/^ +| +$/gm, "") // trim leading/trailing spaces
      .replace(/\n{2,}/g, "\n"); // collapse consecutive newlines
  }
  // Add header
  const addHeader = () => {
    if (!currentTab) return;
    const newHeader = {
      id: `h${Date.now()}`,
      key: "",
      value: "",
      enabled: true,
    };
    updateRequestTab(currentTab.id, {
      headers: [...currentTab.headers, newHeader],
    });
  };

  // Update header
  const updateHeader = (id: string, field: keyof Header, value: any) => {
    if (!currentTab) return;
    updateRequestTab(currentTab.id, {
      headers: currentTab.headers.map((h) =>
        h.id === id ? { ...h, [field]: value } : h,
      ),
    });
  };

  // Delete header
  const deleteHeader = (id: string) => {
    if (!currentTab) return;
    updateRequestTab(currentTab.id, {
      headers: currentTab.headers.filter((h) => h.id !== id),
    });
  };

  // Add param
  const addParam = () => {
    if (!currentTab) return;
    const newParam = {
      id: `p${Date.now()}`,
      key: "",
      value: "",
      enabled: true,
    };
    updateRequestTab(currentTab.id, {
      params: [...currentTab.params, newParam],
    });
  };

  // Update param
  const updateParam = (id: string, field: keyof QueryParam, value: any) => {
    if (!currentTab) return;
    updateRequestTab(currentTab.id, {
      params: currentTab.params.map((p) =>
        p.id === id ? { ...p, [field]: value } : p,
      ),
    });
  };

  // Delete param
  const deleteParam = (id: string) => {
    if (!currentTab) return;
    updateRequestTab(currentTab.id, {
      params: currentTab.params.filter((p) => p.id !== id),
    });
  };

  // Send request
  // Send request
  const sendRequest = async () => {
    if (!currentTab || !currentTab.url) {
      toast.error("Please enter a URL before sending the request.");
      return;
    }

    // Validate URL format
    try {
      new URL(currentTab.url);
    } catch {
      toast.error("Please enter a valid URL (e.g., https://api.example.com)");
      return;
    }

    console.log("Sending request...", currentTab);

    updateRequestTab(currentTab.id, { loading: true, response: undefined });

    try {
      const startTime = performance.now();

      // Build headers
      const headers: Record<string, string> = {};
      currentTab.headers
        .filter((h) => h.enabled && h.key)
        .forEach((h) => {
          headers[h.key] = h.value;
        });

      // Add auth header
      if (currentTab.authType === "bearer" && currentTab.authToken) {
        headers["Authorization"] = `Bearer ${currentTab.authToken}`;
      }

      // Add content-type for JSON body
      if (currentTab.bodyType === "json" && currentTab.body) {
        headers["Content-Type"] = "application/json";
      }

      // Build URL with params
      let url = currentTab.url;
      const enabledParams = currentTab.params.filter((p) => p.enabled && p.key);
      if (enabledParams.length > 0) {
        const params = new URLSearchParams();
        enabledParams.forEach((p) => params.append(p.key, p.value));
        const separator = url.includes("?") ? "&" : "?";
        url += `${separator}${params.toString()}`;
      }

      console.log("Fetching URL:", url);
      console.log("Headers:", headers);

      // Send request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await fetch(url, {
          method: currentTab.method,
          headers,
          body:
            currentTab.bodyType !== "none" && currentTab.body
              ? currentTab.body
              : undefined,
          mode: "cors",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const endTime = performance.now();

        console.log("Response received:", response);

        const responseText = await response.text();
        console.log("Response text:", responseText);

        // Get response headers
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        // Format JSON if possible
        let formattedBody = responseText;
        try {
          const parsed = JSON.parse(responseText);
          formattedBody = JSON.stringify(parsed, null, 2);
        } catch {
          console.log("Response is not JSON");
        }

        const apiResponse = {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          body: formattedBody,
          time: Math.round(endTime - startTime),
          size: new Blob([responseText]).size,
        };

        console.log("Setting response:", apiResponse);
        updateRequestTab(currentTab.id, { response: apiResponse });

        // Show success toast
        toast.info(
          `${response.status} ${response.statusText} • ${Math.round(endTime - startTime)}ms`,
        );
      } catch (fetchError: any) {
        clearTimeout(timeoutId);

        // Handle different types of fetch errors
        let errorMessage = "Unknown error occurred";
        let errorDetails = "";

        if (fetchError.name === "AbortError") {
          errorMessage = "Request timeout";
          errorDetails = "The request took too long to complete (>30s).";
        } else if (fetchError.message.includes("Failed to fetch")) {
          errorMessage = "Network error";
          errorDetails =
            "Could not connect to the server. This might be due to: CORS policy blocking the request  Network connectivity issues • Invalid URL or server not responding • Server not allowing cross-origin requests";
        } else if (fetchError.message.includes("CORS")) {
          errorMessage = "CORS error";
          errorDetails =
            "The server does not allow cross-origin requests from this application.";
        } else {
          errorMessage = fetchError.message || "Request failed";
          errorDetails = "Check the console for more details.";
        }

        const apiResponse = {
          status: 0,
          statusText: "Error",
          headers: {},
          body: JSON.stringify(
            {
              error: errorMessage,
              details: errorDetails,
              type: fetchError.name,
              timestamp: new Date().toISOString(),
            },
            null,
            2,
          ),
          time: 0,
          size: 0,
        };

        updateRequestTab(currentTab.id, { response: apiResponse });

        toast.error(errorDetails.split("\n")[0]);
      }
    } catch (error: any) {
      console.error("Request error:", error);

      const apiResponse = {
        status: 0,
        statusText: "Error",
        headers: {},
        body: JSON.stringify(
          {
            error: error.message || "Unknown error",
            details: "Check the console for more details.",
            timestamp: new Date().toISOString(),
          },
          null,
          2,
        ),
        time: 0,
        size: 0,
      };

      updateRequestTab(currentTab.id, { response: apiResponse });

      toast.error(error.message || "An unexpected error occurred.");
    } finally {
      updateRequestTab(currentTab.id, { loading: false });
    }
  };

  // Copy response
  const copyResponse = () => {
    if (currentTab?.response) {
      navigator.clipboard.writeText(currentTab.response.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Get status color
  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-green-600";
    if (status >= 300 && status < 400) return "text-blue-600";
    if (status >= 400 && status < 500) return "text-yellow-600";
    if (status >= 500) return "text-red-600";
    return "text-gray-600";
  };

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  };

  if (!currentTab) return null;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Requests</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        {/* Request Tabs - With Scroll Arrows */}
        <div className="flex items-center bg-background  border-b border-border w-full shrink-0 px-3">
          {/* Left Scroll Button */}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => {
              const container = document.getElementById("tabs-container");
              if (container) {
                container.scrollBy({ left: -200, behavior: "smooth" });
              }
            }}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {/* Tabs Container */}
          <div
            id="tabs-container"
            className="flex items-center gap-1 px-2 py-2 w-full overflow-x-auto scrollbar-hide"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <div className="flex items-center gap-1 min-w-max">
              {requestTabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-t-md cursor-pointer transition-colors whitespace-nowrap ${
                    activeRequestTab === tab.id
                      ? "bg-card border border-b-0 border-border"
                      : "bg-muted hover:bg-accent"
                  }`}
                  onClick={() => setActiveRequestTab(tab.id)}
                >
                  <MethodBadge method={tab.method} />
                  <span className="text-sm font-medium truncate max-w-[120px]">
                    {tab.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeRequestTab(tab.id);
                    }}
                    className="hover:bg-slate-300 rounded p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={addNewRequestTab}
                className="ml-2"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Right Scroll Button */}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => {
              const container = document.getElementById("tabs-container");
              if (container) {
                container.scrollBy({ left: 200, behavior: "smooth" });
              }
            }}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background">
          <div className="p-4 md:p-6 w-full max-w-full mx-auto space-y-4">
            {/* Request Card */}
            <Card className="shadow border border-border w-full min-w-0 bg-card text-card-foreground">
              <CardHeader className="pb-4 border-b border-border">
                <Input
                  placeholder="Request Name"
                  className="text-lg font-semibold border-0 focus-visible:ring-0 px-0"
                  value={currentTab.name}
                  onChange={(e) => updateTabField("name", e.target.value)}
                />
              </CardHeader>
              <CardContent className="pt-6 space-y-6 overflow-x-hidden">
                {/* Method + URL + Send */}
                <div className="flex flex-col sm:flex-row gap-2 w-full min-w-0">
                  <Select
                    value={currentTab.method}
                    onValueChange={(value) => updateTabField("method", value)}
                  >
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue placeholder="Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                      <SelectItem value="HEAD">HEAD</SelectItem>
                      <SelectItem value="OPTIONS">OPTIONS</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    type="text"
                    placeholder="https://api.example.com/endpoint"
                    className="flex-1 border-slate-300 focus:ring-2 focus:ring-blue-500 min-w-0"
                    value={currentTab.url}
                    onChange={(e) => updateTabField("url", e.target.value)}
                  />

                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                    onClick={sendRequest}
                    disabled={currentTab.loading}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {currentTab.loading ? "Sending..." : "Send"}
                  </Button>
                </div>

                {/* Request Tabs */}
                <Tabs defaultValue="headers" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="headers">Headers</TabsTrigger>
                    <TabsTrigger value="params">Params</TabsTrigger>
                    <TabsTrigger value="body">Body</TabsTrigger>
                    <TabsTrigger value="auth">Auth</TabsTrigger>
                  </TabsList>

                  {/* Headers Tab */}
                  <TabsContent
                    value="headers"
                    className="space-y-3 w-full min-w-0"
                  >
                    <Button variant="outline" size="sm" onClick={addHeader}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Header
                    </Button>
                    <div className="space-y-2 w-full">
                      {currentTab.headers.map((header) => (
                        <div
                          key={header.id}
                          className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full min-w-0 mb-2"
                        >
                          <Checkbox
                            className="mt-2 sm:mt-0 shrink-0"
                            checked={header.enabled}
                            onCheckedChange={(checked) =>
                              updateHeader(header.id, "enabled", checked)
                            }
                          />

                          <Input
                            placeholder="Key"
                            className="flex-1 min-w-0"
                            value={header.key}
                            onChange={(e) =>
                              updateHeader(header.id, "key", e.target.value)
                            }
                          />
                          <Input
                            placeholder="Value"
                            className="flex-1 min-w-0"
                            value={header.value}
                            onChange={(e) =>
                              updateHeader(header.id, "value", e.target.value)
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteHeader(header.id)}
                            className="shrink-0"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Query Params Tab */}
                  <TabsContent
                    value="params"
                    className="space-y-3 w-full min-w-0"
                  >
                    <Button variant="outline" size="sm" onClick={addParam}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Parameter
                    </Button>
                    <div className="space-y-2 w-full">
                      {currentTab.params.map((param) => (
                        <div
                          key={param.id}
                          className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full min-w-0"
                        >
                          <Checkbox
                            className="mt-2 sm:mt-0 shrink-0"
                            checked={param.enabled}
                            onCheckedChange={(checked) =>
                              updateParam(param.id, "enabled", checked)
                            }
                          />

                          <Input
                            placeholder="Key"
                            className="flex-1 min-w-0"
                            value={param.key}
                            onChange={(e) =>
                              updateParam(param.id, "key", e.target.value)
                            }
                          />
                          <Input
                            placeholder="Value"
                            className="flex-1 min-w-0"
                            value={param.value}
                            onChange={(e) =>
                              updateParam(param.id, "value", e.target.value)
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteParam(param.id)}
                            className="shrink-0"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Body Tab */}
                  <TabsContent
                    value="body"
                    className="space-y-3 w-full min-w-0"
                  >
                    <Select
                      value={currentTab.bodyType}
                      onValueChange={(value) =>
                        updateTabField("bodyType", value)
                      }
                    >
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Body Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="raw">Raw</SelectItem>
                        <SelectItem value="form">Form Data</SelectItem>
                      </SelectContent>
                    </Select>
                    {currentTab.bodyType !== "none" && (
                      <Textarea
                        placeholder='{ "key": "value" }'
                        className="min-h-[200px] font-mono text-sm w-full"
                        value={currentTab.body}
                        onChange={(e) => {
                          const v = e.target.value;
                          updateTabField("body", v); // Zustand will update after re-render!
                          // Validate the string in this event, not what Zustand holds
                          if (currentTab.bodyType === "json") {
                            try {
                              JSON.parse(v);
                              setBodyError(null);
                            } catch (err: any) {
                              setBodyError(
                                err.message || "Invalid JSON format",
                              );
                            }
                          } else {
                            setBodyError(null);
                          }
                        }}
                      />
                    )}

                    {bodyError && (
                      <div className="text-red-600 text-xs mt-1">
                        {bodyError}
                      </div>
                    )}
                    {currentTab.bodyType === "json" && (
                      <Button
                        variant="default"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          const beautified = beautifyBody(currentTab.body);
                          updateTabField("body", beautified);
                          // Don't touch bodyError here—let user fix it after beautifying
                          toast.success(
                            "Beautified, Try to fix errors now, if any.",
                          );
                        }}
                      >
                        Beautify
                      </Button>
                    )}
                  </TabsContent>

                  {/* Auth Tab */}
                  <TabsContent
                    value="auth"
                    className="space-y-4 w-full min-w-0"
                  >
                    <Select
                      value={currentTab.authType}
                      onValueChange={(value) =>
                        updateTabField("authType", value)
                      }
                    >
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Auth Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Auth</SelectItem>
                        <SelectItem value="bearer">Bearer Token</SelectItem>
                        <SelectItem value="basic">Basic Auth</SelectItem>
                        <SelectItem value="apikey">API Key</SelectItem>
                      </SelectContent>
                    </Select>
                    {currentTab.authType === "bearer" && (
                      <div className="w-full">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Token
                        </label>
                        <Input
                          type="text"
                          placeholder="your-bearer-token"
                          className="border-slate-300 w-full"
                          value={currentTab.authToken}
                          onChange={(e) =>
                            updateTabField("authToken", e.target.value)
                          }
                        />
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Debug Panel */}
            {/*{currentTab && (
              <Card className="shadow border border-yellow-200 bg-yellow-50 w-full min-w-0">
                <CardContent className="pt-4">
                  <h4 className="font-bold text-sm mb-2">Debug Info:</h4>
                  <pre className="text-xs overflow-auto max-w-full">
                    {JSON.stringify(
                      {
                        hasResponse: !!currentTab.response,
                        responseStatus: currentTab.response?.status,
                        loading: currentTab.loading,
                        tabId: currentTab.id,
                        responseBodyLength:
                          currentTab.response?.body?.length || 0,
                      },
                      null,
                      2,
                    )}
                  </pre>
                </CardContent>
              </Card>
            )}*/}

            {/* Response Card */}
            {currentTab && currentTab.response && (
              <Card className="shadow border border-border w-full min-w-0">
                <CardHeader className="pb-4 border-b border-border">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 w-full">
                    <h3 className="text-lg font-semibold">Response</h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm w-full lg:w-auto">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Status:</span>
                        <span
                          className={`font-bold ${getStatusColor(
                            currentTab.response.status,
                          )}`}
                        >
                          {currentTab.response.status}{" "}
                          {currentTab.response.statusText}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Time:</span>
                        <span className="font-mono">
                          {currentTab.response.time}ms
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Size:</span>
                        <span className="font-mono">
                          {formatBytes(currentTab.response.size)}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyResponse}
                        className="w-full sm:w-auto"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 w-full overflow-x-hidden">
                  <Tabs defaultValue="body" className="w-full">
                    <TabsList className="w-full sm:w-auto">
                      <TabsTrigger value="body">Body</TabsTrigger>
                      <TabsTrigger value="headers">Headers</TabsTrigger>
                    </TabsList>

                    <TabsContent value="body" className="mt-4 w-full">
                      <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto w-full">
                        <pre className="text-sm text-slate-100 whitespace-pre-wrap break-words">
                          <code>{currentTab.response.body}</code>
                        </pre>
                      </div>
                    </TabsContent>

                    <TabsContent
                      value="headers"
                      className="mt-4 w-full overflow-x-hidden"
                    >
                      <div className="space-y-2 w-full">
                        {Object.entries(currentTab.response.headers).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="flex flex-col sm:flex-row gap-2 sm:gap-4 p-3 bg-slate-50 rounded-lg w-full"
                            >
                              <div className="font-medium text-blue-600 sm:w-1/3 break-words">
                                {key}
                              </div>
                              <div className="text-slate-700 flex-1 break-all">
                                {value}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
