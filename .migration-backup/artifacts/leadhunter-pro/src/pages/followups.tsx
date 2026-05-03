import { useState } from "react";
import { Layout } from "@/components/layout";
import { LeadScoreBadge } from "@/components/lead-score-badge";
import { LeadDetailSheet } from "@/components/lead-detail-sheet";
import {
  useGetFollowups,
  getGetFollowupsQueryKey,
  getGetLeadsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Phone, MapPin, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

function formatDue(date: Date) {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const hours = Math.abs(diff) / 3600000;

  if (diff < 0) {
    if (hours < 1) return `Overdue by ${Math.round(-diff / 60000)}m`;
    if (hours < 24) return `Overdue by ${Math.round(hours)}h`;
    return `Overdue by ${Math.round(hours / 24)}d`;
  }
  if (hours < 1) return `In ${Math.round(diff / 60000)} min`;
  if (hours < 24) return `In ${Math.round(hours)}h`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Followups() {
  const qc = useQueryClient();
  const { data: leads, isLoading } = useGetFollowups();
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getGetFollowupsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetLeadsQueryKey() });
  };

  const now = new Date();
  const overdue = (leads || []).filter((l) => l.callLaterAt && new Date(l.callLaterAt) < now);
  const upcoming = (leads || []).filter((l) => !l.callLaterAt || new Date(l.callLaterAt) >= now);

  function LeadRow({ lead }: { lead: NonNullable<typeof leads>[number] }) {
    const due = lead.callLaterAt ? new Date(lead.callLaterAt) : null;
    const isOverdue = due && due < now;

    return (
      <div
        className={cn(
          "flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer hover:border-border transition-colors",
          isOverdue
            ? "border-red-500/30 bg-red-500/5 hover:bg-red-500/10"
            : "border-border bg-card hover:bg-muted/20"
        )}
        onClick={() => setSelectedLead(lead)}
        data-testid={`followup-row-${lead.id}`}
      >
        <div className="mt-0.5">
          {isOverdue ? (
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          ) : (
            <Clock className="h-4 w-4 text-amber-400 shrink-0" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm truncate">{lead.businessName}</span>
            <LeadScoreBadge score={lead.leadScore} />
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {lead.city && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {lead.city}
              </span>
            )}
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="flex items-center gap-1 text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone className="h-3 w-3" />
                {lead.phone}
              </a>
            )}
          </div>
          {lead.notes && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{lead.notes}</p>
          )}
        </div>
        {due && (
          <div className={cn("text-xs font-semibold tabular-nums shrink-0", isOverdue ? "text-red-400" : "text-amber-400")}>
            {formatDue(due)}
          </div>
        )}
      </div>
    );
  }

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-400" />
            Follow-up Queue
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Leads scheduled for callback, sorted by due time
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : leads && leads.length > 0 ? (
          <>
            {overdue.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Overdue ({overdue.length})
                </h2>
                {overdue.map((lead) => (
                  <LeadRow key={lead.id} lead={lead} />
                ))}
              </div>
            )}
            {upcoming.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Upcoming ({upcoming.length})
                </h2>
                {upcoming.map((lead) => (
                  <LeadRow key={lead.id} lead={lead} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <CheckCircle className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">All clear</p>
            <p className="text-xs mt-1">No follow-ups scheduled. Mark leads as "Call Later" to see them here.</p>
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
