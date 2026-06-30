import { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';

const isBool = (v) => v === true || v === 'True' || v === 'true';
const num = (v) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0);
const pct1 = (n, total) => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0);

const PI_STAGE_LABEL = {
  dealer_inquiry: 'Dealer inquiry',
  consideration: 'Buying consideration',
  shortlisting: 'Shortlisting',
  post_purchase: 'Post purchase',
  awareness: 'Awareness',
};

const piStageLabel = (s) => PI_STAGE_LABEL[s] || s || '';

const unIntensityLabel = (v) => {
  const s = String(v || '').toLowerCase();
  if (s === 'high') return 'High';
  if (s === 'medium') return 'Medium';
  return 'Low';
};

// Convert VSWeek string → numeric N or 'all'
const weekToN = (week) => {
  if (!week || week === 'All time') return 'all';
  if (week === 'Last 8 weeks') return 8;
  if (week === 'Last 4 weeks') return 4;
  if (week === 'Last 2 weeks') return 2;
  return 'all';
};

function getMaxDate(rows) {
  let max = null;
  for (const r of rows) {
    if (r.published_at) {
      const d = new Date(r.published_at);
      if (!max || d > max) max = d;
    }
  }
  return max || new Date();
}

function filterByWeek(rows, n, maxDate) {
  if (n === 'all') return rows;
  const cutoff = new Date(maxDate);
  cutoff.setDate(cutoff.getDate() - n * 7);
  return rows.filter((r) => r.published_at && new Date(r.published_at) >= cutoff);
}

function filterByBrand(rows, brand) {
  if (!brand || brand === 'All Brands') return rows;
  return rows.filter(
    (r) => r.pi_brand === brand || r.un_brand === brand || r.qs_brand === brand
  );
}

function weeksAgo(published_at, maxDate) {
  if (!published_at || !maxDate) return 0;
  const ms = maxDate - new Date(published_at);
  return Math.max(0, Math.round(ms / (7 * 24 * 60 * 60 * 1000)));
}

