import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { LeadScoreBadge } from "@/components/lead-score-badge";
import {
  useUpdateLead,
  useQualifyLead,
  useGenerateOutreachTemplate,
  getGetLeadsQueryKey,
  getGetAnalyticsSummaryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  ExternalLink,
  Phone,
  Globe,
  MapPin,
  Star,
  MessageSquare,
  Mail,
  Loader2,
  Copy,
  Check,
  X,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Lead {
  id: number;
  businessName: string;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  website?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  hasWebsite: boolean;
  hasPhone: boolean;
  leadScore: number;
  opportunityTags?: string | null;
  category?: string | null;
  googleMapsUrl?: string | null;
  linkedinSearch?: string | null;
  stage: string;
  outreachStatus?: string | null;
  callLaterAt?: string | null;
  notes?: string | null;
  aiQualification?: string | null;
}

interface LeadDetailSheetProps {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  onLeadUpdated?: () => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      data-testid="btn-copy-template"
      className="text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export function LeadDetailSheet({ lead, open, onClose, onLeadUpdated }: LeadDetailSheetProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [notes, setNotes] = useState("");
  const [outreachContent, setOutreachContent] = useState<{ type: string; subject?: string | null; body: string } | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<"email" | "call" | null>(null);

  const updateLead = useUpdateLead();
  const qualifyLead = useQualifyLead();
  const generateTemplate = useGenerateOutreachTemplate();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getGetLeadsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetAnalyticsSummaryQueryKey() });
    onLeadUpdated?.();
  };

  const handleSaveNotes = () => {
    if (!lead) return;
    updateLead.mutate(
      { id: lead.id, data: { notes } },
      {
        onSuccess: () => {
          toast({ title: "Notes saved" });
          invalidate();
        },
      }
    );
  };

  const handleStageChange = (stage: string) => {
    if (!lead) return;
    updateLead.mutate(
      { id: lead.id, data: { stage } },
      {
        onSuccess: () => {
          toast({ title: `Moved to ${stage}` });
          invalidate();
        },
      }
    );
  };

  const handleQualify = () => {
    if (!lead) return;
    qualifyLead.mutate(
      { id: lead.id },
      {
        onSuccess: () => {
          toast({ title: "AI qualification complete" });
          invalidate();
        },
      }
    );
  };

  const handleOutreach = (type: "email" | "call") => {
    if (!lead) return;
    setActiveTemplate(type);
    generateTemplate.mutate(
      { id: lead.id, data: { type } },
      {
        onSuccess: (data) => {
          setOutreachContent(data);
        },
        onError: () => {
          toast({ title: "Failed to generate template", variant: "destructive" });
          setActiveTemplate(null);
        },
      }
    );
  };

  if (!lead) return null;

  const tags = (lead.opportunityTags || "").split(", ").filter(Boolean);
  const stages = ["new", "contacted", "interested", "qualified", "won", "lost"];

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto bg-card border-l border-border p-0"
      >
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-base font-semibold truncate" data-testid="lead-detail-name">
                {lead.businessName}
              </SheetTitle>
              {lead.category && (
                <p className="text-xs text-muted-foreground mt-0.5">{lead.category}</p>
              )}
            </div>
            <LeadScoreBadge score={lead.leadScore} size="md" />
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map((t) => (
                <Badge key={t} variant="secondary" className="text-xs">
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </SheetHeader>

        <div className="px-5 py-4 space-y-5">
          {/* Contact info */}
          <div className="space-y-2">
            {lead.address && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{lead.address}</span>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <a href={`tel:${lead.phone}`} className="text-primary hover:underline">
                  {lead.phone}
                </a>
              </div>
            )}
            {lead.website && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                <a href={lead.website} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">
                  {lead.website.replace(/^https?:\/\//, "").slice(0, 40)}
                </a>
              </div>
            )}
            {lead.rating != null && (
              <div className="flex items-center gap-2 text-sm">
                <Star className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-foreground font-medium">{lead.rating}</span>
                <span className="text-muted-foreground">({lead.reviewCount ?? 0} reviews)</span>
              </div>
            )}
          </div>

          {/* Links */}
          {(lead.googleMapsUrl || lead.linkedinSearch) && (
            <div className="flex gap-2">
              {lead.googleMapsUrl && (
                <a href={lead.googleMapsUrl} target="_blank" rel="noreferrer" data-testid="link-google-maps">
                  <Button variant="outline" size="sm" className="text-xs gap-1">
                    <MapPin className="h-3 w-3" />
                    Maps
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </a>
              )}
              {lead.linkedinSearch && (
                <a href={lead.linkedinSearch} target="_blank" rel="noreferrer" data-testid="link-linkedin">
                  <Button variant="outline" size="sm" className="text-xs gap-1">
                    LinkedIn
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </a>
              )}
            </div>
          )}

          <Separator />

          {/* Pipeline stage */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Pipeline Stage</p>
            <div className="flex flex-wrap gap-1.5">
              {stages.map((s) => (
                <button
                  key={s}
                  data-testid={`btn-stage-${s}`}
                  onClick={() => handleStageChange(s)}
                  className={cn(
                    "px-2.5 py-1 rounded text-xs font-medium transition-colors border",
                    lead.stage === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary text-secondary-foreground border-border hover:border-primary/50"
                  )}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* AI Qualification */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Qualification</p>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7"
                onClick={handleQualify}
                disabled={qualifyLead.isPending}
                data-testid="btn-qualify-lead"
              >
                {qualifyLead.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : null}
                {lead.aiQualification ? "Re-qualify" : "Qualify"}
              </Button>
            </div>
            {lead.aiQualification ? (
              <div className="bg-muted/50 rounded p-3 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap border border-border">
                {lead.aiQualification}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Click "Qualify" to generate an AI brief for this lead.</p>
            )}
          </div>

          <Separator />

          {/* Outreach Templates */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Outreach Templates</p>
            <div className="flex gap-2 mb-3">
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 gap-1"
                onClick={() => handleOutreach("email")}
                disabled={generateTemplate.isPending && activeTemplate === "email"}
                data-testid="btn-gen-email"
              >
                {generateTemplate.isPending && activeTemplate === "email" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Mail className="h-3 w-3" />
                )}
                Email
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 gap-1"
                onClick={() => handleOutreach("call")}
                disabled={generateTemplate.isPending && activeTemplate === "call"}
                data-testid="btn-gen-call"
              >
                {generateTemplate.isPending && activeTemplate === "call" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Phone className="h-3 w-3" />
                )}
                Call Script
              </Button>
            </div>
            {outreachContent && (
              <div className="bg-muted/50 rounded border border-border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-primary capitalize">
                    {outreachContent.type === "email" ? "Email Template" : "Call Script"}
                  </span>
                  <CopyButton text={outreachContent.body} />
                </div>
                {outreachContent.subject && (
                  <p className="text-xs text-muted-foreground">
                    <span className="text-foreground font-medium">Subject: </span>
                    {outreachContent.subject}
                  </p>
                )}
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed font-sans">
                  {outreachContent.body}
                </pre>
              </div>
            )}
          </div>

          <Separator />

          {/* Notes */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Notes</p>
            <Textarea
              placeholder="Add a note about this lead..."
              defaultValue={lead.notes || ""}
              onChange={(e) => setNotes(e.target.value)}
              className="text-sm min-h-[80px] bg-muted/30 border-border resize-none"
              data-testid="textarea-lead-notes"
            />
            <Button
              size="sm"
              className="mt-2 text-xs h-7"
              onClick={handleSaveNotes}
              disabled={updateLead.isPending}
              data-testid="btn-save-notes"
            >
              Save Notes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
