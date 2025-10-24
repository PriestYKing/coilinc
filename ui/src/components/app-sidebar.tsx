"use client";

import * as React from "react";
import {
  Settings2,
  Plus,
  Folder,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  FolderOpen,
  Download,
} from "lucide-react";

import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRequestStore } from "@/lib/store";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { MethodBadge } from "@/components/method-badge";
import { toast } from "sonner";
import { ImportDialog } from "./import-dialog";

const data = {
  user: {
    name: "Coil Inc.",
    email: "info@coil.com",
    avatar: "/avatars/shadcn.jpg",
  },
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const {
    requestTabs,
    activeRequestTab,
    setActiveRequestTab,
    addRequestTab,
    removeRequestTab,
    collections,
    addCollection,
    removeCollection,
    addRequestToCollection,
    removeRequestFromCollection,
  } = useRequestStore();

  const [newCollectionOpen, setNewCollectionOpen] = React.useState(false);
  const [newCollectionName, setNewCollectionName] = React.useState("");
  const [newCollectionDesc, setNewCollectionDesc] = React.useState("");
  const [importOpen, setImportOpen] = React.useState(false);

  const handleAddRequest = () => {
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

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return;

    const newCollection = {
      id: Date.now().toString(),
      name: newCollectionName,
      description: newCollectionDesc,
      requests: [],
      createdAt: new Date().toISOString(),
    };

    addCollection(newCollection);
    setNewCollectionName("");
    setNewCollectionDesc("");
    setNewCollectionOpen(false);

    toast.success(`"${newCollectionName}" has been created successfully.`);
  };

  const handleDeleteCollection = (id: string) => {
    const collection = collections.find((col) => col.id === id);
    removeCollection(id);

    toast(`"${collection?.name}" has been deleted.`);
  };

  const handleDeleteRequest = (id: string) => {
    if (requestTabs.length <= 1) {
      toast.error("Cannot delete request, You must have at least one request.");
      return;
    }

    const request = requestTabs.find((tab) => tab.id === id);
    removeRequestTab(id);

    toast.success(`"${request?.name}" has been deleted.`);
  };

  const handleAddRequestToCollection = (
    requestId: string,
    collectionId: string,
  ) => {
    addRequestToCollection(requestId, collectionId);

    const request = requestTabs.find((tab) => tab.id === requestId);
    const collection = collections.find((col) => col.id === collectionId);

    toast.success(`"${request?.name}" added to "${collection?.name}".`);
  };

  const handleRemoveRequestFromCollection = (
    requestId: string,
    collectionId: string,
  ) => {
    removeRequestFromCollection(requestId, collectionId);

    const request = requestTabs.find((tab) => tab.id === requestId);

    toast.success(`"${request?.name}" removed from collection.`);
  };

  // Get requests not in any collection
  const uncollectedRequests = requestTabs.filter((tab) => !tab.collectionId);

  return (
    <>
      <Sidebar {...props}>
        <SidebarHeader>
          <TeamSwitcher teams={[]} />
        </SidebarHeader>
        <SidebarContent>
          {/* Add Import Button */}
          <SidebarGroup>
            <SidebarGroupContent>
              <Button
                variant="outline"
                className="w-full justify-center"
                onClick={() => setImportOpen(true)}
              >
                <Download className="mr-2 h-4 w-4" />
                Import
              </Button>
            </SidebarGroupContent>
          </SidebarGroup>
          {/* Collections Section */}
          <SidebarGroup>
            <SidebarGroupLabel>
              <div className="flex items-center justify-between w-full">
                <span>Collections</span>
                <button
                  onClick={() => setNewCollectionOpen(true)}
                  className="flex h-5 w-5 items-center justify-center rounded-md hover:bg-accent"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {collections.map((collection) => {
                  const collectionRequests = requestTabs.filter((tab) =>
                    collection.requests.includes(tab.id),
                  );

                  return (
                    <Collapsible key={collection.id} defaultOpen>
                      <SidebarMenuItem>
                        <div className="flex items-center w-full">
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton className="flex-1">
                              <FolderOpen className="h-4 w-4 mr-2" />
                              <span className="truncate">
                                {collection.name}
                              </span>
                              <ChevronRight className="ml-auto transition-transform duration-200 peer-data-[state=open]:rotate-90" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent opacity-0 group-hover/item:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">More options</span>
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  handleDeleteCollection(collection.id)
                                }
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Collection
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {collectionRequests.map((request) => (
                              <SidebarMenuSubItem key={request.id}>
                                <div className="flex items-center w-full group/subitem">
                                  <SidebarMenuSubButton
                                    onClick={() =>
                                      setActiveRequestTab(request.id)
                                    }
                                    isActive={activeRequestTab === request.id}
                                    className="flex-1"
                                  >
                                    <div className="flex items-center gap-2 w-full min-w-0">
                                      <MethodBadge method={request.method} />
                                      <span className="truncate text-sm">
                                        {request.name}
                                      </span>
                                    </div>
                                  </SidebarMenuSubButton>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-accent opacity-0 group-hover/subitem:opacity-100 transition-opacity">
                                        <MoreHorizontal className="h-3 w-3" />
                                        <span className="sr-only">More</span>
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleRemoveRequestFromCollection(
                                            request.id,
                                            collection.id,
                                          )
                                        }
                                      >
                                        Remove from collection
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleDeleteRequest(request.id)
                                        }
                                        className="text-red-600"
                                        disabled={requestTabs.length <= 1}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Request
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Uncollected Requests Section */}
          <SidebarGroup>
            <SidebarGroupLabel>
              <div className="flex items-center justify-between w-full">
                <span>Requests</span>
                <button
                  onClick={handleAddRequest}
                  className="flex h-5 w-5 items-center justify-center rounded-md hover:bg-accent"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {uncollectedRequests.map((request) => (
                  <SidebarMenuItem key={request.id}>
                    <div className="flex items-center w-full group/item">
                      <SidebarMenuButton
                        onClick={() => setActiveRequestTab(request.id)}
                        isActive={activeRequestTab === request.id}
                        tooltip={request.name}
                        className="flex-1"
                      >
                        <div className="flex items-center gap-2 w-full min-w-0">
                          <MethodBadge method={request.method} />
                          <span className="truncate text-sm">
                            {request.name}
                          </span>
                        </div>
                      </SidebarMenuButton>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">More options</span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {collections.length > 0 && (
                            <>
                              <DropdownMenuItem
                                disabled
                                className="text-xs text-muted-foreground"
                              >
                                Add to collection
                              </DropdownMenuItem>
                              {collections.map((col) => (
                                <DropdownMenuItem
                                  key={col.id}
                                  onClick={() =>
                                    handleAddRequestToCollection(
                                      request.id,
                                      col.id,
                                    )
                                  }
                                >
                                  <Folder className="h-4 w-4 mr-2" />
                                  {col.name}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDeleteRequest(request.id)}
                            className="text-red-600"
                            disabled={requestTabs.length <= 1}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Request
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Settings Section */}
          {/*<SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Settings2 className="h-4 w-4" />
                  <span>General</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>*/}
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
        <SidebarRail />

        {/* New Collection Dialog */}
        <Dialog open={newCollectionOpen} onOpenChange={setNewCollectionOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Collection</DialogTitle>
              <DialogDescription>
                Add a new collection to organize your requests.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Collection Name</Label>
                <Input
                  id="name"
                  placeholder="My API Collection"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreateCollection();
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Collection description..."
                  value={newCollectionDesc}
                  onChange={(e) => setNewCollectionDesc(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setNewCollectionOpen(false);
                  setNewCollectionName("");
                  setNewCollectionDesc("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCollection}
                disabled={!newCollectionName.trim()}
              >
                Create Collection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Sidebar>
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </>
  );
}
