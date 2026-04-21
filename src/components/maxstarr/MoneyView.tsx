'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { Budget, InvestmentPosition, MoneyEntry } from '@/lib/types';
import { ArrowDownRight, ArrowUpRight, Banknote, Calculator, Landmark, Plus, Target, Trash2, TrendingUp, Wallet2 } from 'lucide-react';

const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

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

  const budgetStats = useMemo(() => {
    return budgets.map((budget) => {
      const relevant = moneyEntries.filter(
        (entry) => entry.includedInBudget && entry.category.toLowerCase() === budget.name.toLowerCase()
      );
      const income = relevant.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + entry.amount, 0);
      const expenses = relevant.filter((entry) => entry.type !== 'income').reduce((sum, entry) => sum + entry.amount, 0);
      const available = budget.limit + income - expenses;
      return { budget, income, expenses, available };
    });
  }, [budgets, moneyEntries]);

  const simulatedBalance = useMemo(() => {
    const income = baseIncomeMonthly + moneyEntries.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + entry.amount, 0);
    const expenses = moneyEntries
      .filter((entry) => entry.type !== 'income' && entry.includedInBudget)
      .reduce((sum, entry) => sum + entry.amount, 0);
    return income - expenses;
  }, [baseIncomeMonthly, moneyEntries]);

  const investmentSummary = useMemo(() => {
    const totalCost = investmentPositions.reduce((sum, p) => sum + p.shares * p.avgCost, 0);
    const totalValue = investmentPositions.reduce((sum, p) => sum + p.shares * p.currentPrice, 0);
    return { totalCost, totalValue, pnl: totalValue - totalCost };
  }, [investmentPositions]);

  const totalIncome = useMemo(
    () => moneyEntries.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + entry.amount, 0),
    [moneyEntries]
  );
  const totalSpent = useMemo(
    () => moneyEntries.filter((entry) => entry.type !== 'income').reduce((sum, entry) => sum + entry.amount, 0),
    [moneyEntries]
  );
  const totalIncluded = useMemo(() => moneyEntries.filter((entry) => entry.includedInBudget).length, [moneyEntries]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (simulatedBalance >= 1000) {
      window.dispatchEvent(new Event('starrlign:achievement'));
    }
  }, [simulatedBalance]);

  const moneyFmt = (num: number) => `$${num.toFixed(2)}`;

  return (
    <div className="max-w-[1200px] mx-auto space-y-5">
      <div className="border-[2px] border-black rounded-xl bg-[linear-gradient(135deg,var(--brand-blue)_0%,#1d5ed8_55%,#5b9dff_100%)] p-4 shadow-[4px_4px_0_black] text-white overflow-hidden relative">
        <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-white/10 blur-xl" />
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[10px] tracking-[2px] uppercase text-white/70">Money Control Center</div>
            <h2 className="text-2xl" style={{ fontFamily: 'var(--font-display)' }}>BUDGETS • TRACKING • SIMULATION</h2>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[2px] text-white/70">Monthly Simulated Balance</div>
            <div className="text-2xl font-bold">{moneyFmt(simulatedBalance)}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="border-[2px] border-black rounded-lg bg-white p-3 shadow-[3px_3px_0_black]">
          <div className="text-[10px] uppercase tracking-[1.6px] text-black/60 mb-1 flex items-center gap-1"><ArrowUpRight className="w-3 h-3" /> Income</div>
          <div className="text-xl font-bold text-[var(--brand-green)]">{moneyFmt(baseIncomeMonthly + totalIncome)}</div>
        </div>
        <div className="border-[2px] border-black rounded-lg bg-white p-3 shadow-[3px_3px_0_black]">
          <div className="text-[10px] uppercase tracking-[1.6px] text-black/60 mb-1 flex items-center gap-1"><ArrowDownRight className="w-3 h-3" /> Outflow</div>
          <div className="text-xl font-bold text-[var(--brand-red)]">{moneyFmt(totalSpent)}</div>
        </div>
        <div className="border-[2px] border-black rounded-lg bg-white p-3 shadow-[3px_3px_0_black]">
          <div className="text-[10px] uppercase tracking-[1.6px] text-black/60 mb-1 flex items-center gap-1"><Wallet2 className="w-3 h-3" /> Included</div>
          <div className="text-xl font-bold">{totalIncluded} items</div>
        </div>
        <div className="border-[2px] border-black rounded-lg bg-white p-3 shadow-[3px_3px_0_black]">
          <div className="text-[10px] uppercase tracking-[1.6px] text-black/60 mb-1 flex items-center gap-1"><Landmark className="w-3 h-3" /> Portfolio</div>
          <div className="text-xl font-bold">{moneyFmt(investmentSummary.totalValue)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="border-[2px] border-black rounded-xl bg-white p-4 shadow-[3px_3px_0_black]">
          <div className="flex items-center gap-2 mb-3"><Banknote className="w-4 h-4" /> Base Monthly Income</div>
          <input
            type="number"
            value={baseIncomeMonthly}
            onChange={(e) => setBaseIncomeMonthly(Number(e.target.value || 0))}
            className="w-full border-[2px] border-black rounded px-3 py-2"
          />
          <p className="text-xs text-black/60 mt-2">Used in overall simulation and budget planning.</p>
        </div>

        <div className="lg:col-span-2 border-[2px] border-black rounded-xl bg-white p-4 shadow-[3px_3px_0_black]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Budgets</h3>
            <button
              onClick={() => addBudget({ id: uid(), name: `Custom ${budgets.length + 1}`, limit: 500 })}
              className="text-xs px-2 py-1 border-[2px] border-black rounded bg-[var(--brand-yellow)]"
            >
              <Plus className="w-3 h-3 inline mr-1" /> Add budget
            </button>
          </div>
          <div className="space-y-2">
            {budgetStats.map(({ budget, income, expenses, available }) => (
              <div key={budget.id} className="border border-black/20 rounded-lg p-3 bg-[var(--off-white)]/70">
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    value={budget.name}
                    onChange={(e) => updateBudget(budget.id, { name: e.target.value })}
                    className="border border-black rounded px-2 py-1 text-sm"
                  />
                  <label className="text-xs">Limit</label>
                  <input
                    type="number"
                    value={budget.limit}
                    onChange={(e) => updateBudget(budget.id, { limit: Number(e.target.value || 0) })}
                    className="border border-black rounded px-2 py-1 text-sm w-[110px]"
                  />
                  <button onClick={() => deleteBudget(budget.id)} className="ml-auto text-[var(--brand-red)]">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs mt-2 flex gap-3">
                  <span>Income: {moneyFmt(income)}</span>
                  <span>Spend: {moneyFmt(expenses)}</span>
                  <span className={available < 0 ? 'text-[var(--brand-red)] font-bold' : 'text-[var(--brand-green)] font-bold'}>
                    Available: {moneyFmt(available)}
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-black/10 overflow-hidden">
                  <div
                    className={available < 0 ? 'h-full bg-[var(--brand-red)]' : 'h-full bg-[var(--brand-green)]'}
                    style={{ width: `${Math.max(8, Math.min(100, ((budget.limit + income - Math.max(0, available * -1)) / Math.max(1, budget.limit + income)) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border-[2px] border-black rounded-xl bg-white p-4 shadow-[3px_3px_0_black]">
          <h3 className="font-bold mb-3">Add Money Item / Simulation</h3>
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Title"
              value={entryDraft.title}
              onChange={(e) => setEntryDraft((prev) => ({ ...prev, title: e.target.value }))}
              className="col-span-2 border border-black rounded px-2 py-1"
            />
            <input
              type="number"
              placeholder="Amount"
              value={entryDraft.amount}
              onChange={(e) => setEntryDraft((prev) => ({ ...prev, amount: Number(e.target.value || 0) }))}
              className="border border-black rounded px-2 py-1"
            />
            <select
              value={entryDraft.type}
              onChange={(e) => setEntryDraft((prev) => ({ ...prev, type: e.target.value as MoneyEntry['type'] }))}
              className="border border-black rounded px-2 py-1"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="investment">Investment</option>
            </select>
            <select
              value={entryDraft.category}
              onChange={(e) => setEntryDraft((prev) => ({ ...prev, category: e.target.value }))}
              className="border border-black rounded px-2 py-1"
            >
              <option value="work">Work</option>
              <option value="saving">Saving</option>
              <option value="personal">Personal</option>
            </select>
            <input
              type="date"
              value={entryDraft.date}
              onChange={(e) => setEntryDraft((prev) => ({ ...prev, date: e.target.value }))}
              className="border border-black rounded px-2 py-1"
            />
            <select
              value={entryDraft.linkedTaskId}
              onChange={(e) => setEntryDraft((prev) => ({ ...prev, linkedTaskId: e.target.value }))}
              className="col-span-2 border border-black rounded px-2 py-1"
            >
              <option value="">Optional task link</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>{task.title}</option>
              ))}
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

        <div className="border-[2px] border-black rounded-xl bg-white p-4 shadow-[3px_3px_0_black]">
          <div className="flex items-center gap-2 mb-2"><Calculator className="w-4 h-4" /> If I buy this, can I afford it?</div>
          <p className="text-xs text-black/70 mb-2">Toggle “Included” to simulate purchases before you commit.</p>
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {moneyEntries.map((entry) => (
              <div key={entry.id} className="border border-black/15 rounded p-2 text-sm">
                <div className="flex items-center gap-2">
                  <strong>{entry.title}</strong>
                  <span className="text-xs uppercase text-black/60">{entry.type}</span>
                  <span className="ml-auto">{moneyFmt(entry.amount)}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => setMoneyEntryIncluded(entry.id, !entry.includedInBudget)}
                    className={`text-xs px-2 py-0.5 border rounded ${entry.includedInBudget ? 'bg-[var(--brand-green)] text-white border-black' : 'bg-white text-black border-black/40'}`}
                  >
                    {entry.includedInBudget ? 'Included' : 'Not included'}
                  </button>
                  <span className="text-xs">{entry.category}</span>
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
            {moneyEntries.length === 0 && <div className="text-sm text-black/60">No money items yet.</div>}
          </div>
        </div>
      </div>

      <div className="border-[2px] border-black rounded-xl bg-white p-4 shadow-[3px_3px_0_black]">
        <div className="flex items-center gap-2 mb-3"><TrendingUp className="w-4 h-4" /> Investments (manual tracking)</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
          <input placeholder="Symbol" value={positionDraft.symbol} onChange={(e) => setPositionDraft((p) => ({ ...p, symbol: e.target.value.toUpperCase() }))} className="border border-black rounded px-2 py-1" />
          <input type="number" placeholder="Shares" value={positionDraft.shares} onChange={(e) => setPositionDraft((p) => ({ ...p, shares: Number(e.target.value || 0) }))} className="border border-black rounded px-2 py-1" />
          <input type="number" placeholder="Avg cost" value={positionDraft.avgCost} onChange={(e) => setPositionDraft((p) => ({ ...p, avgCost: Number(e.target.value || 0) }))} className="border border-black rounded px-2 py-1" />
          <input type="number" placeholder="Current price" value={positionDraft.currentPrice} onChange={(e) => setPositionDraft((p) => ({ ...p, currentPrice: Number(e.target.value || 0) }))} className="border border-black rounded px-2 py-1" />
          <button
            onClick={() => {
              if (!positionDraft.symbol) return;
              addInvestmentPosition({ id: uid(), ...positionDraft });
              setPositionDraft({ symbol: '', shares: 0, avgCost: 0, currentPrice: 0 });
            }}
            className="border-[2px] border-black rounded bg-[var(--brand-yellow)] px-2"
          >
            Add
          </button>
        </div>
        <div className="text-sm mb-2 flex items-center gap-2">
          <Target className="w-4 h-4" />
          Portfolio value: <strong>{moneyFmt(investmentSummary.totalValue)}</strong> • P/L: <strong className={investmentSummary.pnl >= 0 ? 'text-[var(--brand-green)]' : 'text-[var(--brand-red)]'}>{moneyFmt(investmentSummary.pnl)}</strong>
        </div>
        <div className="space-y-2">
          {investmentPositions.map((position) => {
            const pnl = position.shares * (position.currentPrice - position.avgCost);
            return (
              <div key={position.id} className="grid grid-cols-5 gap-2 items-center border border-black/15 rounded p-2 text-sm">
                <input value={position.symbol} onChange={(e) => updateInvestmentPosition(position.id, { symbol: e.target.value.toUpperCase() })} className="border border-black rounded px-2 py-1" />
                <input type="number" value={position.shares} onChange={(e) => updateInvestmentPosition(position.id, { shares: Number(e.target.value || 0) })} className="border border-black rounded px-2 py-1" />
                <input type="number" value={position.avgCost} onChange={(e) => updateInvestmentPosition(position.id, { avgCost: Number(e.target.value || 0) })} className="border border-black rounded px-2 py-1" />
                <input type="number" value={position.currentPrice} onChange={(e) => updateInvestmentPosition(position.id, { currentPrice: Number(e.target.value || 0) })} className="border border-black rounded px-2 py-1" />
                <div className="flex items-center justify-between">
                  <span className={pnl >= 0 ? 'text-[var(--brand-green)]' : 'text-[var(--brand-red)]'}>${pnl.toFixed(2)}</span>
                  <button onClick={() => deleteInvestmentPosition(position.id)} className="text-[var(--brand-red)]"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })}
          {investmentPositions.length === 0 && <div className="text-sm text-black/60">No positions yet. Robinhood live sync not built yet; this is manual for now.</div>}
        </div>
      </div>
    </div>
  );
}
