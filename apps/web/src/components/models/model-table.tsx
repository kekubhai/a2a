'use client';

import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { ModelDTO } from '@/lib/types';

type SortKey =
  | 'provider'
  | 'name'
  | 'inputPrice'
  | 'outputPrice'
  | 'codingBenchmark'
  | 'writingBenchmark'
  | 'generalBenchmark'
  | 'imageElo';

interface ModelTableProps {
  models: ModelDTO[];
  providers: string[];
}

const PROVIDER_COLORS: Record<string, string> = {
  Anthropic: 'bg-orange-500/15 text-orange-400 ring-orange-500/25',
  OpenAI: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/25',
  Google: 'bg-blue-500/15 text-blue-400 ring-blue-500/25',
  DeepSeek: 'bg-cyan-500/15 text-cyan-400 ring-cyan-500/25',
  Meta: 'bg-indigo-500/15 text-indigo-400 ring-indigo-500/25',
  Mistral: 'bg-purple-500/15 text-purple-400 ring-purple-500/25',
  Alibaba: 'bg-pink-500/15 text-pink-400 ring-pink-500/25',
  SpaceXAI: 'bg-amber-500/15 text-amber-400 ring-amber-500/25',
  MiniMax: 'bg-teal-500/15 text-teal-400 ring-teal-500/25',
  Qwen: 'bg-violet-500/15 text-violet-400 ring-violet-500/25',
  NVIDIA: 'bg-green-500/15 text-green-400 ring-green-500/25',
  Amazon: 'bg-yellow-500/15 text-yellow-400 ring-yellow-500/25',
  Microsoft: 'bg-sky-500/15 text-sky-400 ring-sky-500/25',
  'Allen Institute for AI': 'bg-rose-500/15 text-rose-400 ring-rose-500/25',
  NousResearch: 'bg-fuchsia-500/15 text-fuchsia-400 ring-fuchsia-500/25',
  'Nous Research': 'bg-fuchsia-500/15 text-fuchsia-400 ring-fuchsia-500/25',
  Kimi: 'bg-lime-500/15 text-lime-400 ring-lime-500/25',
  Perplexity: 'bg-cyan-500/15 text-cyan-400 ring-cyan-500/25',
  Cohere: 'bg-red-500/15 text-red-400 ring-red-500/25',
  Tencent: 'bg-sky-500/15 text-sky-400 ring-sky-500/25',
  Baidu: 'bg-blue-500/15 text-blue-400 ring-blue-500/25',
  Xiaomi: 'bg-orange-500/15 text-orange-400 ring-orange-500/25',
  'Z AI': 'bg-gray-500/15 text-gray-400 ring-gray-500/25',
  StepFun: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/25',
  Moonshotai: 'bg-violet-500/15 text-violet-400 ring-violet-500/25',
  KwaiKAT: 'bg-amber-500/15 text-amber-400 ring-amber-500/25',
  'AI21 Labs': 'bg-teal-500/15 text-teal-400 ring-teal-500/25',
  'Prime Intellect': 'bg-indigo-500/15 text-indigo-400 ring-indigo-500/25',
  Nvidia: 'bg-green-500/15 text-green-400 ring-green-500/25',
  InclusionAI: 'bg-pink-500/15 text-pink-400 ring-pink-500/25',
  Inception: 'bg-purple-500/15 text-purple-400 ring-purple-500/25',
  'Liquid AI': 'bg-cyan-500/15 text-cyan-400 ring-cyan-500/25',
  'Nex AGI': 'bg-rose-500/15 text-rose-400 ring-rose-500/25',
};

function providerColor(provider: string): string {
  return PROVIDER_COLORS[provider] ?? 'bg-muted text-muted-foreground ring-border';
}

function SortHeader({
  label,
  sortKey,
  currentSort,
  currentDir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  currentDir: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
}) {
  const active = currentSort === sortKey;
  return (
    <th
      className="cursor-pointer select-none whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          currentDir === 'asc' ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </span>
    </th>
  );
}

