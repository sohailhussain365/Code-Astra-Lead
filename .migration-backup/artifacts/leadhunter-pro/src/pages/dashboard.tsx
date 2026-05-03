import { Layout } from "@/components/layout";
import {
  useGetAnalyticsSummary,
  useGetStageBreakdown,
  useGetScoreDistribution,
  useGetFollowups,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  Flame,
  Phone,
  Trophy,
  Clock,
  Search,
  TrendingUp,
} from "lucide-react";
import { LeadScoreBadge } from "@/components/lead-score-badge";

const STAGE_COLORS: Record<string, string> = {
  new: "#4b5563",
  contacted: "#3b82f6",
  interested: "#f59e0b",
  qualified: "#8b5cf6",
  won: "#10b981",
  lost: "#ef4444",
};

const SCORE_COLORS = ["#10b981", "#f59e0b", "#ef4444"];

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-primary",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
      <div className={`mt-0.5 ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold tabular-nums mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useGetAnalyticsSummary();
  const { data: stages, isLoading: stagesLoading } = useGetStageBreakdown();
  const { data: distribution, isLoading: distLoading } = useGetScoreDistribution();
  const { data: followups, isLoading: followupsLoading } = useGetFollowups();

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your pipeline at a glance</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {summaryLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))
          ) : summary ? (
            <>
              <StatCard icon={Users} label="Total Leads" value={summary.totalLeads} />
              <StatCard icon={Flame} label="Hot Leads" value={summary.hotLeads} color="text-emerald-400" sub="score ≥ 70" />
              <StatCard icon={Phone} label="Contacted" value={summary.contacted} color="text-blue-400" />
              <StatCard icon={Trophy} label="Won" value={summary.won} color="text-amber-400" />
              <StatCard
                icon={TrendingUp}
                label="Avg Score"
                value={summary.avgScore != null ? summary.avgScore.toFixed(1) : "—"}
                color="text-violet-400"
              />
              <StatCard icon={Search} label="Searches" value={summary.totalSearches} color="text-sky-400" />
              <StatCard icon={Users} label="Qualified" value={summary.qualified} color="text-violet-400" />
              <StatCard
                icon={Clock}
                label="Follow-ups Due"
                value={summary.followupsDue}
                color={summary.followupsDue > 0 ? "text-amber-400" : "text-muted-foreground"}
              />
            </>
          ) : null}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Stage breakdown */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="text-sm font-semibold mb-4">Pipeline Stage Breakdown</h2>
            {stagesLoading ? (
              <Skeleton className="h-48" />
            ) : stages && stages.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={stages} barSize={24}>
                  <XAxis
                    dataKey="stage"
                    tick={{ fontSize: 10, fill: "hsl(220 15% 60%)" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: string) => v.charAt(0).toUpperCase() + v.slice(1)}
                  />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(220 15% 60%)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(220 20% 8%)",
                      border: "1px solid hsl(220 20% 14%)",
                      borderRadius: 4,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "hsl(210 10% 90%)" }}
                    itemStyle={{ color: "hsl(142 71% 45%)" }}
                  />
                  <Bar
                    dataKey="count"
                    radius={[3, 3, 0, 0]}
                    fill="hsl(142 71% 45%)"
                  >
                    {stages.map((entry) => (
                      <Cell key={entry.stage} fill={STAGE_COLORS[entry.stage] || "hsl(142 71% 45%)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                No leads yet — run a search to get started
              </div>
            )}
          </div>

          {/* Score distribution */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="text-sm font-semibold mb-4">Lead Score Distribution</h2>
            {distLoading ? (
              <Skeleton className="h-48" />
            ) : distribution && distribution.some((b) => b.count > 0) ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={160}>
                  <PieChart>
                    <Pie
                      data={distribution}
                      dataKey="count"
                      nameKey="bucket"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {distribution.map((entry, i) => (
                        <Cell key={entry.bucket} fill={SCORE_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "hsl(220 20% 8%)",
                        border: "1px solid hsl(220 20% 14%)",
                        borderRadius: 4,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {distribution.map((b, i) => (
                    <div key={b.bucket} className="flex items-center gap-2 text-sm">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: SCORE_COLORS[i] }}
                      />
                      <span className="text-muted-foreground text-xs">{b.bucket}</span>
                      <span className="font-bold text-xs ml-auto">{b.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                No data yet
              </div>
            )}
          </div>
        </div>

        {/* Follow-ups due */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            Upcoming Follow-ups
          </h2>
          {followupsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : followups && followups.length > 0 ? (
            <div className="space-y-1">
              {followups.slice(0, 5).map((lead) => {
                const due = lead.callLaterAt ? new Date(lead.callLaterAt) : null;
                const isOverdue = due && due < new Date();
                return (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between py-2 px-3 rounded bg-muted/30 border border-border text-sm"
                    data-testid={`followup-item-${lead.id}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <LeadScoreBadge score={lead.leadScore} />
                      <span className="font-medium truncate">{lead.businessName}</span>
                      <span className="text-muted-foreground text-xs hidden sm:block">{lead.city}</span>
                    </div>
                    {due && (
                      <span
                        className={`text-xs font-medium tabular-nums shrink-0 ml-2 ${
                          isOverdue ? "text-red-400" : "text-amber-400"
                        }`}
                      >
                        {isOverdue ? "Overdue — " : ""}
                        {due.toLocaleDateString()} {due.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No follow-ups scheduled.</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
