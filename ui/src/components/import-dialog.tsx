"use client";

import { useState } from "react";
import { Upload, FileJson, Terminal, FileText, Folder } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { useRequestStore } from "@/lib/store";
import { toast } from "sonner";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const { importFromJSON, importFromPostman, importFromCurl, importFromText } =
    useRequestStore();
  const [isDragging, setIsDragging] = useState(false);
  const [curlInput, setCurlInput] = useState("");
  const [textInput, setTextInput] = useState("");

  const handleFileUpload = async (
    file: File,
    type: "json" | "postman" | "text",
  ) => {
    try {
      const text = await file.text();

      if (type === "text") {
        importFromText(text);
        toast.success("Content has been imported.");
      } else {
        const data = JSON.parse(text);

        if (type === "json") {
          importFromJSON(data);
          toast.success("Requests and collections have been imported.");
        } else if (type === "postman") {
          importFromPostman(data);
          toast.success(
            "Your Postman collection has been converted and imported.",
          );
        }
      }

      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to parse the file. Please check the format.");
    }
  };

  const handleDrop = (
    e: React.DragEvent,
    type: "json" | "postman" | "text",
  ) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file, type);
    }
  };

  const handleCurlImport = () => {
    try {
      if (!curlInput.trim()) {
        toast.error("Please paste a cURL command.");
        return;
      }

      importFromCurl(curlInput);
      toast.success("Request has been created from cURL command.");
      setCurlInput("");
      onOpenChange(false);
    } catch (error) {
      toast.error("Invalid cURL command format.");
    }
  };

  const handleTextImport = () => {
    try {
      if (!textInput.trim()) {
        toast.error("Please paste some content.");
        return;
      }

      importFromText(textInput);
      toast.success("Content has been imported.");
      setTextInput("");
      onOpenChange(false);
    } catch (error) {
      toast.error("Could not parse the content.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Requests</DialogTitle>
          <DialogDescription>
            Import requests from various formats: cURL, JSON, Postman
            collections, or text files.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="curl" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="curl">cURL</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
            <TabsTrigger value="postman">Postman</TabsTrigger>
            <TabsTrigger value="text">Text</TabsTrigger>
          </TabsList>

          {/* cURL Tab */}
          <TabsContent value="curl" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="curl-input">Paste cURL Command</Label>
              <Textarea
                id="curl-input"
                placeholder={`curl 'https://api.example.com/users' -H 'Authorization: Bearer token' -d '{"name":"John"}'`}
                value={curlInput}
                onChange={(e) => setCurlInput(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCurlImport} className="flex-1">
                <Terminal className="mr-2 h-4 w-4" />
                Import cURL
              </Button>
              <Button variant="outline" onClick={() => setCurlInput("")}>
                Clear
              </Button>
            </div>
          </TabsContent>

          {/* JSON Tab */}
          <TabsContent value="json" className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => handleDrop(e, "json")}
            >
              <FileJson className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <p className="text-sm text-slate-600 mb-2">
                Drag and drop JSON file here, or click to browse
              </p>
              <input
                type="file"
                accept=".json"
                className="hidden"
                id="json-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, "json");
                }}
              />
              <label htmlFor="json-upload">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </span>
                </Button>
              </label>
            </div>
            <p className="text-xs text-slate-500">
              Import requests and collections from CoilInc. JSON format.
            </p>
          </TabsContent>

          {/* Postman Tab */}
          <TabsContent value="postman" className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => handleDrop(e, "postman")}
            >
              <Folder className="mx-auto h-12 w-12 text-orange-400 mb-4" />
              <p className="text-sm text-slate-600 mb-2">
                Drag and drop Postman collection here, or click to browse
              </p>
              <input
                type="file"
                accept=".json"
                className="hidden"
                id="postman-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, "postman");
                }}
              />
              <label htmlFor="postman-upload">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </span>
                </Button>
              </label>
            </div>
            <p className="text-xs text-slate-500">
              Import Postman Collection v2.1 format. All requests, headers, and
              bodies will be converted.
            </p>
          </TabsContent>

          {/* Text Tab */}
          <TabsContent value="text" className="space-y-4">
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => handleDrop(e, "text")}
              >
                <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <p className="text-sm text-slate-600 mb-2">
                  Drag and drop text file here, or click to browse
                </p>
                <input
                  type="file"
                  accept=".txt,.json,.md"
                  className="hidden"
                  id="text-upload"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, "text");
                  }}
                />
                <label htmlFor="text-upload">
                  <Button variant="outline" className="cursor-pointer" asChild>
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      Choose File
                    </span>
                  </Button>
                </label>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or paste content
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="text-input">Paste Text Content</Label>
                <Textarea
                  id="text-input"
                  placeholder="Paste URLs, JSON, cURL commands, or any text..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleTextImport} className="flex-1">
                  <FileText className="mr-2 h-4 w-4" />
                  Import Text
                </Button>
                <Button variant="outline" onClick={() => setTextInput("")}>
                  Clear
                </Button>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Automatically detects format: cURL, JSON, URLs, or plain text.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
