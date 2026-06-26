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

// Update when the full channel registry is integrated.
export const TOTAL_MONITORED_CHANNELS = 52;

const round2 = (n) => Math.round(n * 100) / 100;
const num = (v) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0);
const pct = (part, total) => (total > 0 ? round2((part / total) * 100) : 0);

const brandMeta = (brand) =>
  CMS_BRAND_META[brand] || { short: brand.slice(0, 3).toUpperCase(), color: '#94a3b8' };

// ─── Aggregation helpers (pure) ──────────────────────────────────────────────

export function summarizeBrands(rows) {
  const allVideoIds = new Set();
  const byBrand = new Map();
  for (const r of rows) {
    const brand = r.attributed_brand;
    allVideoIds.add(r.video_id);
    if (!byBrand.has(brand)) {
      byBrand.set(brand, {
        brand,
        videoIds: new Set(),
        row_count: 0,
        total_views: 0,
        total_likes: 0,
        total_comments: 0
      });
    }
    const b = byBrand.get(brand);
    b.videoIds.add(r.video_id);
    b.row_count++;
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
      row_count: b.row_count,
      total_views: b.total_views,
      total_likes: b.total_likes,
      total_comments: b.total_comments,
      total_engagement,
      avg_views_per_video: video_count > 0 ? Math.round(b.total_views / video_count) : 0
    };
  });

  const sumViews = base.reduce((a, s) => a + s.total_views, 0);
  const sumComments = base.reduce((a, s) => a + s.total_comments, 0);
  const sumEngagement = base.reduce((a, s) => a + s.total_engagement, 0);

  return base
    .map((s) => {
      const meta = brandMeta(s.brand);
      return {
        ...s,
        sov_views: pct(s.total_views, sumViews),
        sov_videos: pct(s.video_count, allVideoIds.size),
        sov_comments: pct(s.total_comments, sumComments),
        soe: pct(s.total_engagement, sumEngagement),
        color: meta.color,
        short: meta.short,
        isOwn: !!meta.isOwn
      };
    })
    .sort((a, b) => b.sov_views - a.sov_views);
}

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

export const uniqueWeeks = (rows) =>
  [...new Set(rows.map((r) => r.publish_week))].filter(Boolean).sort();

export const recentWeeks = (weeks, n) => weeks.slice(Math.max(0, weeks.length - n));

// ─── Overview stats (date-range filtered, uses full raw data) ─────────────────
// Returns five counts used by the Intelligence Overview metric cards.
// allData: all rows from the CSV (no is_tractor / brand filter).
export function computeOverviewStats(allData, startDate, endDate) {
  const inRange = allData.filter(
    (r) => r.publish_date >= startDate && r.publish_date <= endDate
  );

  const totalVideos = new Set(inRange.map((r) => r.video_id)).size;

  const tractorRows = inRange.filter((r) => r.is_tractor_content === 1);
  const tractorVideos = new Set(tractorRows.map((r) => r.video_id)).size;

  const brandedRows = tractorRows.filter(
    (r) => r.attributed_brand && r.attributed_brand !== 'unattributed'
  );

  // Count distinct brands per video to separate direct (1 brand) from multi-brand (2+)
  const brandsPerVideo = new Map();
  for (const r of brandedRows) {
    if (!brandsPerVideo.has(r.video_id)) brandsPerVideo.set(r.video_id, new Set());
    brandsPerVideo.get(r.video_id).add(r.attributed_brand);
  }

  const brandMentioned = brandsPerVideo.size;
  let directVideos = 0;
  let comparisonVideos = 0;
  for (const brands of brandsPerVideo.values()) {
    if (brands.size === 1) directVideos++;
    else comparisonVideos++;
  }

  return { totalVideos, tractorVideos, brandMentioned, directVideos, comparisonVideos };
}