function BenchmarkBadge({ value }: { value: string | null }) {
  if (value == null) return <span className="text-muted-foreground/40">—</span>;
  const num = parseFloat(value);
  let color = 'bg-muted text-muted-foreground';
  if (num >= 80) color = 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/20';
  else if (num >= 60) color = 'bg-blue-500/15 text-blue-400 ring-blue-500/20';
  else if (num >= 40) color = 'bg-amber-500/15 text-amber-400 ring-amber-500/20';
  else color = 'bg-red-500/15 text-red-400 ring-red-500/20';
  return (
    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ${color}`}>
      {num.toFixed(1)}
    </span>
  );
}

function PriceCell({ value }: { value: string }) {
  const num = parseFloat(value);
  if (num === 0) return <span className="text-emerald-400 font-medium">Free</span>;
  if (num < 0.1) return <span className="text-foreground">${num.toFixed(3)}</span>;
  return <span className="text-foreground">${num.toFixed(3)}</span>;
}

export function ModelTable({ models: initialModels, providers }: ModelTableProps) {
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('provider');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    let list = initialModels;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) || m.provider.toLowerCase().includes(q),
      );
    }
    if (providerFilter !== 'all') {
      list = list.filter((m) => m.provider === providerFilter);
    }
    if (typeFilter !== 'all') {
      list = list.filter((m) => m.modelType === typeFilter);
    }

    list = [...list].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];

      // nulls last
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;

      if (sortKey === 'provider' || sortKey === 'name') {
        const cmp = String(av).localeCompare(String(bv));
        return sortDir === 'asc' ? cmp : -cmp;
      }

      const cmp = parseFloat(String(av)) - parseFloat(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [initialModels, search, providerFilter, typeFilter, sortKey, sortDir]);

  const stats = useMemo(() => {
    const llmCount = filtered.filter((m) => m.modelType === 'llm').length;
    const imgCount = filtered.filter((m) => m.modelType === 'image').length;
    const providerCount = new Set(filtered.map((m) => m.provider)).size;
    return { total: filtered.length, llmCount, imgCount, providerCount };
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search models..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={providerFilter}
          onChange={(e) => setProviderFilter(e.target.value)}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
        >
          <option value="all">All providers ({providers.length})</option>
          {providers.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
        >
          <option value="all">All types</option>
          <option value="llm">LLM</option>
          <option value="image">Image generation</option>
        </select>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>{stats.total} models</span>
        <span className="text-border">|</span>
        <span>{stats.providerCount} providers</span>
        <span className="text-border">|</span>
        <span>{stats.llmCount} LLM</span>
        <span className="text-border">|</span>
        <span>{stats.imgCount} image</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border/80">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30">
              <SortHeader label="Provider" sortKey="provider" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortHeader label="Model" sortKey="name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortHeader label="Input/M" sortKey="inputPrice" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortHeader label="Output/M" sortKey="outputPrice" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortHeader label="Coding" sortKey="codingBenchmark" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortHeader label="Writing" sortKey="writingBenchmark" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortHeader label="General" sortKey="generalBenchmark" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortHeader label="Elo" sortKey="imageElo" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr
                key={m.id}
                className="border-b border-border/40 transition-colors hover:bg-muted/30"
              >
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ${providerColor(m.provider)}`}>
                    {m.provider}
                  </span>
                </td>
                <td className="px-3 py-2 font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    {m.name}
                    {m.modelType === 'image' && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">IMG</Badge>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  <PriceCell value={m.inputPrice} />
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  <PriceCell value={m.outputPrice} />
                </td>
                <td className="px-3 py-2 text-center">
                  <BenchmarkBadge value={m.codingBenchmark} />
                </td>
                <td className="px-3 py-2 text-center">
                  <BenchmarkBadge value={m.writingBenchmark} />
                </td>
                <td className="px-3 py-2 text-center">
                  <BenchmarkBadge value={m.generalBenchmark} />
                </td>
                <td className="px-3 py-2 text-center">
                  {m.imageElo != null ? (
                    <span className="text-xs font-medium text-foreground">{m.imageElo}</span>
                  ) : (
                    <span className="text-muted-foreground/40">—</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-12 text-center text-muted-foreground">
                  No models match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
