'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { MoneyEntry } from '@/lib/types';
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Calculator,
  Flame,
  Gem,
  Landmark,
  Plus,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Trophy,
  Wallet2,
  PiggyBank,
  Coins,
  Vault,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

const categoryColors: Record<string, string> = {
  work: 'bg-[var(--brand-blue)] text-white',
  personal: 'bg-[var(--brand-yellow)] text-black',
  saving: 'bg-[var(--brand-green)] text-white',
};

export default function MoneyView() {
  const {
    budgets,
    moneyEntries,
    investmentPositions,
    baseIncomeMonthly,
    tasks,
    addBudget,
    updateBudget,
    deleteBudget,
    addMoneyEntry,
    setMoneyEntryIncluded,
    deleteMoneyEntry,
    setBaseIncomeMonthly,
    addInvestmentPosition,
    updateInvestmentPosition,
    deleteInvestmentPosition,
  } = useStore();

  const [entryDraft, setEntryDraft] = useState({
    title: '',
    amount: 0,
    type: 'expense' as MoneyEntry['type'],
    category: 'personal' as MoneyEntry['category'],
    date: new Date().toISOString().slice(0, 10),
    linkedTaskId: '',
  });

  const [positionDraft, setPositionDraft] = useState({
    symbol: '',
    shares: 0,
    avgCost: 0,
    currentPrice: 0,
  });

  const totalIncome = useMemo(
    () => baseIncomeMonthly + moneyEntries.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + entry.amount, 0),
    [baseIncomeMonthly, moneyEntries]
  );

  const totalSpent = useMemo(
    () => moneyEntries.filter((entry) => entry.type !== 'income' && entry.includedInBudget).reduce((sum, entry) => sum + entry.amount, 0),
    [moneyEntries]
  );

  const simulatedBalance = totalIncome - totalSpent;

  const investmentSummary = useMemo(() => {
    const totalCost = investmentPositions.reduce((sum, p) => sum + p.shares * p.avgCost, 0);
    const totalValue = investmentPositions.reduce((sum, p) => sum + p.shares * p.currentPrice, 0);
    return { totalCost, totalValue, pnl: totalValue - totalCost };
  }, [investmentPositions]);

  const budgetStats = useMemo(() => {
    return budgets.map((budget) => {
      const relevant = moneyEntries.filter((entry) => entry.includedInBudget && entry.category.toLowerCase() === budget.name.toLowerCase());
      const income = relevant.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + entry.amount, 0);
      const expenses = relevant.filter((entry) => entry.type !== 'income').reduce((sum, entry) => sum + entry.amount, 0);
      const available = budget.limit + income - expenses;
      const usagePct = Math.round((expenses / Math.max(1, budget.limit + income)) * 100);
      return { budget, income, expenses, available, usagePct };
    });
  }, [budgets, moneyEntries]);

  const savingsRate = useMemo(() => {
    if (totalIncome <= 0) return 0;
    return Math.max(0, Math.round((simulatedBalance / totalIncome) * 100));
  }, [simulatedBalance, totalIncome]);

  const moneyLevel = Math.max(1, Math.floor((savingsRate + Math.max(0, investmentSummary.pnl / 100)) / 12) + 1);
  const nextLevelProgress = Math.min(100, ((savingsRate + Math.max(0, investmentSummary.pnl / 100)) % 12) * (100 / 12));

  const recentActivity = [...moneyEntries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);
  const projectedYearEnd = useMemo(() => {
    const now = new Date();
    const monthsLeft = Math.max(1, 12 - (now.getMonth() + 1));
    return simulatedBalance + (simulatedBalance * monthsLeft) + investmentSummary.totalValue + (investmentSummary.pnl * monthsLeft * 0.15);
  }, [simulatedBalance, investmentSummary.totalValue, investmentSummary.pnl]);
  const accountVisual = useMemo(() => {
    const checking = simulatedBalance * 0.45;
    const savings = simulatedBalance * 0.35;
    const investing = simulatedBalance * 0.2 + investmentSummary.totalValue;
    return { checking, savings, investing };
  }, [simulatedBalance, investmentSummary.totalValue]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (simulatedBalance >= 1000) {
      window.dispatchEvent(new Event('starrlign:achievement'));
    }
  }, [simulatedBalance]);

  const moneyFmt = (num: number) => `$${num.toFixed(2)}`;

  return (
    <div className="max-w-[1250px] mx-auto space-y-5">
      <div className="border-[2px] border-black rounded-2xl p-5 md:p-6 text-white shadow-[6px_6px_0_black] bg-[linear-gradient(140deg,#05381f_0%,#0f7a42_45%,#22c55e_100%)] relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/15 rounded-full blur-2xl" />
        <div className="absolute -left-10 -bottom-16 w-44 h-44 bg-[var(--brand-yellow)]/25 rounded-full blur-2xl" />
        <div className="flex flex-wrap gap-4 items-start justify-between relative z-10">
          <div>
            <div className="text-[10px] uppercase tracking-[2px] text-white/70">Money Lab // Gamified Finance</div>
            <h2 className="text-3xl md:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>STACK XP • BUILD WEALTH • RUN YOUR BANK</h2>
            <div className="mt-3 inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border border-white/40 bg-white/10">
              <Trophy className="w-3.5 h-3.5" /> Level {moneyLevel} Money Pilot
            </div>
          </div>
          <div className="min-w-[220px] rounded-xl border border-white/35 bg-black/20 p-3 backdrop-blur-sm">
            <div className="text-[10px] uppercase tracking-[2px] text-white/70">Monthly Balance</div>
            <div className={cn('text-3xl font-extrabold', simulatedBalance >= 0 ? 'text-[var(--brand-yellow)]' : 'text-[#ffd0d0]')}>
              {moneyFmt(simulatedBalance)}
            </div>
            <div className="mt-2 h-2 rounded-full bg-black/35 overflow-hidden">
              <div className="h-full bg-[linear-gradient(90deg,var(--brand-yellow)_0%,#f59e0b_100%)]" style={{ width: `${nextLevelProgress}%` }} />
            </div>
            <div className="text-[10px] mt-1 text-white/70">{Math.round(nextLevelProgress)}% to next level</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="border-[2px] border-black rounded-xl bg-[linear-gradient(160deg,#ffffff_0%,#effff3_100%)] p-4 shadow-[3px_3px_0_black]">
          <div className="text-[11px] uppercase tracking-[1.8px] text-black/60 mb-2 flex items-center gap-2"><Landmark className="w-4 h-4" /> My Bank</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><Wallet2 className="w-4 h-4 text-[var(--brand-blue)]" /> Checking</span><strong>{moneyFmt(accountVisual.checking)}</strong></div>
            <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><PiggyBank className="w-4 h-4 text-[var(--brand-green)]" /> Savings</span><strong>{moneyFmt(accountVisual.savings)}</strong></div>
            <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><Vault className="w-4 h-4 text-[var(--brand-yellow)]" /> Investments</span><strong>{moneyFmt(accountVisual.investing)}</strong></div>
          </div>
        </div>
        <div className="border-[2px] border-black rounded-xl bg-[linear-gradient(160deg,#ffffff_0%,#f6fff8_100%)] p-4 shadow-[3px_3px_0_black]">
          <div className="text-[11px] uppercase tracking-[1.8px] text-black/60 mb-2 flex items-center gap-2"><Coins className="w-4 h-4 text-[var(--brand-green)]" /> Budget Buckets</div>
          <div className="space-y-2">
            {budgetStats.slice(0, 3).map(({ budget, available }) => (
              <div key={budget.id} className="flex items-center justify-between text-sm rounded border border-black/15 px-2 py-1 bg-white">
                <span>{budget.name}</span>
                <span className={available >= 0 ? 'text-[var(--brand-green)] font-bold' : 'text-[var(--brand-red)] font-bold'}>{moneyFmt(available)}</span>
              </div>
            ))}
            {budgetStats.length === 0 && <div className="text-sm text-black/60">Create a budget bucket to track it here.</div>}
          </div>
        </div>
        <div className="border-[2px] border-black rounded-xl bg-[linear-gradient(160deg,#ffffff_0%,#f0fff3_100%)] p-4 shadow-[3px_3px_0_black]">
          <div className="text-[11px] uppercase tracking-[1.8px] text-black/60 mb-2 flex items-center gap-2"><Target className="w-4 h-4 text-[var(--brand-green)]" /> Fiscal Year Projection</div>
          <div className="text-3xl font-extrabold text-[var(--brand-green)]">{moneyFmt(projectedYearEnd)}</div>
          <div className="text-xs text-black/65 mt-1">Projected position by year-end if current monthly behavior remains similar.</div>
          <div className="mt-2 h-2 rounded-full bg-black/10 overflow-hidden">
            <div className="h-full bg-[linear-gradient(90deg,#16a34a_0%,#84cc16_100%)]" style={{ width: `${Math.min(100, Math.max(10, savingsRate + 15))}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="border-[2px] border-black rounded-xl bg-white p-3 shadow-[3px_3px_0_black]"><div className="text-[10px] uppercase tracking-[1.6px] text-black/60 flex items-center gap-1"><ArrowUpRight className="w-3 h-3" /> Income</div><div className="text-xl font-bold text-[var(--brand-green)]">{moneyFmt(totalIncome)}</div></div>
        <div className="border-[2px] border-black rounded-xl bg-white p-3 shadow-[3px_3px_0_black]"><div className="text-[10px] uppercase tracking-[1.6px] text-black/60 flex items-center gap-1"><ArrowDownRight className="w-3 h-3" /> Spend</div><div className="text-xl font-bold text-[var(--brand-red)]">{moneyFmt(totalSpent)}</div></div>
        <div className="border-[2px] border-black rounded-xl bg-white p-3 shadow-[3px_3px_0_black]"><div className="text-[10px] uppercase tracking-[1.6px] text-black/60 flex items-center gap-1"><Target className="w-3 h-3" /> Savings rate</div><div className="text-xl font-bold">{savingsRate}%</div></div>
        <div className="border-[2px] border-black rounded-xl bg-white p-3 shadow-[3px_3px_0_black]"><div className="text-[10px] uppercase tracking-[1.6px] text-black/60 flex items-center gap-1"><Landmark className="w-3 h-3" /> Portfolio</div><div className="text-xl font-bold">{moneyFmt(investmentSummary.totalValue)}</div></div>
        <div className="border-[2px] border-black rounded-xl bg-white p-3 shadow-[3px_3px_0_black]"><div className="text-[10px] uppercase tracking-[1.6px] text-black/60 flex items-center gap-1"><Gem className="w-3 h-3" /> P/L</div><div className={cn('text-xl font-bold', investmentSummary.pnl >= 0 ? 'text-[var(--brand-green)]' : 'text-[var(--brand-red)]')}>{moneyFmt(investmentSummary.pnl)}</div></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <div className="border-[2px] border-black rounded-xl bg-[linear-gradient(180deg,#ffffff_0%,#f6fff8_100%)] p-4 shadow-[3px_3px_0_black]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold flex items-center gap-2"><Wallet2 className="w-4 h-4" /> Budget Missions</h3>
              <button onClick={() => addBudget({ id: uid(), name: `Custom ${budgets.length + 1}`, limit: 500 })} className="text-xs px-2 py-1 border-[2px] border-black rounded bg-[var(--brand-yellow)]">
                <Plus className="w-3 h-3 inline mr-1" /> Add budget
              </button>
            </div>
            <div className="space-y-2">
              {budgetStats.map(({ budget, income, expenses, available, usagePct }) => (
                <div key={budget.id} className="border border-black/20 rounded-lg p-3 bg-[linear-gradient(145deg,#fff_0%,#f8fafc_100%)]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <input value={budget.name} onChange={(e) => updateBudget(budget.id, { name: e.target.value })} className="border border-black rounded px-2 py-1 text-sm" />
                    <label className="text-xs">Limit</label>
                    <input type="number" value={budget.limit} onChange={(e) => updateBudget(budget.id, { limit: Number(e.target.value || 0) })} className="border border-black rounded px-2 py-1 text-sm w-[110px]" />
                    <div className={cn('ml-auto text-xs font-bold px-2 py-0.5 rounded border border-black', available >= 0 ? 'bg-[var(--brand-green)] text-white' : 'bg-[var(--brand-red)] text-white')}>
                      {available >= 0 ? 'ON TRACK' : 'OVER BUDGET'}
                    </div>
                    <button onClick={() => deleteBudget(budget.id)} className="text-[var(--brand-red)]"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="text-xs mt-2 flex gap-3 flex-wrap">
                    <span>Income: {moneyFmt(income)}</span>
                    <span>Spend: {moneyFmt(expenses)}</span>
                    <span className="font-bold">Available: {moneyFmt(available)}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-black/10 overflow-hidden">
                    <div className={cn('h-full transition-all', usagePct > 100 ? 'bg-[var(--brand-red)]' : 'bg-[var(--brand-blue)]')} style={{ width: `${Math.min(100, usagePct)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-[2px] border-black rounded-xl bg-[linear-gradient(180deg,#ffffff_0%,#f8fffb_100%)] p-4 shadow-[3px_3px_0_black]">
            <h3 className="font-bold mb-3 flex items-center gap-2"><Banknote className="w-4 h-4" /> Log New Money Event</h3>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Title" value={entryDraft.title} onChange={(e) => setEntryDraft((prev) => ({ ...prev, title: e.target.value }))} className="col-span-2 border border-black rounded px-2 py-1" />
              <input type="number" placeholder="Amount" value={entryDraft.amount} onChange={(e) => setEntryDraft((prev) => ({ ...prev, amount: Number(e.target.value || 0) }))} className="border border-black rounded px-2 py-1" />
              <select value={entryDraft.type} onChange={(e) => setEntryDraft((prev) => ({ ...prev, type: e.target.value as MoneyEntry['type'] }))} className="border border-black rounded px-2 py-1">
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="investment">Investment</option>
              </select>
              <select value={entryDraft.category} onChange={(e) => setEntryDraft((prev) => ({ ...prev, category: e.target.value }))} className="border border-black rounded px-2 py-1">
                <option value="work">Work</option>
                <option value="saving">Saving</option>
                <option value="personal">Personal</option>
              </select>
              <input type="date" value={entryDraft.date} onChange={(e) => setEntryDraft((prev) => ({ ...prev, date: e.target.value }))} className="border border-black rounded px-2 py-1" />
              <select value={entryDraft.linkedTaskId} onChange={(e) => setEntryDraft((prev) => ({ ...prev, linkedTaskId: e.target.value }))} className="col-span-2 border border-black rounded px-2 py-1">
                <option value="">Optional task link</option>
                {tasks.map((task) => (<option key={task.id} value={task.id}>{task.title}</option>))}
              </select>
            </div>
            <button
              onClick={() => {
                if (!entryDraft.title.trim()) return;
                addMoneyEntry({
                  id: uid(),
                  title: entryDraft.title,
                  amount: entryDraft.amount,
                  type: entryDraft.type,
                  category: entryDraft.category,
                  date: entryDraft.date,
                  linkedTaskId: entryDraft.linkedTaskId || null,
                  includedInBudget: true,
                });
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new Event('starrlign:money-add'));
                }
                setEntryDraft((prev) => ({ ...prev, title: '', amount: 0 }));
              }}
              className="mt-3 px-3 py-1.5 border-[2px] border-black rounded bg-[var(--brand-green)] text-white text-sm"
            >
              Save item
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border-[2px] border-black rounded-xl bg-[linear-gradient(180deg,#ffffff_0%,#f3fff5_100%)] p-4 shadow-[3px_3px_0_black]">
            <div className="flex items-center gap-2 mb-2"><Flame className="w-4 h-4 text-[var(--brand-red)]" /> Recent Money Activity</div>
            <div className="space-y-2 max-h-[255px] overflow-y-auto pr-1">
              {recentActivity.map((entry) => (
                <div key={entry.id} className="border border-black/15 rounded p-2 text-sm">
                  <div className="flex items-center gap-2">
                    <strong className="truncate">{entry.title}</strong>
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded uppercase border border-black/20', categoryColors[entry.category] || 'bg-black/10')}>{entry.category}</span>
                    <span className="ml-auto font-bold">{moneyFmt(entry.amount)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <button onClick={() => setMoneyEntryIncluded(entry.id, !entry.includedInBudget)} className={`text-xs px-2 py-0.5 border rounded ${entry.includedInBudget ? 'bg-[var(--brand-green)] text-white border-black' : 'bg-white text-black border-black/40'}`}>
                      {entry.includedInBudget ? 'Included' : 'Not included'}
                    </button>
                    <span className="text-xs text-black/60">{entry.date}</span>
                    <button
                      onClick={() => {
                        deleteMoneyEntry(entry.id);
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(new Event('starrlign:money-delete'));
                        }
                      }}
                      className="ml-auto text-[var(--brand-red)]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && <div className="text-sm text-black/60">No activity yet. Add your first event to begin the streak.</div>}
            </div>
          </div>

          <div className="border-[2px] border-black rounded-xl bg-[linear-gradient(180deg,#ffffff_0%,#f6fff8_100%)] p-4 shadow-[3px_3px_0_black]">
            <div className="flex items-center gap-2 mb-3"><TrendingUp className="w-4 h-4" /> Investment Arena</div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <input placeholder="Symbol" value={positionDraft.symbol} onChange={(e) => setPositionDraft((p) => ({ ...p, symbol: e.target.value.toUpperCase() }))} className="border border-black rounded px-2 py-1" />
              <input type="number" placeholder="Shares" value={positionDraft.shares} onChange={(e) => setPositionDraft((p) => ({ ...p, shares: Number(e.target.value || 0) }))} className="border border-black rounded px-2 py-1" />
              <input type="number" placeholder="Avg cost" value={positionDraft.avgCost} onChange={(e) => setPositionDraft((p) => ({ ...p, avgCost: Number(e.target.value || 0) }))} className="border border-black rounded px-2 py-1" />
              <input type="number" placeholder="Current price" value={positionDraft.currentPrice} onChange={(e) => setPositionDraft((p) => ({ ...p, currentPrice: Number(e.target.value || 0) }))} className="border border-black rounded px-2 py-1" />
              <button onClick={() => { if (!positionDraft.symbol) return; addInvestmentPosition({ id: uid(), ...positionDraft }); setPositionDraft({ symbol: '', shares: 0, avgCost: 0, currentPrice: 0 }); }} className="col-span-2 border-[2px] border-black rounded bg-[var(--brand-yellow)] px-2 py-1.5">
                Add position
              </button>
            </div>
            <div className="text-sm mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Portfolio: <strong>{moneyFmt(investmentSummary.totalValue)}</strong></div>
            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
              {investmentPositions.map((position) => {
                const pnl = position.shares * (position.currentPrice - position.avgCost);
                return (
                  <div key={position.id} className="grid grid-cols-[1fr_auto] gap-2 items-center border border-black/15 rounded p-2 text-sm">
                    <div>
                      <div className="font-semibold">{position.symbol}</div>
                      <div className="text-xs text-black/65">{position.shares} @ {moneyFmt(position.avgCost)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={pnl >= 0 ? 'text-[var(--brand-green)] font-bold' : 'text-[var(--brand-red)] font-bold'}>{moneyFmt(pnl)}</span>
                      <button onClick={() => deleteInvestmentPosition(position.id)} className="text-[var(--brand-red)]"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                );
              })}
              {investmentPositions.length === 0 && <div className="text-sm text-black/60">No positions yet. Add one to start your investment leaderboard.</div>}
            </div>
          </div>

          <div className="border-[2px] border-black rounded-xl bg-[var(--brand-yellow)]/20 p-4 shadow-[3px_3px_0_black]">
            <div className="flex items-center gap-2 mb-1 text-sm font-bold"><Calculator className="w-4 h-4" /> Money Coach Tip</div>
            <p className="text-sm text-black/80">If your savings rate stays above <strong>25%</strong>, funnel extra into your highest-priority budget mission this week.</p>
            <div className="mt-2 text-xs">Base Monthly Income</div>
            <input type="number" value={baseIncomeMonthly} onChange={(e) => setBaseIncomeMonthly(Number(e.target.value || 0))} className="w-full border-[2px] border-black rounded px-3 py-2 mt-1 bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