// Most common value in an array of strings
function mostCommon(arr) {
  if (!arr.length) return '';
  const counts = {};
  for (const v of arr) counts[v] = (counts[v] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

const SEVERITY_ORDER = { high: 3, medium: 2, low: 1, none: 0 };

function getTopSeverity(unRows) {
  const best = unRows.reduce((top, row) => {
    const val = (row.un_intensity || 'none').toLowerCase();
    return (SEVERITY_ORDER[val] || 0) > (SEVERITY_ORDER[top] || 0) ? val : top;
  }, 'none');
  return best === 'none' ? null : best.charAt(0).toUpperCase() + best.slice(1);
}

function getClusterBrand(contentIdsStr, qsBase) {
  const ids = (contentIdsStr || '').split(',').map((s) => s.trim()).filter(Boolean);
  const branded = qsBase.filter(
    (r) => ids.includes(String(r.content_id)) && r.qs_brand
  );
  if (branded.length === 0) return null;
  const counts = {};
  branded.forEach((r) => { counts[r.qs_brand] = (counts[r.qs_brand] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function getClusterChannel(contentIdsStr, qsBase) {
  const ids = (contentIdsStr || '').split(',').map((s) => s.trim()).filter(Boolean);
  const rows = qsBase
    .filter((r) => ids.includes(String(r.content_id)))
    .sort((a, b) => num(b.comment_likeCount) - num(a.comment_likeCount));
  return rows.length > 0 ? (rows[0].channel_name || null) : null;
}

// ─── Computations ──────────────────────────────────────────────────────────────

function computeKpiSummary(rows, piBase, unBase, qsBase, brand, n, maxDate) {
  const weekRows = filterByWeek(rows, n, maxDate);
  const filtered = filterByBrand(weekRows, brand);
  const total = filtered.length;

  const piFiltered = filterByBrand(filterByWeek(piBase, n, maxDate), brand);
  const unFiltered = filterByBrand(filterByWeek(unBase, n, maxDate), brand);
  const qsFiltered = filterByBrand(filterByWeek(qsBase, n, maxDate), brand);

  return {
    total_comments: total,
    pi_rate: pct1(piFiltered.length, total),
    pi_count: piFiltered.length,
    pi_lost_sales: filtered.filter((r) => isBool(r.pi_is_lost_sale)).length,
    un_rate: pct1(unFiltered.length, total),
    un_count: unFiltered.length,
    un_high_intensity: unFiltered.filter((r) => String(r.un_intensity || '').toLowerCase() === 'high').length,
    un_content_gaps: unFiltered.filter((r) => r.un_need_type === 'content_gap').length,
    qs_rate: pct1(qsFiltered.length, total),
    qs_count: qsFiltered.length,
  };
}

function computePurchaseIntentData(piBase, brand, n, maxDate) {
  const weekRows = filterByWeek(piBase, n, maxDate);
  const filtered = filterByBrand(weekRows, brand);

  // Stage distribution — piBase already excludes post_purchase; exclude 'none' stages here
  const stageCount = {};
  for (const r of filtered) {
    if (r.pi_stage && r.pi_stage !== 'none' && r.pi_stage !== '') {
      const label = piStageLabel(r.pi_stage);
      stageCount[label] = (stageCount[label] || 0) + 1;
    }
  }
  const stageDistribution = Object.entries(stageCount)
    .map(([stage, count]) => ({ stage, count }))
    .sort((a, b) => b.count - a.count);

  // By brand — all rows (no brand filter), week-filtered only
  const brandCount = {};
  for (const r of weekRows) {
    if (r.pi_brand && r.pi_stage !== 'none') {
      brandCount[r.pi_brand] = (brandCount[r.pi_brand] || 0) + 1;
    }
  }
  const byBrand = Object.entries(brandCount)
    .map(([b, count]) => ({ brand: b, count }))
    .sort((a, b) => b.count - a.count);

  // Brand attribution counts for the annotation note
  const brandedCount = weekRows.filter((r) => r.pi_brand).length;
  const totalCount = weekRows.length;
  const unattributedCount = totalCount - brandedCount;

  // By video — count ALL PI rows per video; only include video if it has ≥1 branded row
  const videoMap = {};
  for (const r of filtered) {
    const id = r.content_id || r.title || 'Unknown';
    if (!videoMap[id]) {
      videoMap[id] = {
        title: r.title || 'Unknown',
        channel_name: r.channel_name || '',
        published_at: r.published_at || '',
        intent_count: 0,
        _brands: [],
        _stages: [],
      };
    }
    videoMap[id].intent_count++;
    if (r.pi_brand) videoMap[id]._brands.push(r.pi_brand);
    if (r.pi_stage) videoMap[id]._stages.push(piStageLabel(r.pi_stage));
  }
  const byVideo = Object.values(videoMap)
    .filter((v) => v._brands.length > 0)
    .map((v) => ({
      title: v.title,
      channel_name: v.channel_name,
      published_at: v.published_at,
      intent_count: v.intent_count,
      brand: mostCommon(v._brands),
      topSignal: mostCommon(v._stages),
    }))
    .sort((a, b) => b.intent_count - a.intent_count);

  // Top comments — exclude 'none' stages
  const topComments = filtered
    .filter((r) => r.pi_stage !== 'none' && r.pi_stage !== '')
    .sort((a, b) => num(b.comment_likeCount) - num(a.comment_likeCount))
    .slice(0, 20)
    .map((r) => ({
      comment_text: r.comment_text || '',
      pi_stage: piStageLabel(r.pi_stage),
      pi_brand: r.pi_brand || null,
      pi_confidence: r.pi_confidence,
      comment_likeCount: num(r.comment_likeCount),
      title: r.title || '',
      channel_name: r.channel_name || '',
      weeksAgo: weeksAgo(r.published_at, maxDate),
    }));

  return { stageDistribution, byBrand, brandedCount, totalCount, unattributedCount, byVideo, topComments };
}

function computeUnmetNeedsData(unBase, brand, n, maxDate) {
  const weekRows = filterByWeek(unBase, n, maxDate);
  const filtered = filterByBrand(weekRows, brand);

  // Need type dist — unBase already guarantees un_need_type !== 'none'
  const typeCount = {};
  for (const r of filtered) {
    typeCount[r.un_need_type] = (typeCount[r.un_need_type] || 0) + 1;
  }
  const needTypeDist = Object.entries(typeCount)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // By brand — all rows (no brand filter), week-filtered only
  const brandCount = {};
  for (const r of weekRows) {
    if (r.un_brand) {
      brandCount[r.un_brand] = (brandCount[r.un_brand] || 0) + 1;
    }
  }
  const byBrand = Object.entries(brandCount)
    .map(([b, count]) => ({ brand: b, count }))
    .sort((a, b) => b.count - a.count);

  // Feature areas — derive from unBase (consistent with unmet-need rows)
  const areaCount = {};
  for (const r of filtered) {
    if (r.un_feature_area && r.un_feature_area !== '' && r.un_feature_area !== 'none') {
      areaCount[r.un_feature_area] = (areaCount[r.un_feature_area] || 0) + 1;
    }
  }
  const featureAreas = Object.entries(areaCount)
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // By video — only branded videos (unBase already guarantees un_need_type !== 'none')
  const videoMap = {};
  for (const r of filtered) {
    if (!r.un_brand) continue;
    const id = r.content_id || r.title || 'Unknown';
    if (!videoMap[id]) {
      videoMap[id] = {
        title: r.title || 'Unknown',
        channel_name: r.channel_name || '',
        published_at: r.published_at || '',
        needs_count: 0,
        _brands: [],
        _unRows: [],
      };
    }
    videoMap[id].needs_count++;
    videoMap[id]._brands.push(r.un_brand);
    videoMap[id]._unRows.push(r);
  }
  const byVideo = Object.values(videoMap)
    .map((v) => ({
      title: v.title,
      channel_name: v.channel_name,
      published_at: v.published_at,
      needs_count: v.needs_count,
      brand: mostCommon(v._brands),
      topSeverity: getTopSeverity(v._unRows),
    }))
    .sort((a, b) => b.needs_count - a.needs_count);

  // Top comments — unBase already has un_need_type !== 'none'
  const topComments = filtered
    .sort((a, b) => num(b.comment_likeCount) - num(a.comment_likeCount))
    .slice(0, 20)
    .map((r) => ({
      comment_text: r.comment_text || '',
      un_need_type: r.un_need_type,
      un_intensity: unIntensityLabel(r.un_intensity),
      un_brand: r.un_brand || null,
      comment_likeCount: num(r.comment_likeCount),
      title: r.title || '',
      channel_name: r.channel_name || '',
      weeksAgo: weeksAgo(r.published_at, maxDate),
    }));

  return { needTypeDist, byBrand, featureAreas, byVideo, topComments };
}

function computeRecurringQuestionsData(qsBase, brand, n, maxDate, clusters) {
  const weekRows = filterByWeek(qsBase, n, maxDate);
  const filtered = filterByBrand(weekRows, brand);

  // Question type dist — qsBase already guarantees qs_question_type !== 'none'
  const typeCount = {};
  for (const r of filtered) {
    typeCount[r.qs_question_type] = (typeCount[r.qs_question_type] || 0) + 1;
  }
  const questionTypeDist = Object.entries(typeCount)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // By brand — all rows (no brand filter), week-filtered only
  const brandCount = {};
  for (const r of weekRows) {
    if (r.qs_brand) {
      brandCount[r.qs_brand] = (brandCount[r.qs_brand] || 0) + 1;
    }
  }
  const byBrand = Object.entries(brandCount)
    .map(([b, count]) => ({ brand: b, count }))
    .sort((a, b) => b.count - a.count);

  // By video
  const videoMap = {};
  for (const r of filtered) {
    const t = r.title || 'Unknown';
    if (!videoMap[t]) {
      videoMap[t] = { title: t, question_count: 0, total_comments: 0 };
    }
    videoMap[t].total_comments++;
    videoMap[t].question_count++;
  }
  const byVideo = Object.values(videoMap)
    .map((v) => ({
      ...v,
      question_rate: pct1(v.question_count, v.total_comments),
    }))
    .sort((a, b) => b.question_rate - a.question_rate);

  // Top questions by likes — qsBase already guarantees qs_question_type !== 'none'
  const topQuestions = filtered
    .sort((a, b) => num(b.comment_likeCount) - num(a.comment_likeCount))
    .slice(0, 20)
    .map((r) => ({
      qs_normalized_question: r.qs_normalized_question || r.comment_text || '',
      qs_question_type: r.qs_question_type,
      comment_likeCount: num(r.comment_likeCount),
      title: r.title || '',
      channel_name: r.channel_name || '',
      qs_is_content_gap: isBool(r.qs_is_content_gap),
      qs_brand: r.qs_brand || '',
      weeksAgo: weeksAgo(r.published_at, maxDate),
    }));

  const enrichedClusters = clusters.map((c) => ({
    ...c,
    brand: getClusterBrand(c.content_ids, qsBase),
    channel_name: getClusterChannel(c.content_ids, qsBase),
  }));

  return { questionTypeDist, byBrand, byVideo, topQuestions, clusters: enrichedClusters };
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useVSData({
  brand = 'All Brands',
  intentWeek = 'All time',
  needsWeek = 'All time',
  questionsWeek = 'All time',
} = {}) {
  const [successRows, setSuccessRows] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchExtractions = fetch('/data/extractions.csv')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        const parsed = Papa.parse(text, { header: true, dynamicTyping: true, skipEmptyLines: true });
        return parsed.data.filter((r) => r && r.extraction_status === 'success');
      });

    const fetchClusters = fetch('/data/question_clusters.csv')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        const parsed = Papa.parse(text, { header: true, dynamicTyping: true, skipEmptyLines: true });
        return parsed.data.filter(Boolean);
      });

    Promise.all([fetchExtractions, fetchClusters])
      .then(([rows, cls]) => {
        if (!cancelled) {
          setSuccessRows(rows);
          setClusters(cls);
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

  const maxDate = useMemo(() => getMaxDate(successRows), [successRows]);

  // Base filtered sets — defined once after loading, used exclusively downstream
  const piRows = useMemo(
    () => successRows.filter((r) => isBool(r.pi_detected) && r.pi_stage !== 'post_purchase'),
    [successRows]
  );
  const unRows = useMemo(
    () => successRows.filter((r) => isBool(r.un_detected) && r.un_need_type !== 'none'),
    [successRows]
  );
  const qsRows = useMemo(
    () => successRows.filter((r) => isBool(r.qs_is_question) && r.qs_question_type !== 'none'),
    [successRows]
  );


  const intentN = useMemo(() => weekToN(intentWeek), [intentWeek]);
  const needsN = useMemo(() => weekToN(needsWeek), [needsWeek]);
  const questionsN = useMemo(() => weekToN(questionsWeek), [questionsWeek]);

  const kpiSummary = useMemo(
    () => computeKpiSummary(successRows, piRows, unRows, qsRows, brand, 'all', maxDate),
    [successRows, piRows, unRows, qsRows, brand, maxDate]
  );

  const intentKpi = useMemo(
    () => computeKpiSummary(successRows, piRows, unRows, qsRows, brand, intentN, maxDate),
    [successRows, piRows, unRows, qsRows, brand, intentN, maxDate]
  );

  const needsKpi = useMemo(
    () => computeKpiSummary(successRows, piRows, unRows, qsRows, brand, needsN, maxDate),
    [successRows, piRows, unRows, qsRows, brand, needsN, maxDate]
  );

  const questionsKpi = useMemo(
    () => computeKpiSummary(successRows, piRows, unRows, qsRows, brand, questionsN, maxDate),
    [successRows, piRows, unRows, qsRows, brand, questionsN, maxDate]
  );

  const purchaseIntentData = useMemo(
    () => computePurchaseIntentData(piRows, brand, intentN, maxDate),
    [piRows, brand, intentN, maxDate]
  );

  const unmetNeedsData = useMemo(
    () => computeUnmetNeedsData(unRows, brand, needsN, maxDate),
    [unRows, brand, needsN, maxDate]
  );

  const recurringQuestionsData = useMemo(
    () => computeRecurringQuestionsData(qsRows, brand, questionsN, maxDate, clusters),
    [qsRows, brand, questionsN, maxDate, clusters]
  );

  return {
    loading,
    error,
    successRows,
    clusters,
    kpiSummary,
    intentKpi,
    needsKpi,
    questionsKpi,
    purchaseIntentData,
    unmetNeedsData,
    recurringQuestionsData,
  };
}
