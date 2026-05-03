import { useState, useRef } from "react";
import { Layout } from "@/components/layout";
import { LeadScoreBadge } from "@/components/lead-score-badge";
import {
  useCreateLeads,
  useCreateSearch,
  getGetLeadsQueryKey,
  getGetSearchesQueryKey,
  getGetAnalyticsSummaryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
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
  MapPin,
  Globe,
  Phone,
  Star,
  Save,
  X,
  Loader2,
  Terminal,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Filter,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const PLACE_TYPES = [
  { value: "cleaning_services", label: "🧹 Cleaning Services" },
  { value: "roofing_contractor", label: "🏗️ Roofing Companies" },
  { value: "general_contractor|hvac", label: "❄️ HVAC Contractors" },
  { value: "plumber", label: "🚿 Plumbing Services" },
  { value: "electrician", label: "⚡ Electrician" },
  { value: "general_contractor|landscaping", label: "🌿 Landscaping" },
  { value: "moving_company", label: "🚚 Moving Company" },
  { value: "printing", label: "🖨️ Printing" },
  { value: "car_repair", label: "🔧 Auto Repair" },
  { value: "general_contractor|tree service", label: "🌳 Tree Services" },
  { value: "general_contractor|junk removal", label: "🗑️ Junk Removal" },
  { value: "general_contractor|pressure washing", label: "💦 Pressure Washing" },
  { value: "locksmith", label: "🔑 Locksmith" },
  { value: "painter", label: "🖌️ Painter" },
  { value: "pet_store", label: "🐾 Pet Store" },
  { value: "photographer", label: "📷 Photographer" },
  { value: "restaurant", label: "🍽️ Restaurant" },
  { value: "food", label: "🥘 Food & Dining" },
  { value: "bar", label: "🍺 Bar / Pub" },
  { value: "cafe", label: "☕ Cafe" },
  { value: "bakery", label: "🥐 Bakery" },
  { value: "night_club", label: "🎵 Night Club" },
  { value: "lodging", label: "🏨 Hotel / Lodging" },
  { value: "spa", label: "💆 Spa & Wellness" },
  { value: "gym", label: "💪 Gym / Fitness" },
  { value: "beauty_salon", label: "💅 Beauty Salon" },
  { value: "hair_care", label: "✂️ Hair Care" },
  { value: "dentist", label: "🦷 Dentist" },
  { value: "doctor", label: "🏥 Doctor / Clinic" },
  { value: "hospital", label: "🏨 Hospital" },
  { value: "pharmacy", label: "💊 Pharmacy" },
  { value: "real_estate_agency", label: "🏠 Real Estate" },
  { value: "lawyer", label: "⚖️ Law Firm" },
  { value: "accounting", label: "📊 Accounting" },
  { value: "insurance_agency", label: "🛡️ Insurance" },
  { value: "car_dealer", label: "🚗 Car Dealer" },
  { value: "car_wash", label: "🚿 Car Wash" },
  { value: "clothing_store", label: "👗 Clothing Store" },
  { value: "shoe_store", label: "👟 Shoe Store" },
  { value: "jewelry_store", label: "💍 Jewelry Store" },
  { value: "electronics_store", label: "📱 Electronics" },
  { value: "furniture_store", label: "🛋️ Furniture" },
  { value: "hardware_store", label: "🔨 Hardware Store" },
  { value: "supermarket", label: "🛒 Supermarket" },
  { value: "convenience_store", label: "🏪 Convenience Store" },
  { value: "florist", label: "💐 Florist" },
  { value: "book_store", label: "📚 Book Store" },
  { value: "movie_theater", label: "🎬 Movie Theater" },
  { value: "amusement_park", label: "🎡 Amusement Park" },
  { value: "museum", label: "🏛️ Museum" },
  { value: "art_gallery", label: "🖼️ Art Gallery" },
  { value: "school", label: "🏫 School" },
  { value: "university", label: "🎓 University" },
  { value: "church", label: "⛪ Church" },
  { value: "storage", label: "📦 Storage Facility" },
  { value: "travel_agency", label: "✈️ Travel Agency" },
  { value: "general_contractor|garage door repair", label: "🚪 Garage Door Repair" },
  { value: "laundry", label: "👕 Laundry" },
  { value: "veterinary_care", label: "🐕 Veterinary" },
  { value: "funeral_home", label: "⚰️ Funeral Home" },
  { value: "gas_station", label: "⛽ Gas Station" },
  { value: "bank", label: "🏦 Bank" },
  { value: "physiotherapist", label: "🦴 Physiotherapist" },
  { value: "optician", label: "👓 Optician" },
  { value: "driving_school", label: "🚦 Driving School" },
];

const RATING_OPTIONS = [
  { value: "", label: "Any Rating" },
  { value: "2", label: "≤ 2 Stars (Struggling)" },
  { value: "2.5", label: "≤ 2.5 Stars" },
  { value: "3", label: "≤ 3 Stars (Needs Help)" },
  { value: "3.5", label: "≤ 3.5 Stars" },
  { value: "4", label: "≤ 4 Stars" },
];

const PRICE_LEVELS = [
  { value: "", label: "Any Price" },
  { value: "1", label: "$ Budget" },
  { value: "2", label: "$$ Moderate" },
  { value: "3", label: "$$$ Expensive" },
  { value: "4", label: "$$$$ Luxury" },
];

const RADIUS_OPTIONS = [
  { value: "1000", label: "1 km" },
  { value: "2000", label: "2 km" },
  { value: "5000", label: "5 km" },
  { value: "10000", label: "10 km" },
  { value: "20000", label: "20 km" },
  { value: "30000", label: "30 km" },
  { value: "40000", label: "40 km" },
  { value: "50000", label: "50 km" },
  { value: "100000", label: "100 km (MAX)" },
];

const KNOWN_CHAINS = [
  "mcdonald", "starbucks", "subway", "burger king", "wendy", "taco bell",
  "pizza hut", "domino", "kfc", "chick-fil-a", "chipotle", "panera",
  "dunkin", "popeyes", "sonic drive", "jack in the box", "five guys",
  "shake shack", "in-n-out", "whataburger", "hardee", "carl's jr",
  "denny", "ihop", "applebee", "olive garden", "red lobster", "outback",
  "chili's", "hooters", "buffalo wild wings", "cracker barrel", "waffle house",
  "sizzler", "golden corral", "bob evans", "boston market",
  "walmart", "target", "costco", "home depot", "lowe", "best buy",
  "walgreens", "cvs", "rite aid", "7-eleven", "dollar general", "family dollar",
  "dollar tree", "aldi", "kroger", "publix", "safeway", "whole foods",
  "h&m", "zara", "gap", "old navy", "forever 21", "victoria's secret",
  "marriott", "hilton", "holiday inn", "best western", "hampton inn",
  "comfort inn", "super 8", "motel 6", "days inn",
  "planet fitness", "anytime fitness", "la fitness", "24 hour fitness", "gold's gym",
  "great clips", "supercuts", "sport clips",
  "bp", "shell", "exxon", "mobil", "chevron", "sunoco",
  "nationwide", "state farm", "allstate", "liberty mutual", "geico",
  "h&r block", "jackson hewitt",
];

function isChain(name: string): boolean {
  const n = name.toLowerCase();
  return KNOWN_CHAINS.some((c) => n.includes(c));
}

// ─── FILTER STATE ─────────────────────────────────────────────────────────────
interface Filters {
  city: string;
  state: string;
  zipCode: string;
  radius: string;
  type: string;
  keyword: string;
  maxRating: string;
  priceLevel: string;
  minReviews: string;
  maxReviews: string;
  minLeadScore: string;
  businessStatus: string;
  openNow: boolean;
  noWebsiteOnly: boolean;
  hasPhone: boolean;
  excludeChains: boolean;
  hasLinkedIn: boolean;
  maxResults: string;
}

const DEFAULT_FILTERS: Filters = {
  city: "",
  state: "",
  zipCode: "",
  radius: "5000",
  type: "restaurant",
  keyword: "",
  maxRating: "",
  priceLevel: "",
  minReviews: "",
  maxReviews: "",
  minLeadScore: "",
  businessStatus: "",
  openNow: false,
  noWebsiteOnly: false,
  hasPhone: false,
  excludeChains: false,
  hasLinkedIn: true,
  maxResults: "20",
};

// ─── LEAD SCORING ─────────────────────────────────────────────────────────────
interface LeadResult {
  placeId: string;
  businessName: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviewCount: number | null;
  hasWebsite: boolean;
  hasPhone: boolean;
  leadScore: number;
  opportunityTags: string | null;
  category: string | null;
  googleMapsUrl: string | null;
  linkedinSearch: string | null;
  priceLevel?: number | null;
  businessStatus?: string | null;
}

function scoreLead(place: any, filters: Filters): LeadResult {
  const hasWebsite = Boolean(place.website);
  const hasPhone = Boolean(place.formatted_phone_number);
  const rating: number | null = place.rating ?? null;
  const reviewCount: number | null = place.user_ratings_total ?? null;

  let score = 50;
  const tags: string[] = [];

  if (!hasWebsite) { score -= 10; tags.push("No Website"); }
  else score += 15;
  if (!hasPhone) { score -= 10; tags.push("No Phone"); }

  if (rating != null) {
    if (rating >= 4.5) score += 15;
    else if (rating >= 4.0) score += 10;
    else if (rating < 3.5) { score -= 10; tags.push("Low Rating"); }
  } else {
    tags.push("No Reviews");
  }

  if (reviewCount != null) {
    if (reviewCount > 100) score += 10;
    else if (reviewCount > 20) score += 5;
    else if (reviewCount < 5) tags.push("Few Reviews");
  }

  score = Math.max(0, Math.min(100, score));

  const types: string[] = place.types || [];
  const city =
    place.vicinity?.split(",").slice(-1)[0]?.trim() ??
    place.formatted_address?.split(",").slice(-2, -1)[0]?.trim() ??
    null;

  const category =
    types
      .filter((t: string) => !["point_of_interest", "establishment"].includes(t))
      .map((t: string) => t.replace(/_/g, " "))
      .slice(0, 1)
      .join(", ") || null;

  const encodedName = encodeURIComponent(place.name + " " + (city || ""));

  return {
    placeId: place.place_id,
    businessName: place.name,
    address: place.vicinity ?? place.formatted_address ?? null,
    city,
    phone: place.formatted_phone_number ?? null,
    website: place.website ?? null,
    rating,
    reviewCount,
    hasWebsite,
    hasPhone,
    leadScore: score,
    opportunityTags: tags.join(", ") || null,
    category,
    googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
    linkedinSearch: filters.hasLinkedIn
      ? `https://www.linkedin.com/search/results/companies/?keywords=${encodedName}`
      : null,
    priceLevel: place.price_level ?? null,
    businessStatus: place.business_status ?? null,
  };
}

function applyPostFilters(leads: LeadResult[], filters: Filters): LeadResult[] {
  return leads.filter((l) => {
    if (filters.noWebsiteOnly && l.hasWebsite) return false;
    if (filters.hasPhone && !l.hasPhone) return false;
    if (filters.excludeChains && isChain(l.businessName)) return false;
    if (filters.maxRating && l.rating != null && l.rating > Number(filters.maxRating)) return false;
    if (filters.priceLevel && l.priceLevel != null && l.priceLevel !== Number(filters.priceLevel)) return false;
    if (filters.minReviews && (l.reviewCount == null || l.reviewCount < Number(filters.minReviews))) return false;
    if (filters.maxReviews && l.reviewCount != null && l.reviewCount > Number(filters.maxReviews)) return false;
    if (filters.minLeadScore && l.leadScore < Number(filters.minLeadScore)) return false;
    if (filters.businessStatus && l.businessStatus && l.businessStatus !== filters.businessStatus) return false;
    return true;
  });
}

// ─── FETCH HELPERS ────────────────────────────────────────────────────────────
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "";
const LS_KEY = "lhp_google_api_key";

async function fetchWithRetry(url: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

// ─── COLLAPSIBLE SECTION ──────────────────────────────────────────────────────
function FilterSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <span>{title}</span>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>
      {open && <div className="px-4 py-3 space-y-3 bg-card">{children}</div>}
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function SearchPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const createLeads = useCreateLeads();
  const createSearch = useCreateSearch();

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [apiKey, setApiKey] = useState<string>(
    () => API_KEY || localStorage.getItem(LS_KEY) || ""
  );
  const [keySaved, setKeySaved] = useState(false);

  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    setKeySaved(false);
  };

  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem(LS_KEY, apiKey.trim());
      setKeySaved(true);
    }
  };

  const [loading, setLoading] = useState(false);
  const [rawResults, setRawResults] = useState<LeadResult[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [log, setLog] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const cancelledRef = useRef(false);
  const logRef = useRef<HTMLDivElement>(null);

  const sf = <K extends keyof Filters>(key: K, val: Filters[K]) =>
    setFilters((f) => ({ ...f, [key]: val }));

  const results = applyPostFilters(rawResults, filters);

  const addLog = (msg: string) => {
    const ts = new Date().toLocaleTimeString();
    setLog((prev) => {
      const next = [...prev, `[${ts}] ${msg}`];
      setTimeout(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
      }, 10);
      return next;
    });
  };

  const handleSearch = async () => {
    if (!apiKey) {
      toast({ title: "Google API key required", variant: "destructive" });
      return;
    }
    const locationStr = [filters.city, filters.state, filters.zipCode].filter(Boolean).join(", ");
    if (!locationStr.trim()) {
      toast({ title: "Enter a city, state, or ZIP code", variant: "destructive" });
      return;
    }

    cancelledRef.current = false;
    setLoading(true);
    setRawResults([]);
    setSelected(new Set());
    setLog([]);

    const max = Number(filters.maxResults);

    // Parse type|keyword compound
    const typeParts = filters.type.split("|");
    const placeType = typeParts[0];
    const typeKeyword = typeParts[1] || "";
    const combinedKeyword = [typeKeyword, filters.keyword].filter(Boolean).join(" ");

    try {
      addLog(`Geocoding: ${locationStr}`);
      const geoUrl = `/api/maps-proxy?path=/maps/api/geocode/json&address=${encodeURIComponent(locationStr)}&key=${apiKey}`;
      const geoData = await fetchWithRetry(geoUrl);

      if (geoData.status === "REQUEST_DENIED") {
        addLog(`Error: API key denied — ${geoData.error_message || "Enable Geocoding API"}`);
        toast({ title: "API key denied", variant: "destructive" });
        setLoading(false);
        return;
      }
      if (!geoData.results?.length) {
        addLog(`Error: Location not found: "${locationStr}"`);
        toast({ title: "Location not found", variant: "destructive" });
        setLoading(false);
        return;
      }

      const { lat, lng } = geoData.results[0].geometry.location;
      addLog(`Found: ${geoData.results[0].formatted_address}`);

      const allRaw: LeadResult[] = [];
      let pageToken: string | null = null;
      let page = 0;

      while (allRaw.length < max && !cancelledRef.current) {
        page++;
        addLog(`Fetching page ${page}…`);

        const params = new URLSearchParams({
          path: "/maps/api/place/nearbysearch/json",
          location: `${lat},${lng}`,
          radius: filters.radius,
          type: placeType,
          key: apiKey,
        });
        if (combinedKeyword) params.set("keyword", combinedKeyword);
        if (filters.openNow) params.set("opennow", "true");
        if (pageToken) params.set("pagetoken", pageToken);

        const data = await fetchWithRetry(`/api/maps-proxy?${params.toString()}`);

        if (data.status === "REQUEST_DENIED") {
          addLog(`Error: ${data.error_message || "Places API denied"}`);
          break;
        }
        if (!data.results?.length) {
          addLog("No more results");
          break;
        }

        for (const place of data.results) {
          if (allRaw.length >= max) break;

          addLog(`Fetching details: ${place.name}`);
          let detailed = place;
          try {
            const fields = "name,formatted_phone_number,website,rating,user_ratings_total,price_level,business_status,formatted_address,vicinity,types,place_id";
            const dUrl = `/api/maps-proxy?path=/maps/api/place/details/json&place_id=${place.place_id}&fields=${fields}&key=${apiKey}`;
            const detailData = await fetchWithRetry(dUrl);
            if (detailData.status === "OK") detailed = { ...place, ...detailData.result };
          } catch { /* use basic data */ }

          allRaw.push(scoreLead(detailed, filters));
        }

        addLog(`Collected ${allRaw.length} leads so far`);
        pageToken = data.next_page_token ?? null;
        if (!pageToken || cancelledRef.current) break;
        await new Promise((r) => setTimeout(r, 2000));
      }

      setRawResults(allRaw);
      const postFiltered = applyPostFilters(allRaw, filters);
      setSelected(new Set(postFiltered.map((l) => l.placeId)));
      addLog(`Done. ${allRaw.length} found, ${postFiltered.length} pass filters.`);
    } catch (err: any) {
      addLog(`Error: ${err.message}`);
      toast({ title: "Search failed", description: err.message, variant: "destructive" });
    }

    setLoading(false);
  };

  const toggleSelect = (placeId: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(placeId) ? next.delete(placeId) : next.add(placeId);
      return next;
    });

  const toggleAll = () =>
    setSelected(
      selected.size === results.length
        ? new Set()
        : new Set(results.map((l) => l.placeId))
    );

  const handleSave = async () => {
    const toSave = results.filter((l) => selected.has(l.placeId));
    if (!toSave.length) {
      toast({ title: "Select at least one lead", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const avgScore = toSave.reduce((s, l) => s + l.leadScore, 0) / toSave.length;
      const search = await createSearch.mutateAsync({
        data: {
          keyword: [filters.type, filters.keyword].filter(Boolean).join(" / "),
          location: locationStr,
          radius: Math.round(Number(filters.radius) / 1000),
          leadCount: toSave.length,
          avgScore,
        },
      });
      const response = await createLeads.mutateAsync({
        data: { searchId: search.id, leads: toSave },
      });
      toast({
        title: `Saved ${response.saved} leads`,
        description: response.skipped > 0 ? `${response.skipped} duplicates skipped` : undefined,
      });
      qc.invalidateQueries({ queryKey: getGetLeadsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetSearchesQueryKey() });
      qc.invalidateQueries({ queryKey: getGetAnalyticsSummaryQueryKey() });
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const activeFilterCount = [
    filters.maxRating,
    filters.priceLevel,
    filters.minReviews,
    filters.maxReviews,
    filters.minLeadScore,
    filters.businessStatus,
    filters.openNow ? "1" : "",
    filters.noWebsiteOnly ? "1" : "",
    filters.hasPhone ? "1" : "",
    filters.excludeChains ? "1" : "",
  ].filter(Boolean).length;

  return (
    <Layout>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex-none">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight">New Search</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Find leads via Google Places</p>
            </div>
            {rawResults.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{rawResults.length} found</span>
                {activeFilterCount > 0 && (
                  <span className="text-amber-400">→ {results.length} after filters</span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* ── SIDEBAR FILTERS ─────────────────── */}
          <aside className="w-72 shrink-0 border-r border-border overflow-y-auto bg-sidebar flex flex-col">
            <div className="p-3 space-y-2 flex-1">
              {/* API key */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Google API Key</Label>
                  {keySaved && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Saved
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <Input
                    type="password"
                    placeholder="AIza..."
                    value={apiKey}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    className="h-8 text-xs font-mono bg-muted/30 flex-1 min-w-0"
                    data-testid="input-api-key"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2 text-xs shrink-0"
                    onClick={saveApiKey}
                    disabled={!apiKey.trim()}
                    data-testid="btn-save-api-key"
                  >
                    Save
                  </Button>
                </div>
                {!apiKey && (
                  <p className="text-xs text-amber-400">Required to search</p>
                )}
              </div>

              {/* ── Location ── */}
              <FilterSection title="📍 Location" defaultOpen={true}>
                <div className="space-y-1">
                  <Label className="text-xs">City</Label>
                  <Input
                    placeholder="e.g. Austin"
                    value={filters.city}
                    onChange={(e) => sf("city", e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="h-8 text-xs bg-muted/30"
                    data-testid="input-city"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">State</Label>
                    <Input
                      placeholder="e.g. TX"
                      value={filters.state}
                      onChange={(e) => sf("state", e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="h-8 text-xs bg-muted/30"
                      data-testid="input-state"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">ZIP Code</Label>
                    <Input
                      placeholder="e.g. 78701"
                      value={filters.zipCode}
                      onChange={(e) => sf("zipCode", e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="h-8 text-xs bg-muted/30"
                      data-testid="input-zip"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Search Radius</Label>
                  <Select value={filters.radius} onValueChange={(v) => sf("radius", v)}>
                    <SelectTrigger className="h-8 text-xs bg-muted/30" data-testid="select-radius">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RADIUS_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Max results</Label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={filters.maxResults}
                    onChange={(e) => sf("maxResults", e.target.value)}
                    className="h-8 text-xs bg-muted/30"
                    data-testid="input-max-results"
                  />
                </div>
              </FilterSection>

              {/* ── Business Type ── */}
              <FilterSection title="🏢 Business Type" defaultOpen={true}>
                <div className="space-y-1">
                  <Label className="text-xs">Industry / Type</Label>
                  <Select value={filters.type} onValueChange={(v) => sf("type", v)}>
                    <SelectTrigger className="h-8 text-xs bg-muted/30" data-testid="select-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {PLACE_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Keyword (optional)</Label>
                  <Input
                    placeholder="e.g. Italian, organic..."
                    value={filters.keyword}
                    onChange={(e) => sf("keyword", e.target.value)}
                    className="h-8 text-xs bg-muted/30"
                    data-testid="input-keyword"
                  />
                </div>
              </FilterSection>

              {/* ── Quality Filters ── */}
              <FilterSection title="⭐ Quality Filters">
                <div className="space-y-1">
                  <Label className="text-xs">Max Star Rating</Label>
                  <Select value={filters.maxRating} onValueChange={(v) => sf("maxRating", v)}>
                    <SelectTrigger className="h-8 text-xs bg-muted/30" data-testid="select-max-rating">
                      <SelectValue placeholder="Any Rating" />
                    </SelectTrigger>
                    <SelectContent>
                      {RATING_OPTIONS.map((o) => (
                        <SelectItem key={o.value || "__any__"} value={o.value || "__any__"} className="text-xs">{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Price Level</Label>
                  <Select value={filters.priceLevel} onValueChange={(v) => sf("priceLevel", v)}>
                    <SelectTrigger className="h-8 text-xs bg-muted/30" data-testid="select-price-level">
                      <SelectValue placeholder="Any Price" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRICE_LEVELS.map((o) => (
                        <SelectItem key={o.value || "__any__"} value={o.value || "__any__"} className="text-xs">{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Min Reviews</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 10"
                      value={filters.minReviews}
                      onChange={(e) => sf("minReviews", e.target.value)}
                      className="h-8 text-xs bg-muted/30"
                      data-testid="input-min-reviews"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Max Reviews</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 500"
                      value={filters.maxReviews}
                      onChange={(e) => sf("maxReviews", e.target.value)}
                      className="h-8 text-xs bg-muted/30"
                      data-testid="input-max-reviews"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Min Lead Score (0–100)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 40"
                    min="0"
                    max="100"
                    value={filters.minLeadScore}
                    onChange={(e) => sf("minLeadScore", e.target.value)}
                    className="h-8 text-xs bg-muted/30"
                    data-testid="input-min-lead-score"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Business Status</Label>
                  <Select value={filters.businessStatus} onValueChange={(v) => sf("businessStatus", v)}>
                    <SelectTrigger className="h-8 text-xs bg-muted/30" data-testid="select-business-status">
                      <SelectValue placeholder="Any Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__any__" className="text-xs">Any Status</SelectItem>
                      <SelectItem value="OPERATIONAL" className="text-xs">✅ Operational</SelectItem>
                      <SelectItem value="CLOSED_TEMPORARILY" className="text-xs">⏸ Temporarily Closed</SelectItem>
                      <SelectItem value="CLOSED_PERMANENTLY" className="text-xs">❌ Permanently Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </FilterSection>

              {/* ── Lead Targeting ── */}
              <FilterSection title="🎯 Lead Targeting">
                <ToggleRow
                  label="Currently Open Only"
                  checked={filters.openNow}
                  onChange={(v) => sf("openNow", v)}
                />
                <ToggleRow
                  label="No Website Only"
                  hint="Best prospects for web services"
                  checked={filters.noWebsiteOnly}
                  onChange={(v) => sf("noWebsiteOnly", v)}
                />
                <ToggleRow
                  label="Has Phone Required"
                  hint="Only contactable leads"
                  checked={filters.hasPhone}
                  onChange={(v) => sf("hasPhone", v)}
                />
                <ToggleRow
                  label="Exclude Chain Businesses"
                  hint="Skip McDonald's, Starbucks, etc."
                  checked={filters.excludeChains}
                  onChange={(v) => sf("excludeChains", v)}
                />
                <ToggleRow
                  label="Add LinkedIn Links"
                  hint="LinkedIn search URL per lead"
                  checked={filters.hasLinkedIn}
                  onChange={(v) => sf("hasLinkedIn", v)}
                />
              </FilterSection>
            </div>

            {/* Action buttons */}
            <div className="p-3 border-t border-border space-y-2 flex-none">
              {!loading ? (
                <Button
                  className="w-full gap-1.5"
                  onClick={handleSearch}
                  data-testid="btn-run-search"
                >
                  <Search className="h-3.5 w-3.5" />
                  Find Leads
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  className="w-full gap-1.5"
                  onClick={() => { cancelledRef.current = true; setLoading(false); addLog("Cancelled."); }}
                  data-testid="btn-cancel-search"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel Search
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground gap-1"
                onClick={() => setFilters(DEFAULT_FILTERS)}
                data-testid="btn-reset-filters"
              >
                <RotateCcw className="h-3 w-3" />
                Reset All Filters
              </Button>
            </div>
          </aside>

          {/* ── MAIN CONTENT ─────────────────────── */}
          <main className="flex-1 overflow-y-auto flex flex-col">
            {/* Progress log */}
            {log.length > 0 && (
              <div className="border-b border-border bg-card flex-none">
                <div className="px-4 py-2 flex items-center gap-2 border-b border-border/50">
                  <Terminal className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Search Log</span>
                  {loading && <Loader2 className="h-3 w-3 animate-spin text-primary ml-auto" />}
                </div>
                <div
                  ref={logRef}
                  className="px-4 py-2 h-28 overflow-y-auto font-mono text-xs text-muted-foreground space-y-0.5"
                >
                  {log.map((line, i) => (
                    <div
                      key={i}
                      className={
                        line.includes("Error") ? "text-red-400" :
                        line.includes("Done") ? "text-emerald-400" : ""
                      }
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!loading && rawResults.length === 0 && log.length === 0 && (
              <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground px-6 text-center">
                <Search className="h-12 w-12 mb-4 opacity-20" />
                <h2 className="text-base font-semibold text-foreground mb-1">Ready to Hunt Leads</h2>
                <p className="text-sm mb-4">Configure filters in the sidebar and hit <strong>Find Leads</strong></p>
                <div className="grid grid-cols-1 gap-2 text-xs text-left max-w-sm w-full">
                  <div className="bg-card border border-border rounded p-2.5">
                    ⭐ <strong>Max Rating Filter</strong> — find struggling businesses at ≤ 3 stars
                  </div>
                  <div className="bg-card border border-border rounded p-2.5">
                    🌐 <strong>No Website Only</strong> — best prospects for web design services
                  </div>
                  <div className="bg-card border border-border rounded p-2.5">
                    🎯 <strong>Exclude Chains</strong> — skip franchises, focus on local businesses
                  </div>
                  <div className="bg-card border border-border rounded p-2.5">
                    📊 <strong>Min Lead Score</strong> — set a floor to filter out weak leads
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {rawResults.length > 0 && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Results toolbar */}
                <div className="px-4 py-2.5 border-b border-border flex items-center justify-between gap-3 flex-none">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleAll}
                      className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                      data-testid="btn-toggle-all"
                    >
                      <CheckSquare className="h-3.5 w-3.5" />
                      {selected.size === results.length ? "Deselect all" : "Select all"}
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {selected.size} of {results.length} selected
                      {rawResults.length !== results.length && (
                        <span className="text-amber-400 ml-1">
                          ({rawResults.length - results.length} hidden by filters)
                        </span>
                      )}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="gap-1.5 h-8"
                    onClick={handleSave}
                    disabled={saving || selected.size === 0}
                    data-testid="btn-save-leads"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save {selected.size} leads
                  </Button>
                </div>

                {/* Results table */}
                <div className="overflow-auto flex-1">
                  {results.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                      <Filter className="h-8 w-8 mb-2 opacity-30" />
                      <p className="text-sm">No leads pass your current filters</p>
                      <p className="text-xs mt-1">Try relaxing Quality Filters or Lead Targeting options</p>
                    </div>
                  ) : (
                    <table className="w-full text-sm border-collapse min-w-[700px]">
                      <thead>
                        <tr className="border-b border-border text-xs text-muted-foreground sticky top-0 bg-card z-10">
                          <th className="w-8 px-3 py-2.5 text-left" />
                          <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider">Business</th>
                          <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider">Score</th>
                          <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider">Rating</th>
                          <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider">Location</th>
                          <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider">Tags</th>
                          <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider">Web</th>
                          <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider">Phone</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((lead) => (
                          <tr
                            key={lead.placeId}
                            className={cn(
                              "border-b border-border/50 hover:bg-muted/20 transition-colors",
                              selected.has(lead.placeId) && "bg-primary/5"
                            )}
                            data-testid={`result-row-${lead.placeId}`}
                          >
                            <td className="px-3 py-2.5">
                              <Checkbox
                                checked={selected.has(lead.placeId)}
                                onCheckedChange={() => toggleSelect(lead.placeId)}
                                data-testid={`checkbox-result-${lead.placeId}`}
                              />
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="font-medium text-sm truncate max-w-[160px]">{lead.businessName}</div>
                              {lead.category && (
                                <div className="text-xs text-muted-foreground">{lead.category}</div>
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              <LeadScoreBadge score={lead.leadScore} />
                            </td>
                            <td className="px-3 py-2.5">
                              {lead.rating != null ? (
                                <span className="text-xs text-amber-400 flex items-center gap-1">
                                  <Star className="h-3 w-3" />
                                  {lead.rating} ({lead.reviewCount})
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate max-w-[120px]">{lead.city || lead.address || "—"}</span>
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="flex flex-wrap gap-1">
                                {(lead.opportunityTags || "").split(", ").filter(Boolean).map((t) => (
                                  <span key={t} className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-3 py-2.5">
                              {lead.hasWebsite ? (
                                lead.website ? (
                                  <a href={lead.website} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-primary">
                                    <Globe className="h-3.5 w-3.5" />
                                  </a>
                                ) : (
                                  <Globe className="h-3.5 w-3.5 text-emerald-400" />
                                )
                              ) : (
                                <span className="text-xs text-red-400/70">None</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              {lead.hasPhone ? (
                                <Phone className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <span className="text-xs text-red-400/70">None</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </Layout>
  );
}
