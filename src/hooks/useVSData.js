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

// ─── Computations ──────────────────────────────────────────────────────────────

function computeKpiSummary(rows, brand, n, maxDate) {
  const weekRows = filterByWeek(rows, n, maxDate);
  const filtered = filterByBrand(weekRows, brand);
  const total = filtered.length;

  const piRows = filtered.filter(
    (r) => isBool(r.pi_detected) && r.pi_stage !== 'post_purchase'
  );
  const unRows = filtered.filter(
    (r) => isBool(r.un_detected) && r.un_need_type && r.un_need_type !== 'none' && r.un_need_type !== ''
  );
  const qsRows = filtered.filter(
    (r) => isBool(r.qs_is_question) && r.qs_question_type && r.qs_question_type !== 'none' && r.qs_question_type !== ''
  );

  return {
    total_comments: total,
    pi_rate: pct1(piRows.length, total),
    pi_count: piRows.length,
    pi_lost_sales: filtered.filter((r) => isBool(r.pi_is_lost_sale)).length,
    un_rate: pct1(unRows.length, total),
    un_count: unRows.length,
    un_high_intensity: unRows.filter((r) => String(r.un_intensity || '').toLowerCase() === 'high').length,
    un_content_gaps: unRows.filter((r) => r.un_need_type === 'content_gap').length,
    qs_rate: pct1(qsRows.length, total),
    qs_count: qsRows.length,
  };
}

function computePurchaseIntentData(rows, brand, n, maxDate) {
  const weekRows = filterByWeek(rows, n, maxDate);
  const filtered = filterByBrand(weekRows, brand);

  // Stage distribution (exclude post_purchase and none)
  const stageCount = {};
  for (const r of filtered) {
    if (
      isBool(r.pi_detected) &&
      r.pi_stage &&
      r.pi_stage !== 'post_purchase' &&
      r.pi_stage !== 'none' &&
      r.pi_stage !== ''
    ) {
      const label = piStageLabel(r.pi_stage);
      stageCount[label] = (stageCount[label] || 0) + 1;
    }
  }
  const stageDistribution = Object.entries(stageCount)
    .map(([stage, count]) => ({ stage, count }))
    .sort((a, b) => b.count - a.count);

  // By brand — always all rows (no brand filter), week-filtered only
  const brandCount = {};
  for (const r of weekRows) {
    if (isBool(r.pi_detected) && r.pi_brand && r.pi_stage !== 'post_purchase' && r.pi_stage !== 'none') {
      brandCount[r.pi_brand] = (brandCount[r.pi_brand] || 0) + 1;
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
      videoMap[t] = {
        title: t,
        intent_count: 0,
        total_comments: 0,
        _brands: [],
        _stages: [],
      };
    }
    videoMap[t].total_comments++;
    if (isBool(r.pi_detected) && r.pi_stage !== 'post_purchase' && r.pi_stage !== 'none') {
      videoMap[t].intent_count++;
      if (r.pi_brand) videoMap[t]._brands.push(r.pi_brand);
      if (r.pi_stage) videoMap[t]._stages.push(piStageLabel(r.pi_stage));
    }
  }
  const byVideo = Object.values(videoMap)
    .map((v) => ({
      title: v.title,
      intent_count: v.intent_count,
      total_comments: v.total_comments,
      intent_rate: pct1(v.intent_count, v.total_comments),
      brand: mostCommon(v._brands),
      topSignal: mostCommon(v._stages),
    }))
    .sort((a, b) => b.intent_rate - a.intent_rate);

  // Top comments
  const topComments = filtered
    .filter((r) => isBool(r.pi_detected) && r.pi_stage !== 'post_purchase' && r.pi_stage !== 'none')
    .sort((a, b) => num(b.comment_likeCount) - num(a.comment_likeCount))
    .slice(0, 20)
    .map((r) => ({
      comment_text: r.comment_text || '',
      pi_stage: piStageLabel(r.pi_stage),
      pi_brand: r.pi_brand || '',
      pi_confidence: r.pi_confidence,
      comment_likeCount: num(r.comment_likeCount),
      title: r.title || '',
      weeksAgo: weeksAgo(r.published_at, maxDate),
    }));

  return { stageDistribution, byBrand, byVideo, topComments };
}

