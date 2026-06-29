import { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';

// ─── Brand metadata ──────────────────────────────────────────────────────────
// Keyed by the exact `attributed_brand` string in the CSV. Colors mirror the
// brand palette in mockData.ts so the Content Market Share visuals stay
// consistent with the rest of the dashboard.
export const CMS_BRAND_META = {
  Sonalika: { short: 'SON', isOwn: true },
  Mahindra: { short: 'MAH' },
  Swaraj: { short: 'SWJ' },
  'John Deere': { short: 'JD' },
  'New Holland': { short: 'NH' },
  'Massey Ferguson': { short: 'MF' },
  'Escorts Kubota': { short: 'EK' },
};

export const BRAND_COLORS = {
  'Sonalika': '#EF9F27',
  'Mahindra': '#5DCAA5',
  'Swaraj': '#85B7EB',
  'John Deere': '#97C459',
  'New Holland': '#AFA9EC',
  'Massey Ferguson': '#F0997B',
  'Escorts Kubota': '#ED93B1',
};

export const getBrandColor = (brand) => BRAND_COLORS[brand] || '#9CA3AF';

export const SONALIKA_BRAND = 'Sonalika';

// Update when the full channel registry is integrated.
export const TOTAL_MONITORED_CHANNELS = 52;

const round2 = (n) => Math.round(n * 100) / 100;
const num = (v) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0);
const pct = (part, total) => (total > 0 ? round2((part / total) * 100) : 0);

const brandMeta = (brand) => {
  const meta = CMS_BRAND_META[brand];
  return {
    short: meta ? meta.short : brand.slice(0, 3).toUpperCase(),
    color: getBrandColor(brand),
    isOwn: !!(meta && meta.isOwn),
  };
};

// ─── Aggregation helpers (pure) ──────────────────────────────────────────────

// denomRows: optional full-window pool used exclusively for denominators (sov_videos,
// sov_views, sov_comments, soe). When omitted, rows is used for both per-brand metrics
// and denominators — the original behaviour. Pass denomRows when rows has been
// pre-filtered (e.g. by selectedBrands) so that single-brand videos that fall outside
// the filter are still counted in the total.
export function summarizeBrands(rows, denomRows) {
  const poolForDenom = denomRows || rows;

  // Build denominators from the full pool (unfiltered by selectedBrands)
  const allVideoIds = new Set();
  let sumViews = 0, sumComments = 0, sumEngagement = 0;
  for (const r of poolForDenom) {
    allVideoIds.add(r.video_id);
    sumViews += num(r.view_count);
    sumComments += num(r.comment_count);
    sumEngagement += num(r.view_count) + num(r.like_count) + num(r.comment_count);
  }

  // Build per-brand metrics from the display rows only
  const byBrand = new Map();
  for (const r of rows) {
    const brand = r.attributed_brand;
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
    const week = r.publish_date;
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
  [...new Set(rows.map((r) => r.publish_date))].filter(Boolean).sort();

export const recentWeeks = (weeks, n) => weeks.slice(Math.max(0, weeks.length - n));

// ─── Overview stats (date-range filtered, uses full raw data) ─────────────────
// Returns five counts used by the Intelligence Overview metric cards.
// allData: all rows from the CSV (no is_tractor / brand filter).
export function computeOverviewStats(allData, startDate, endDate) {
  const inRange = allData.filter(
    (r) => r.publish_date >= startDate && r.publish_date <= endDate
  );

  const totalVideos = new Set(inRange.map((r) => r.video_id)).size;

  const tractorRows = inRange.filter((r) => r.is_tractor_content === true);
  const tractorVideos = new Set(tractorRows.map((r) => r.video_id)).size;

  const brandsPerVideo = {};
  inRange
    .filter((r) => r.is_tractor_content && r.attributed_brand !== 'unattributed')
    .forEach((r) => {
      if (!brandsPerVideo[r.video_id]) brandsPerVideo[r.video_id] = new Set();
      brandsPerVideo[r.video_id].add(r.attributed_brand);
    });

  const direct = Object.values(brandsPerVideo).filter((s) => s.size === 1).length;
  const multi = Object.values(brandsPerVideo).filter((s) => s.size >= 2).length;

  return { totalVideos, tractorVideos, brandMentioned: Object.keys(brandsPerVideo).length, directVideos: direct, comparisonVideos: multi };
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
    const cat = r.video_category || (r.is_tractor_content === true ? 'Tractor' : 'Non-Tractor');
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
  const tractorInRange = inRange.filter((r) => r.is_tractor_content === true);
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

// ─── Brand expansion constants ────────────────────────────────────────────────
const BRAND_NORMALIZE = {
  Escorts: 'Escorts Kubota',
  Kubota: 'Escorts Kubota',
};


function getIsoWeek(isoDate) {
  const d = new Date(isoDate + 'T00:00:00Z');
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useCMSData() {
  // allData: every expanded row from the CSV with a valid video_id (no tractor/brand filter).
  // cmsData: the subset that is tractor content with a named brand attribution.
  const [allData, setAllData] = useState([]);
  const [cmsData, setCmsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/data/tractor_kpi_input.csv')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        const parsed = Papa.parse(text, {
          header: true,
          dynamicTyping: false,
          skipEmptyLines: true
        });

        const cleanRows = parsed.data.filter(row =>
          row.video_id &&
          row.video_id !== 'NaN' &&
          String(row.video_id).trim() !== ''
        );

        const expandedRows = [];
        for (const raw of cleanRows) {
          if (!raw || !raw.video_id) continue;

          const publishDate = raw.posted_date
            ? new Date(raw.posted_date).toISOString().split('T')[0]
            : '';

          const mapped = {
            video_id: raw.video_id,
            video_url: raw.video_url,
            channel_id: raw.channel_id,
            channel_name: raw.channelTitle,
            title: raw.title,
            publish_date: publishDate,
            publish_week: raw.publish_week || (publishDate ? getIsoWeek(publishDate) : ''),
            view_count: Number(raw.views) || 0,
            like_count: Number(raw.likeCount) || 0,
            comment_count: Number(raw.comment_count) || 0,
            duration_seconds: Number(raw.duration_seconds) || 0,
            is_short: raw.is_shorts_reel === 'true' || raw.is_shorts_reel === '1' || raw.is_shorts_reel === true,
            is_tractor_content: raw.level_1_category === 'Tractor',
            video_category: raw.level_1_category || 'Non-Tractor',
            detected_brands_from_transcript: raw.detected_brands_from_transcript || '',
            tractor_sub_category: raw.tractor_sub_category || '',
            sentiments: raw.sentiments || '',
            company_brand_info: raw.company_brand_info || '',
          };

          if (mapped.is_tractor_content) {
            let brands = [];
            try {
              const detected = JSON.parse(raw.detected_brands_from_transcript || '[]');
              const normalized = detected
                .map((b) => (BRAND_NORMALIZE[b] !== undefined ? BRAND_NORMALIZE[b] : b))
                .filter(Boolean);
              brands = [...new Set(normalized)];
            } catch (e) {
              brands = [];
            }
            if (brands.length > 0) {
              for (const brand of brands) {
                expandedRows.push({ ...mapped, attributed_brand: brand });
              }
            } else {
              expandedRows.push({ ...mapped, attributed_brand: 'unattributed' });
            }
          } else {
            expandedRows.push({ ...mapped, attributed_brand: 'unattributed' });
          }
        }

        const branded = expandedRows.filter(
          (r) =>
            r.is_tractor_content === true &&
            r.attributed_brand &&
            r.attributed_brand !== 'unattributed'
        );

        if (!cancelled) {
          setAllData(expandedRows);
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
