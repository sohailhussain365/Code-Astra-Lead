import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useGetSearches,
  useDeleteSearch,
  getGetSearchesQueryKey,
  getGetLeadsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Trash2,
  MapPin,
  BarChart2,
  Users,
  Calendar,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Searches() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const { data: searches, isLoading } = useGetSearches();
  const deleteSearch = useDeleteSearch();

  const handleDelete = (id: number) => {
    deleteSearch.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Search and its leads deleted" });
          qc.invalidateQueries({ queryKey: getGetSearchesQueryKey() });
          qc.invalidateQueries({ queryKey: getGetLeadsQueryKey() });
        },
      }
    );
  };

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Search History</h1>
            <p className="text-sm text-muted-foreground mt-0.5">All your past lead searches</p>
          </div>
          <Button
            size="sm"
            onClick={() => setLocation("/search")}
            data-testid="btn-new-search"
          >
            <Search className="h-3.5 w-3.5 mr-1.5" />
            New Search
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : searches && searches.length > 0 ? (
          <div className="space-y-2">
            {searches
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .map((s) => (
                <div
                  key={s.id}
                  className="bg-card border border-border rounded-lg p-4 flex items-start gap-4"
                  data-testid={`search-item-${s.id}`}
                >
                  <div className="mt-0.5 text-primary">
                    <Search className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm truncate">{s.keyword}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {s.location}
                            {s.radius ? ` (${s.radius} km)` : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {s.leadCount} leads
                          </span>
                          {s.avgScore != null && (
                            <span className="flex items-center gap-1">
                              <BarChart2 className="h-3 w-3" />
                              Avg score: {s.avgScore.toFixed(0)}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(s.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                              data-testid={`btn-delete-search-${s.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this search?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will delete the search and all {s.leadCount} leads associated with it. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90"
                                onClick={() => handleDelete(s.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Search className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">No searches yet</p>
            <p className="text-xs mt-1">Start a new search to find leads in any area</p>
            <Button
              size="sm"
              className="mt-4"
              onClick={() => setLocation("/search")}
              data-testid="btn-start-search"
            >
              Start searching
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
