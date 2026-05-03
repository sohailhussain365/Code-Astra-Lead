import { useState } from "react";
import { Layout } from "@/components/layout";
import { LeadScoreBadge } from "@/components/lead-score-badge";
import { LeadDetailSheet } from "@/components/lead-detail-sheet";
import {
  useGetLeads,
  useUpdateLead,
  getGetLeadsQueryKey,
  getGetStageBreakdownQueryKey,
  getGetAnalyticsSummaryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Globe, Phone, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const STAGES = [
  { key: "new", label: "New", color: "border-t-zinc-500", headerColor: "text-zinc-400", bg: "bg-zinc-500/5" },
  { key: "contacted", label: "Contacted", color: "border-t-blue-500", headerColor: "text-blue-400", bg: "bg-blue-500/5" },
  { key: "interested", label: "Interested", color: "border-t-amber-500", headerColor: "text-amber-400", bg: "bg-amber-500/5" },
  { key: "qualified", label: "Qualified", color: "border-t-violet-500", headerColor: "text-violet-400", bg: "bg-violet-500/5" },
  { key: "won", label: "Won", color: "border-t-emerald-500", headerColor: "text-emerald-400", bg: "bg-emerald-500/5" },
  { key: "lost", label: "Lost", color: "border-t-red-500", headerColor: "text-red-400", bg: "bg-red-500/5" },
];

export default function Pipeline() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: leads, isLoading } = useGetLeads();
  const updateLead = useUpdateLead();
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getGetLeadsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetStageBreakdownQueryKey() });
    qc.invalidateQueries({ queryKey: getGetAnalyticsSummaryQueryKey() });
  };

  const byStage = (stage: string) =>
    (leads || []).filter((l) => l.stage === stage);

  const handleDrop = (stage: string) => {
    if (draggedId == null) return;
    const lead = leads?.find((l) => l.id === draggedId);
    if (!lead || lead.stage === stage) {
      setDraggedId(null);
      setDragOverStage(null);
      return;
    }
    updateLead.mutate(
      { id: draggedId, data: { stage } },
      {
        onSuccess: () => {
          toast({ title: `Moved to ${stage}` });
          invalidate();
        },
      }
    );
    setDraggedId(null);
    setDragOverStage(null);
  };

  return (
    <Layout>
      <div className="flex flex-col h-full">
        <div className="px-6 py-4 border-b border-border">
          <h1 className="text-xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Drag cards between stages to update status</p>
        </div>

        {isLoading ? (
          <div className="flex gap-3 p-4 flex-1">
            {STAGES.map((s) => (
              <div key={s.key} className="w-64 shrink-0 space-y-2">
                <Skeleton className="h-7 w-28" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-3 p-4 overflow-x-auto flex-1">
            {STAGES.map((stage) => {
              const stageLeads = byStage(stage.key);
              return (
                <div
                  key={stage.key}
                  className={cn(
                    "w-64 shrink-0 rounded-lg border border-border border-t-2 transition-colors",
                    stage.color,
                    dragOverStage === stage.key ? stage.bg : "bg-card",
                  )}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverStage(stage.key);
                  }}
                  onDragLeave={() => setDragOverStage(null)}
                  onDrop={() => handleDrop(stage.key)}
                  data-testid={`pipeline-col-${stage.key}`}
                >
                  <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
                    <span className={cn("text-xs font-bold uppercase tracking-wider", stage.headerColor)}>
                      {stage.label}
                    </span>
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {stageLeads.length}
                    </span>
                  </div>
                  <div className="p-2 space-y-2 min-h-[120px]">
                    {stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={() => setDraggedId(lead.id)}
                        onDragEnd={() => {
                          setDraggedId(null);
                          setDragOverStage(null);
                        }}
                        onClick={() => setSelectedLead(lead)}
                        className={cn(
                          "bg-background border border-border rounded p-2.5 cursor-grab active:cursor-grabbing hover:border-border/80 transition-all hover:shadow-md select-none",
                          draggedId === lead.id && "opacity-40"
                        )}
                        data-testid={`pipeline-card-${lead.id}`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <p className="text-xs font-semibold leading-tight line-clamp-2">{lead.businessName}</p>
                          <LeadScoreBadge score={lead.leadScore} />
                        </div>
                        {lead.city && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {lead.city}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          {lead.hasWebsite && <Globe className="h-3 w-3 text-emerald-400" />}
                          {lead.hasPhone && <Phone className="h-3 w-3 text-emerald-400" />}
                          {lead.notes && (
                            <span className="text-xs text-muted-foreground truncate">{lead.notes.slice(0, 20)}…</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {stageLeads.length === 0 && (
                      <div className="h-20 flex items-center justify-center text-xs text-muted-foreground/40 border border-dashed border-border/30 rounded">
                        Drop here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