function computeUnmetNeedsData(rows, brand, n, maxDate) {
  const weekRows = filterByWeek(rows, n, maxDate);
  const filtered = filterByBrand(weekRows, brand);

  // Need type dist
  const typeCount = {};
  for (const r of filtered) {
    if (isBool(r.un_detected) && r.un_need_type && r.un_need_type !== 'none' && r.un_need_type !== '') {
      typeCount[r.un_need_type] = (typeCount[r.un_need_type] || 0) + 1;
    }
  }
  const needTypeDist = Object.entries(typeCount)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // By brand — all rows
  const brandCount = {};
  for (const r of weekRows) {
    if (isBool(r.un_detected) && r.un_brand && r.un_need_type !== 'none') {
      brandCount[r.un_brand] = (brandCount[r.un_brand] || 0) + 1;
    }
  }
  const byBrand = Object.entries(brandCount)
    .map(([b, count]) => ({ brand: b, count }))
    .sort((a, b) => b.count - a.count);

  // Feature areas
  const areaCount = {};
  for (const r of filtered) {
    if (
      isBool(r.un_detected) &&
      r.un_feature_area &&
      r.un_feature_area !== '' &&
      r.un_feature_area !== 'none'
    ) {
      areaCount[r.un_feature_area] = (areaCount[r.un_feature_area] || 0) + 1;
    }
  }
  const featureAreas = Object.entries(areaCount)
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // By video
  const videoMap = {};
  for (const r of filtered) {
    const t = r.title || 'Unknown';
    if (!videoMap[t]) {
      videoMap[t] = { title: t, needs_count: 0, total_comments: 0, _brands: [], _intensities: [] };
    }
    videoMap[t].total_comments++;
    if (isBool(r.un_detected) && r.un_need_type && r.un_need_type !== 'none') {
      videoMap[t].needs_count++;
      if (r.un_brand) videoMap[t]._brands.push(r.un_brand);
      if (r.un_intensity) videoMap[t]._intensities.push(unIntensityLabel(r.un_intensity));
    }
  }
  const byVideo = Object.values(videoMap)
    .map((v) => ({
      title: v.title,
      needs_count: v.needs_count,
      total_comments: v.total_comments,
      needs_rate: pct1(v.needs_count, v.total_comments),
      brand: mostCommon(v._brands),
      topSeverity: mostCommon(v._intensities),
    }))
    .sort((a, b) => b.needs_rate - a.needs_rate);

  // Top comments
  const topComments = filtered
    .filter((r) => isBool(r.un_detected) && r.un_need_type && r.un_need_type !== 'none')
    .sort((a, b) => num(b.comment_likeCount) - num(a.comment_likeCount))
    .slice(0, 20)
    .map((r) => ({
      comment_text: r.comment_text || '',
      un_need_type: r.un_need_type,
      un_intensity: unIntensityLabel(r.un_intensity),
      un_brand: r.un_brand || '',
      comment_likeCount: num(r.comment_likeCount),
      title: r.title || '',
      weeksAgo: weeksAgo(r.published_at, maxDate),
    }));

  return { needTypeDist, byBrand, featureAreas, byVideo, topComments };
}

function computeRecurringQuestionsData(rows, brand, n, maxDate, clusters) {
  const weekRows = filterByWeek(rows, n, maxDate);
  const filtered = filterByBrand(weekRows, brand);

  // Question type dist
  const typeCount = {};
  for (const r of filtered) {
    if (
      isBool(r.qs_is_question) &&
      r.qs_question_type &&
      r.qs_question_type !== 'none' &&
      r.qs_question_type !== ''
    ) {
      typeCount[r.qs_question_type] = (typeCount[r.qs_question_type] || 0) + 1;
    }
  }
  const questionTypeDist = Object.entries(typeCount)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // By brand — all rows
  const brandCount = {};
  for (const r of weekRows) {
    if (isBool(r.qs_is_question) && r.qs_brand && r.qs_question_type !== 'none') {
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
    if (isBool(r.qs_is_question) && r.qs_question_type !== 'none') {
      videoMap[t].question_count++;
    }
  }
  const byVideo = Object.values(videoMap)
    .map((v) => ({
      ...v,
      question_rate: pct1(v.question_count, v.total_comments),
    }))
    .sort((a, b) => b.question_rate - a.question_rate);

  // Top questions by likes
  const topQuestions = filtered
    .filter((r) => isBool(r.qs_is_question) && r.qs_question_type && r.qs_question_type !== 'none')
    .sort((a, b) => num(b.comment_likeCount) - num(a.comment_likeCount))
    .slice(0, 20)
    .map((r) => ({
      qs_normalized_question: r.qs_normalized_question || r.comment_text || '',
      qs_question_type: r.qs_question_type,
      comment_likeCount: num(r.comment_likeCount),
      title: r.title || '',
      qs_is_content_gap: isBool(r.qs_is_content_gap),
      qs_brand: r.qs_brand || '',
      weeksAgo: weeksAgo(r.published_at, maxDate),
    }));

  return { questionTypeDist, byBrand, byVideo, topQuestions, clusters };
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
  const intentN = useMemo(() => weekToN(intentWeek), [intentWeek]);
  const needsN = useMemo(() => weekToN(needsWeek), [needsWeek]);
  const questionsN = useMemo(() => weekToN(questionsWeek), [questionsWeek]);

  const kpiSummary = useMemo(
    () => computeKpiSummary(successRows, brand, 'all', maxDate),
    [successRows, brand, maxDate]
  );

  const intentKpi = useMemo(
    () => computeKpiSummary(successRows, brand, intentN, maxDate),
    [successRows, brand, intentN, maxDate]
  );

  const needsKpi = useMemo(
    () => computeKpiSummary(successRows, brand, needsN, maxDate),
    [successRows, brand, needsN, maxDate]
  );

  const questionsKpi = useMemo(
    () => computeKpiSummary(successRows, brand, questionsN, maxDate),
    [successRows, brand, questionsN, maxDate]
  );

  const purchaseIntentData = useMemo(
    () => computePurchaseIntentData(successRows, brand, intentN, maxDate),
    [successRows, brand, intentN, maxDate]
  );

  const unmetNeedsData = useMemo(
    () => computeUnmetNeedsData(successRows, brand, needsN, maxDate),
    [successRows, brand, needsN, maxDate]
  );

  const recurringQuestionsData = useMemo(
    () => computeRecurringQuestionsData(successRows, brand, questionsN, maxDate, clusters),
    [successRows, brand, questionsN, maxDate, clusters]
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
