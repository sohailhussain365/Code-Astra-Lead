import { useState, useMemo, useRef } from "react";
import { Layout } from "@/components/layout";
import { LeadScoreBadge } from "@/components/lead-score-badge";
import { LeadDetailSheet } from "@/components/lead-detail-sheet";
import {
  useGetLeads,
  useDeleteLead,
  useUpdateLead,
  useBulkUpdateLeads,
  getGetLeadsQueryKey,
  getGetAnalyticsSummaryQueryKey,
  getGetStageBreakdownQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Globe,
  Phone,
  Star,
  Trash2,
  ExternalLink,
  Filter,
  ChevronUp,
  ChevronDown,
  Users,
  ThumbsUp,
  ThumbsDown,
  PhoneMissed,
  MapPin,
  StickyNote,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SortKey = "leadScore" | "businessName" | "rating" | "reviewCount";
type SortDir = "asc" | "desc";

const STAGE_OPTIONS = [
  { value: "all", label: "All stages" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "interested", label: "Interested" },
  { value: "qualified", label: "Qualified" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

const STAGE_COLORS: Record<string, string> = {
  new: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  contacted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  interested: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  qualified: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  won: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  lost: "bg-red-500/20 text-red-400 border-red-500/30",
};

function StatusButtons({
  lead,
  onUpdate,
}: {
  lead: any;
  onUpdate: (id: number, patch: { outreachStatus?: string; stage?: string }) => void;
}) {
  const status = lead.outreachStatus;

  const toggle = (
    e: React.MouseEvent,
    newStatus: string,
    patch: { outreachStatus?: string; stage?: string }
  ) => {
    e.stopPropagation();
    if (status === newStatus) {
      onUpdate(lead.id, { outreachStatus: "" });
    } else {
      onUpdate(lead.id, patch);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        title="Interested"
        onClick={(e) =>
          toggle(e, "interested", { outreachStatus: "interested", stage: "interested" })
        }
        className={cn(
          "flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border transition-all",
          status === "interested"
            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
            : "bg-transparent text-muted-foreground border-border hover:border-emerald-500/40 hover:text-emerald-400"
        )}
      >
        <ThumbsUp className="h-3 w-3" />
      </button>
      <button
        title="Not Interested"
        onClick={(e) =>
          toggle(e, "not_interested", { outreachStatus: "not_interested", stage: "lost" })
        }
        className={cn(
          "flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border transition-all",
          status === "not_interested"
            ? "bg-red-500/20 text-red-400 border-red-500/40"
            : "bg-transparent text-muted-foreground border-border hover:border-red-500/40 hover:text-red-400"
        )}
      >
        <ThumbsDown className="h-3 w-3" />
      </button>
      <button
        title="Missed Call"
        onClick={(e) =>
          toggle(e, "call_missed", { outreachStatus: "call_missed", stage: "contacted" })
        }
        className={cn(
          "flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border transition-all",
          status === "call_missed"
            ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
            : "bg-transparent text-muted-foreground border-border hover:border-amber-500/40 hover:text-amber-400"
        )}
      >
        <PhoneMissed className="h-3 w-3" />
      </button>
    </div>
  );
}

function InlineNote({
  lead,
  onUpdate,
}: {
  lead: any;
  onUpdate: (id: number, patch: { notes: string }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(lead.notes ?? "");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleBlur = () => {
    setEditing(false);
    if (value !== (lead.notes ?? "")) {
      onUpdate(lead.id, { notes: value });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setValue(lead.notes ?? "");
      setEditing(false);
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
  };

  if (editing) {
    return (
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        rows={2}
        className="w-full text-xs bg-muted border border-primary/40 rounded px-2 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-primary min-w-[160px]"
        placeholder="Add a note…"
      />
    );
  }

  return (
    <div
      onClick={handleClick}
      className="flex items-start gap-1 cursor-pointer group min-w-[120px] max-w-[200px]"
      title="Click to edit note"
    >
      <StickyNote className="h-3 w-3 mt-0.5 text-muted-foreground/50 group-hover:text-primary/60 shrink-0 transition-colors" />
      {lead.notes ? (
        <span className="text-xs text-muted-foreground line-clamp-2 group-hover:text-foreground transition-colors">
          {lead.notes}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground/30 group-hover:text-muted-foreground/60 italic transition-colors">
          Add note…
        </span>
      )}
    </div>
  );
}

export default function Leads() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("leadScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  const { data: leads, isLoading } = useGetLeads(
    stageFilter !== "all" ? { stage: stageFilter } : {}
  );
  const deleteLead = useDeleteLead();
  const updateLead = useUpdateLead();
  const bulkUpdate = useBulkUpdateLeads();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getGetLeadsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetAnalyticsSummaryQueryKey() });
    qc.invalidateQueries({ queryKey: getGetStageBreakdownQueryKey() });
  };

  const handleUpdate = (id: number, patch: Record<string, any>) => {
    updateLead.mutate(
      { id, data: patch },
      { onSuccess: invalidate }
    );
  };

  const filtered = useMemo(() => {
    if (!leads) return [];
    let list = leads;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          l.businessName.toLowerCase().includes(q) ||
          l.city?.toLowerCase().includes(q) ||
          l.category?.toLowerCase().includes(q) ||
          l.phone?.includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc" ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });
    return list;
  }, [leads, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      sortDir === "asc" ? (
        <ChevronUp className="h-3 w-3 inline ml-0.5" />
      ) : (
        <ChevronDown className="h-3 w-3 inline ml-0.5" />
      )
    ) : null;

  const toggleSelect = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected(
      selected.size === filtered.length
        ? new Set()
        : new Set(filtered.map((l) => l.id))
    );

  const handleBulkStage = (stage: string) => {
    const ids = Array.from(selected);
    bulkUpdate.mutate(
      { data: { ids, stage } },
      {
        onSuccess: (res) => {
          toast({ title: `Updated ${res.updated} leads to "${stage}"` });
          setSelected(new Set());
          invalidate();
        },
      }
    );
  };

  const handleDeleteSelected = () => {
    const ids = Array.from(selected);
    Promise.all(ids.map((id) => deleteLead.mutateAsync({ id }))).then(() => {
      toast({ title: `Deleted ${ids.length} leads` });
      setSelected(new Set());
      invalidate();
    });
  };

  const openInMaps = (lead: any, e: React.MouseEvent) => {
    if (lead.googleMapsUrl) {
      window.open(lead.googleMapsUrl, "_blank", "noreferrer");
    } else {
      const query = encodeURIComponent(
        [lead.businessName, lead.address, lead.city].filter(Boolean).join(", ")
      );
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank", "noreferrer");
    }
  };

  return (
    <Layout>
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-border flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm bg-muted/30"
              data-testid="input-search-leads"
            />
          </div>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="h-8 w-36 text-xs bg-muted/30" data-testid="select-stage-filter">
              <Filter className="h-3 w-3 mr-1 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 text-xs text-muted-foreground ml-auto">
            <MapPin className="h-3 w-3" />
            <span>Click any row to open in Google Maps</span>
            <span className="text-border">·</span>
            <span>{filtered.length} lead{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Bulk actions bar */}
        {selected.size > 0 && (
          <div className="px-6 py-2 bg-primary/10 border-b border-primary/20 flex items-center gap-3">
            <span className="text-xs text-primary font-medium">
              {selected.size} selected
            </span>
            <Select onValueChange={handleBulkStage}>
              <SelectTrigger className="h-7 w-36 text-xs" data-testid="select-bulk-stage">
                <SelectValue placeholder="Move to stage" />
              </SelectTrigger>
              <SelectContent>
                {STAGE_OPTIONS.filter((o) => o.value !== "all").map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="destructive"
              className="h-7 text-xs"
              onClick={handleDeleteSelected}
              data-testid="btn-delete-selected"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
            <button
              className="text-xs text-muted-foreground hover:text-foreground ml-auto"
              onClick={() => setSelected(new Set())}
            >
              Clear
            </button>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-6 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Users className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">No leads found</p>
              <p className="text-xs mt-1">Run a search to find and save leads</p>
            </div>
          ) : (
            <table className="w-full text-sm border-collapse min-w-[1100px]">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground sticky top-0 bg-background z-10">
                  <th className="w-8 px-3 py-2.5 text-left">
                    <Checkbox
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onCheckedChange={toggleAll}
                      data-testid="checkbox-select-all"
                    />
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider">Business</th>
                  <th
                    className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("leadScore")}
                  >
                    Score <SortIcon k="leadScore" />
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider">Stage</th>
                  <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider">Status</th>
                  <th
                    className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("rating")}
                  >
                    Rating <SortIcon k="rating" />
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider">Location</th>
                  <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider">Web / Phone</th>
                  <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider">Notes</th>
                  <th className="w-10 px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => (
                  <tr
                    key={lead.id}
                    className={cn(
                      "border-b border-border/50 hover:bg-muted/20 cursor-pointer transition-colors group",
                      selected.has(lead.id) && "bg-primary/5"
                    )}
                    onClick={(e) => openInMaps(lead, e)}
                    title={`Open ${lead.businessName} in Google Maps`}
                    data-testid={`row-lead-${lead.id}`}
                  >
                    {/* Checkbox */}
                    <td
                      className="px-3 py-2.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(lead.id);
                      }}
                    >
                      <Checkbox checked={selected.has(lead.id)} data-testid={`checkbox-lead-${lead.id}`} />
                    </td>

                    {/* Business name */}
                    <td className="px-3 py-2.5">
                      <div className="font-medium truncate max-w-[180px] flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary/60 shrink-0 transition-colors" />
                        {lead.businessName}
                      </div>
                      {lead.category && (
                        <div className="text-xs text-muted-foreground truncate ml-4.5">{lead.category}</div>
                      )}
                    </td>

                    {/* Score */}
                    <td className="px-3 py-2.5">
                      <LeadScoreBadge score={lead.leadScore} />
                    </td>

                    {/* Stage */}
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
                          STAGE_COLORS[lead.stage] || "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
                        )}
                      >
                        {lead.stage}
                      </span>
                    </td>

                    {/* Status toggles */}
                    <td className="px-3 py-2.5">
                      <StatusButtons lead={lead} onUpdate={handleUpdate} />
                    </td>

                    {/* Rating */}
                    <td className="px-3 py-2.5">
                      {lead.rating != null ? (
                        <span className="flex items-center gap-1 text-amber-400 text-xs">
                          <Star className="h-3 w-3" />
                          {lead.rating}
                          <span className="text-muted-foreground">({lead.reviewCount})</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>

                    {/* Location */}
                    <td className="px-3 py-2.5 text-xs text-muted-foreground truncate max-w-[120px]">
                      {lead.city || lead.address || "—"}
                    </td>

                    {/* Web / Phone */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        {lead.hasWebsite ? (
                          lead.website ? (
                            <a
                              href={lead.website}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-primary hover:text-primary/80 transition-colors"
                              title="Visit website"
                              data-testid={`link-website-${lead.id}`}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <Globe className="h-3.5 w-3.5 text-emerald-400" />
                          )
                        ) : (
                          <Globe className="h-3.5 w-3.5 text-red-400/50" title="No website" />
                        )}
                        {lead.hasPhone ? (
                          lead.phone ? (
                            <a
                              href={`tel:${lead.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-emerald-400 hover:text-emerald-300 transition-colors"
                              title={lead.phone}
                            >
                              <Phone className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <Phone className="h-3.5 w-3.5 text-emerald-400" />
                          )
                        ) : (
                          <Phone className="h-3.5 w-3.5 text-red-400/50" title="No phone" />
                        )}
                      </div>
                    </td>

                    {/* Notes */}
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <InlineNote lead={lead} onUpdate={handleUpdate} />
                    </td>

                    {/* View button */}
                    <td className="px-3 py-2.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLead(lead);
                        }}
                        data-testid={`btn-view-lead-${lead.id}`}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <LeadDetailSheet
        lead={selectedLead}
        open={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        onLeadUpdated={invalidate}
      />
    </Layout>
  );
}
