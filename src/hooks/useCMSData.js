import { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';

// ─── Brand metadata ──────────────────────────────────────────────────────────
// Keyed by the exact `attributed_brand` string in the CSV. Colors mirror the
// brand palette in mockData.ts so the Content Market Share visuals stay
// consistent with the rest of the dashboard.
export const CMS_BRAND_META = {
  Sonalika: { short: 'SON', color: '#1D4ED8', isOwn: true },
  Mahindra: { short: 'MAH', color: '#DC2626' },
  Swaraj: { short: 'SWJ', color: '#D97706' },
  'John Deere': { short: 'JD', color: '#16A34A' },
  'New Holland': { short: 'NH', color: '#0EA5E9' },
  'Massey Ferguson': { short: 'MF', color: '#7C3AED' },
  'Escorts Kubota': { short: 'EK', color: '#DB2777' }
};

export const SONALIKA_BRAND = 'Sonalika';

const round2 = (n) => Math.round(n * 100) / 100;
const num = (v) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0);
const pct = (part, total) => (total > 0 ? round2((part / total) * 100) : 0);

const brandMeta = (brand) =>
  CMS_BRAND_META[brand] || { short: brand.slice(0, 3).toUpperCase(), color: '#94a3b8' };

// ─── Aggregation helpers (pure) ──────────────────────────────────────────────

// One summary object per brand across the supplied rows. SoV / SoE percentages
// are each brand's share of the total across exactly the brands present in
// `rows` — so passing a filtered subset re-bases the shares automatically.
export function summarizeBrands(rows) {
  const byBrand = new Map();
  for (const r of rows) {
    const brand = r.attributed_brand;
    if (!byBrand.has(brand)) {
      byBrand.set(brand, {
        brand,
        videoIds: new Set(),
        total_views: 0,
        total_likes: 0,
        total_comments: 0
      });
    }
    const b = byBrand.get(brand);
    b.videoIds.add(r.video_id);
    b.total_views += num(r.view_count);
    b.total_likes += num(r.like_count);
    b.total_comments += num(r.comment_count);
  }

  const base = [...byBrand.values()].map((b) => {
    const video_count = b.videoIds.size;
    const total_engagement = b.total_views + b.total_likes + b.total_comments;
    return {
      brand: b.brand,
      video_count,
      total_views: b.total_views,
      total_likes: b.total_likes,
      total_comments: b.total_comments,
      total_engagement,
      avg_views_per_video: video_count > 0 ? Math.round(b.total_views / video_count) : 0
    };
  });

  const sumViews = base.reduce((a, s) => a + s.total_views, 0);
  const sumVideos = base.reduce((a, s) => a + s.video_count, 0);
  const sumComments = base.reduce((a, s) => a + s.total_comments, 0);
  const sumEngagement = base.reduce((a, s) => a + s.total_engagement, 0);

  return base
    .map((s) => {
      const meta = brandMeta(s.brand);
      return {
        ...s,
        sov_views: pct(s.total_views, sumViews),
        sov_videos: pct(s.video_count, sumVideos),
        sov_comments: pct(s.total_comments, sumComments),
        soe: pct(s.total_engagement, sumEngagement),
        color: meta.color,
        short: meta.short,
        isOwn: !!meta.isOwn
      };
    })
    .sort((a, b) => b.sov_views - a.sov_views);
}

// One object per brand-week combination: raw aggregates only (no shares).
export function buildWeeklyData(rows) {
  const byKey = new Map();
  for (const r of rows) {
    const week = r.publish_week;
    const brand = r.attributed_brand;
    const key = `${brand}__${week}`;
    if (!byKey.has(key)) {
      byKey.set(key, {
        brand,
        week,
        videoIds: new Set(),
        total_views: 0,
        total_likes: 0,
        total_comments: 0
      });
    }
    const e = byKey.get(key);
    e.videoIds.add(r.video_id);
    e.total_views += num(r.view_count);
    e.total_likes += num(r.like_count);
    e.total_comments += num(r.comment_count);
  }
  return [...byKey.values()].map((e) => ({
    brand: e.brand,
    week: e.week,
    video_count: e.videoIds.size,
    total_views: e.total_views,
    total_likes: e.total_likes,
    total_comments: e.total_comments
  }));
}

// weeklyData + per-week share columns. Each brand's share is computed against
// the all-brand total for that same week.
export function buildWeeklySoV(weeklyData) {
  const weekTotals = new Map();
  for (const d of weeklyData) {
    if (!weekTotals.has(d.week)) {
      weekTotals.set(d.week, { views: 0, videos: 0, comments: 0, likes: 0, engagement: 0 });
    }
    const t = weekTotals.get(d.week);
    t.views += d.total_views;
    t.videos += d.video_count;
    t.comments += d.total_comments;
    t.likes += d.total_likes;
    t.engagement += d.total_views + d.total_likes + d.total_comments;
  }
  return weeklyData.map((d) => {
    const t = weekTotals.get(d.week);
    const engagement = d.total_views + d.total_likes + d.total_comments;
    return {
      ...d,
      sov_views: pct(d.total_views, t.views),
      sov_videos: pct(d.video_count, t.videos),
      sov_comments: pct(d.total_comments, t.comments),
      sov_likes: pct(d.total_likes, t.likes),
      soe: pct(engagement, t.engagement)
    };
  });
}

function buildVideoList(rows) {
  return rows.map((r) => ({
    video_id: r.video_id,
    title: r.title,
    channel_name: r.channel_name,
    publish_date: r.publish_date,
    publish_week: r.publish_week,
    view_count: num(r.view_count),
    like_count: num(r.like_count),
    comment_count: num(r.comment_count),
    attributed_brand: r.attributed_brand,
    duration_seconds: num(r.duration_seconds),
    is_short: r.is_short
  }));
}

// Sorted ascending list of unique weeks present in the rows.
export const uniqueWeeks = (rows) =>
  [...new Set(rows.map((r) => r.publish_week))].filter(Boolean).sort();

// Most recent `n` weeks (ascending) from a sorted week list.
export const recentWeeks = (weeks, n) => weeks.slice(Math.max(0, weeks.length - n));

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useCMSData() {
  const [cmsData, setCmsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/data/videos_export.csv')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        const parsed = Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });
        const filtered = parsed.data.filter(
          (r) =>
            r &&
            r.is_tractor_content === 1 &&
            r.attributed_brand &&
            r.attributed_brand !== 'unattributed'
        );
        if (!cancelled) {
          setCmsData(filtered);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || 'Failed to load data');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const brandSummary = useMemo(() => summarizeBrands(cmsData), [cmsData]);
  const weeklyData = useMemo(() => buildWeeklyData(cmsData), [cmsData]);
  const weeklySoV = useMemo(() => buildWeeklySoV(weeklyData), [weeklyData]);
  const videoList = useMemo(() => buildVideoList(cmsData), [cmsData]);
  const weeks = useMemo(() => uniqueWeeks(cmsData), [cmsData]);
  const sonalikaStats = useMemo(
    () => brandSummary.find((b) => b.brand === SONALIKA_BRAND) || null,
    [brandSummary]
  );
  const sovSeGap = useMemo(
    () => (sonalikaStats ? round2(sonalikaStats.sov_views - sonalikaStats.soe) : 0),
    [sonalikaStats]
  );

  return {
    loading,
    error,
    cmsData,
    brandSummary,
    weeklyData,
    weeklySoV,
    videoList,
    weeks,
    sonalikaStats,
    sovSeGap
  };
}