// ─── Category breakdown ───────────────────────────────────────────────────────
// Groups all rows (no brand/attribution filter) by video_category and counts
// distinct video_ids. Returns array sorted descending by count.
export function computeCategoryData(allData, startDate, endDate) {
  const inRange = allData.filter(
    (r) => r.publish_date >= startDate && r.publish_date <= endDate
  );
  const byCategory = new Map();
  for (const r of inRange) {
    const cat = r.video_category || (r.is_tractor_content === 1 ? 'Tractor' : 'Non-Tractor');
    if (!byCategory.has(cat)) byCategory.set(cat, new Set());
    byCategory.get(cat).add(r.video_id);
  }
  const totalVideos = new Set(inRange.map((r) => r.video_id)).size;
  return [...byCategory.entries()]
    .map(([category, ids]) => ({
      category,
      count: ids.size,
      percentage: totalVideos > 0 ? Math.round((ids.size / totalVideos) * 1000) / 10 : 0
    }))
    .sort((a, b) => b.count - a.count);
}

// ─── Channel coverage ─────────────────────────────────────────────────────────
// tractorChannels: distinct channels publishing tractor content in window.
// activeChannels:  distinct channels publishing any content in window.
// inactiveChannelNames: channels in full dataset that published nothing in window.
export function computeChannelCoverage(allData, startDate, endDate) {
  const allChannelSet = new Set(allData.map((r) => r.channel_name).filter(Boolean));
  const inRange = allData.filter(
    (r) => r.publish_date >= startDate && r.publish_date <= endDate
  );
  const activeChannelSet = new Set(inRange.map((r) => r.channel_name).filter(Boolean));
  const activeChannels = activeChannelSet.size;
  const tractorInRange = inRange.filter((r) => r.is_tractor_content === 1);
  const tractorChannelSet = new Set(tractorInRange.map((r) => r.channel_name).filter(Boolean));
  const tractorChannels = tractorChannelSet.size;
  const inactiveChannelNames = [...allChannelSet]
    .filter((ch) => !activeChannelSet.has(ch))
    .sort();
  return { tractorChannels, activeChannels, inactiveChannelNames };
}

// ─── Brand × Channel matrix ───────────────────────────────────────────────────
// Computes pivot: rows = channels, brandCounts = { [brand]: distinctVideoCount }.
// Uses cmsData (already filtered to tractor + attributed). Sorted by total desc.
export function computeBrandChannelMatrix(cmsData, startDate, endDate) {
  const inRange = cmsData.filter(
    (r) => r.publish_date >= startDate && r.publish_date <= endDate
  );
  const matrix = new Map();
  for (const r of inRange) {
    const ch = r.channel_name;
    const brand = r.attributed_brand;
    if (!ch || !brand) continue;
    if (!matrix.has(ch)) matrix.set(ch, new Map());
    const brandMap = matrix.get(ch);
    if (!brandMap.has(brand)) brandMap.set(brand, new Set());
    brandMap.get(brand).add(r.video_id);
  }
  return [...matrix.entries()]
    .map(([channelName, brandMap]) => {
      const brandCounts = {};
      for (const [brand, videoIds] of brandMap.entries()) {
        brandCounts[brand] = videoIds.size;
      }
      const total = Object.values(brandCounts).reduce((a, b) => a + b, 0);
      return { channelName, total, brandCounts };
    })
    .sort((a, b) => {
      const sonalikaDiff = (b.brandCounts['Sonalika'] ?? 0) - (a.brandCounts['Sonalika'] ?? 0);
      return sonalikaDiff !== 0 ? sonalikaDiff : b.total - a.total;
    });
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useCMSData() {
  // allData: every row from the CSV with a valid video_id (no tractor/brand filter).
  // cmsData: the subset that is tractor content with a named brand attribution.
  const [allData, setAllData] = useState([]);
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
        const allRows = parsed.data
          .filter((r) => r && r.video_id)
          .map((r) => ({
            ...r,
            video_category: r.is_tractor_content === 1 ? 'Tractor' : 'Non-Tractor'
          }));
        const branded = allRows.filter(
          (r) =>
            r.is_tractor_content === 1 &&
            r.attributed_brand &&
            r.attributed_brand !== 'unattributed'
        );
        if (!cancelled) {
          setAllData(allRows);
          setCmsData(branded);
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
  const totalMonitored = TOTAL_MONITORED_CHANNELS;

  return {
    loading,
    error,
    allData,
    cmsData,
    brandSummary,
    weeklyData,
    weeklySoV,
    videoList,
    weeks,
    sonalikaStats,
    sovSeGap,
    totalMonitored
  };
}
