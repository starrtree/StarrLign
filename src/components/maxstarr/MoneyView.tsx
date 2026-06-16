'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { MoneyEntry, MoneyFrequency } from '@/lib/types';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Calculator,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Flame,
  Gem,
  Landmark,
  Link2,
  Pencil,
  PiggyBank,
  Plus,
  RefreshCw,
  Repeat2,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Trophy,
  Wallet2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
const today = () => new Date().toISOString().slice(0, 10);

const categoryColors: Record<string, string> = {
  work: 'bg-[var(--brand-blue)] text-white',
  salary: 'bg-[var(--brand-blue)] text-white',
  business: 'bg-purple-600 text-white',
  music: 'bg-pink-600 text-white',
  subscription: 'bg-orange-500 text-white',
  housing: 'bg-slate-700 text-white',
  utilities: 'bg-cyan-600 text-white',
  debt: 'bg-[var(--brand-red)] text-white',
  personal: 'bg-[var(--brand-yellow)] text-black',
  saving: 'bg-[var(--brand-green)] text-white',
};

const frequencyLabel: Record<MoneyFrequency, string> = {
  'one-time': 'One time',
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

const monthlyEquivalent = (amount: number, frequency: MoneyFrequency = 'monthly') => {
  if (frequency === 'weekly') return amount * 52 / 12;
  if (frequency === 'biweekly') return amount * 26 / 12;
  if (frequency === 'quarterly') return amount / 3;
  if (frequency === 'yearly') return amount / 12;
  if (frequency === 'one-time') return 0;
  return amount;
};

type EntryDraft = {
  title: string;
  amount: number;
  type: MoneyEntry['type'];
  category: string;
  date: string;
  linkedTaskId: string;
  linkedProjectId: string;
  notes: string;
  isRecurring: boolean;
  frequency: MoneyFrequency;
  annualInterestRate: number;
  principalBalance: number;
  dueDay: number;
};

const blankEntryDraft = (): EntryDraft => ({
  title: '',
  amount: 0,
  type: 'expense',
  category: 'personal',
  date: today(),
  linkedTaskId: '',
  linkedProjectId: '',
  notes: '',
  isRecurring: false,
  frequency: 'monthly',
  annualInterestRate: 0,
  principalBalance: 0,
  dueDay: 1,
});

const blankVariableDraft = (): EntryDraft => ({
  ...blankEntryDraft(),
  isRecurring: true,
  frequency: 'monthly',
  category: 'subscription',
});

export default function MoneyView() {
  const {
    budgets,
    moneyEntries,
    investmentPositions,
    baseIncomeMonthly,
    tasks,
    projects,
    addBudget,
    updateBudget,
    deleteBudget,
    addMoneyEntry,
    updateMoneyEntry,
    setMoneyEntryIncluded,
    deleteMoneyEntry,
    setBaseIncomeMonthly,
    addInvestmentPosition,
    deleteInvestmentPosition,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'variables' | 'investments'>('overview');
  const [entryDraft, setEntryDraft] = useState<EntryDraft>(blankEntryDraft());
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [variableDraft, setVariableDraft] = useState<EntryDraft>(blankVariableDraft());
  const [editingVariableId, setEditingVariableId] = useState<string | null>(null);
  const [reconcileAmount, setReconcileAmount] = useState(0);
  const [positionDraft, setPositionDraft] = useState({ symbol: '', shares: 0, avgCost: 0, currentPrice: 0 });

  const balanceSnapshots = useMemo(
    () => moneyEntries.filter((entry) => entry.isBalanceSnapshot).sort((a, b) => b.date.localeCompare(a.date)),
    [moneyEntries]
  );
  const latestBalanceSnapshot = balanceSnapshots[0] || null;

  const actualEntries = useMemo(
    () => moneyEntries.filter((entry) => !entry.isBalanceSnapshot && !entry.isPlannedVariable),
    [moneyEntries]
  );
  const moneyVariables = useMemo(
    () => moneyEntries.filter((entry) => entry.isPlannedVariable || entry.isRecurring),
    [moneyEntries]
  );
  const activeVariables = moneyVariables.filter((entry) => entry.active !== false);

  const monthKey = today().slice(0, 7);
  const thisMonthEntries = actualEntries.filter((entry) => entry.date.startsWith(monthKey));
  const thisMonthIncome = thisMonthEntries.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + entry.amount, 0);
  const thisMonthSpent = thisMonthEntries.filter((entry) => entry.type !== 'income' && entry.includedInBudget).reduce((sum, entry) => sum + entry.amount, 0);

  const variableMonthlyIncome = activeVariables
    .filter((entry) => entry.type === 'income')
    .reduce((sum, entry) => sum + monthlyEquivalent(entry.amount, entry.frequency), 0);
  const variableMonthlyExpenses = activeVariables
    .filter((entry) => entry.type !== 'income')
    .reduce((sum, entry) => sum + monthlyEquivalent(entry.amount, entry.frequency), 0);
  const monthlyInterestDrag = activeVariables.reduce((sum, entry) => {
    const principal = entry.principalBalance || 0;
    const apr = entry.annualInterestRate || 0;
    return sum + principal * (apr / 100) / 12;
  }, 0);

  const plannedMonthlyIncome = baseIncomeMonthly + variableMonthlyIncome;
  const monthlyFreeCash = plannedMonthlyIncome - variableMonthlyExpenses - monthlyInterestDrag;
  const savingsRate = plannedMonthlyIncome > 0 ? Math.round((monthlyFreeCash / plannedMonthlyIncome) * 100) : 0;
  const subscriptionMonthly = activeVariables
    .filter((entry) => entry.category === 'subscription')
    .reduce((sum, entry) => sum + monthlyEquivalent(entry.amount, entry.frequency), 0);

  const investmentSummary = useMemo(() => {
    const totalCost = investmentPositions.reduce((sum, p) => sum + p.shares * p.avgCost, 0);
    const totalValue = investmentPositions.reduce((sum, p) => sum + p.shares * p.currentPrice, 0);
    return { totalCost, totalValue, pnl: totalValue - totalCost };
  }, [investmentPositions]);

  const budgetStats = useMemo(() => {
    return budgets.map((budget) => {
      const relevant = thisMonthEntries.filter((entry) => entry.includedInBudget && entry.category.toLowerCase() === budget.name.toLowerCase());
      const income = relevant.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + entry.amount, 0);
      const expenses = relevant.filter((entry) => entry.type !== 'income').reduce((sum, entry) => sum + entry.amount, 0);
      const available = budget.limit + income - expenses;
      const usagePct = Math.round((expenses / Math.max(1, budget.limit + income)) * 100);
      return { budget, income, expenses, available, usagePct };
    });
  }, [budgets, thisMonthEntries]);

  const recentActivity = [...actualEntries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
  const actualBalance = latestBalanceSnapshot?.amount ?? null;
  const daysSinceReconcile = latestBalanceSnapshot
    ? Math.floor((Date.now() - new Date(latestBalanceSnapshot.date).getTime()) / 86400000)
    : null;
  const reconciliationFresh = daysSinceReconcile !== null && daysSinceReconcile <= 7;
  const moneySystemScore = Math.min(
    100,
    (latestBalanceSnapshot ? 30 : 0) +
      (activeVariables.length > 0 ? 20 : 0) +
      (budgets.length > 0 ? 20 : 0) +
      Math.min(30, thisMonthEntries.length * 5)
  );

  const projectedYearEnd = (actualBalance || 0) + monthlyFreeCash * Math.max(1, 12 - new Date().getMonth()) + investmentSummary.totalValue;
  const moneyLevel = Math.max(1, Math.floor(moneySystemScore / 20) + 1);

  const coachTip = !latestBalanceSnapshot
    ? 'Start by entering your real checking balance. The system becomes useful once it has a truthful starting point.'
    : activeVariables.length === 0
      ? 'Add your salary, subscriptions, future income streams, rent, utilities, and debts as Money Variables.'
      : thisMonthEntries.length < 5
        ? 'Log your recent purchases. Accuracy beats perfection; catch up with the biggest transactions first.'
        : variableMonthlyExpenses + monthlyInterestDrag > plannedMonthlyIncome * 0.7
          ? 'Your fixed commitments are consuming over 70% of planned income. Review subscriptions and debt first.'
          : 'Your foundation is solid. Keep reconciling weekly and push extra cash toward savings or high-interest debt.';

  const moneyFmt = (num: number) => `$${Number(num || 0).toFixed(2)}`;

  const startEditingEntry = (entry: MoneyEntry) => {
    setEditingEntryId(entry.id);
    setEntryDraft({
      title: entry.title,
      amount: entry.amount,
      type: entry.type,
      category: entry.category,
      date: entry.date,
      linkedTaskId: entry.linkedTaskId || '',
      linkedProjectId: entry.linkedProjectId || '',
      notes: entry.notes || '',
      isRecurring: Boolean(entry.isRecurring),
      frequency: entry.frequency || 'monthly',
      annualInterestRate: entry.annualInterestRate || 0,
      principalBalance: entry.principalBalance || 0,
      dueDay: entry.dueDay || 1,
    });
    setActiveTab('overview');
  };

  const saveEntry = () => {
    if (!entryDraft.title.trim()) return;
    const payload: Partial<MoneyEntry> = {
      title: entryDraft.title.trim(),
      amount: Math.max(0, entryDraft.amount),
      type: entryDraft.type,
      category: entryDraft.category,
      date: entryDraft.date,
      linkedTaskId: entryDraft.linkedTaskId || null,
      linkedProjectId: entryDraft.linkedProjectId || null,
      notes: entryDraft.notes,
      includedInBudget: true,
      isRecurring: entryDraft.isRecurring,
      frequency: entryDraft.isRecurring ? entryDraft.frequency : 'one-time',
      annualInterestRate: entryDraft.annualInterestRate,
      principalBalance: entryDraft.principalBalance,
      dueDay: entryDraft.isRecurring ? entryDraft.dueDay : null,
      active: true,
      isPlannedVariable: false,
      isBalanceSnapshot: false,
    };

    if (editingEntryId) {
      updateMoneyEntry(editingEntryId, payload);
    } else {
      addMoneyEntry({ id: uid(), ...(payload as MoneyEntry) });
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('starrlign:money-add'));
    }
    setEditingEntryId(null);
    setEntryDraft(blankEntryDraft());
  };

  const startEditingVariable = (entry: MoneyEntry) => {
    setEditingVariableId(entry.id);
    setVariableDraft({
      title: entry.title,
      amount: entry.amount,
      type: entry.type,
      category: entry.category,
      date: entry.date,
      linkedTaskId: entry.linkedTaskId || '',
      linkedProjectId: entry.linkedProjectId || '',
      notes: entry.notes || '',
      isRecurring: true,
      frequency: entry.frequency || 'monthly',
      annualInterestRate: entry.annualInterestRate || 0,
      principalBalance: entry.principalBalance || 0,
      dueDay: entry.dueDay || 1,
    });
    setActiveTab('variables');
  };

  const saveVariable = () => {
    if (!variableDraft.title.trim()) return;
    const payload: Partial<MoneyEntry> = {
      title: variableDraft.title.trim(),
      amount: Math.max(0, variableDraft.amount),
      type: variableDraft.type,
      category: variableDraft.category,
      date: variableDraft.date,
      linkedTaskId: null,
      linkedProjectId: variableDraft.linkedProjectId || null,
      notes: variableDraft.notes,
      includedInBudget: false,
      isRecurring: true,
      frequency: variableDraft.frequency,
      annualInterestRate: variableDraft.annualInterestRate,
      principalBalance: variableDraft.principalBalance,
      dueDay: variableDraft.dueDay,
      active: true,
      isPlannedVariable: true,
      isBalanceSnapshot: false,
    };
    if (editingVariableId) {
      updateMoneyEntry(editingVariableId, payload);
    } else {
      addMoneyEntry({ id: uid(), ...(payload as MoneyEntry) });
    }
    setEditingVariableId(null);
    setVariableDraft(blankVariableDraft());
  };

  const postVariableNow = (entry: MoneyEntry) => {
    addMoneyEntry({
      ...entry,
      id: uid(),
      date: today(),
      includedInBudget: true,
      isPlannedVariable: false,
      isRecurring: false,
      notes: entry.notes ? `${entry.notes} • Posted from Money Variable` : 'Posted from Money Variable',
    });
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('starrlign:money-add'));
  };

  const reconcileBalance = () => {
    if (latestBalanceSnapshot) {
      updateMoneyEntry(latestBalanceSnapshot.id, { amount: reconcileAmount, date: today() });
    } else {
      addMoneyEntry({
        id: uid(),
        title: 'Current account balance',
        amount: reconcileAmount,
        type: 'income',
        category: 'balance',
        date: today(),
        linkedTaskId: null,
        linkedProjectId: null,
        includedInBudget: false,
        isBalanceSnapshot: true,
      });
    }
  };

  const fieldClass = 'border border-black rounded px-2 py-1.5 bg-white text-black';

  return (
    <div className="max-w-[1300px] mx-auto space-y-5">
      <div className="border-[2px] border-black rounded-2xl p-5 md:p-6 text-white shadow-[6px_6px_0_black] bg-[linear-gradient(140deg,#05381f_0%,#0f7a42_45%,#22c55e_100%)] relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/15 rounded-full blur-2xl" />
        <div className="absolute -left-10 -bottom-16 w-44 h-44 bg-[var(--brand-yellow)]/25 rounded-full blur-2xl" />
        <div className="flex flex-wrap gap-4 items-start justify-between relative z-10">
          <div>
            <div className="text-[10px] uppercase tracking-[2px] text-white/70">Money Lab // Truth before optimization</div>
            <h2 className="text-3xl md:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>KNOW THE NUMBER • CONTROL THE FLOW • BUILD THE STACK</h2>
            <div className="mt-3 inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border border-white/40 bg-white/10">
              <Trophy className="w-3.5 h-3.5" /> Level {moneyLevel} Money Pilot • System {moneySystemScore}% ready
            </div>
          </div>
          <div className="min-w-[260px] rounded-xl border border-white/35 bg-black/20 p-3 backdrop-blur-sm">
            <div className="text-[10px] uppercase tracking-[2px] text-white/70">Money Truth</div>
            <div className="text-3xl font-extrabold text-[var(--brand-yellow)]">
              {actualBalance === null ? 'NOT SET' : moneyFmt(actualBalance)}
            </div>
            <div className="text-[10px] mt-1 text-white/70">
              {latestBalanceSnapshot
                ? `Reconciled ${daysSinceReconcile === 0 ? 'today' : `${daysSinceReconcile} day${daysSinceReconcile === 1 ? '' : 's'} ago`}`
                : 'Enter the balance your bank shows right now'}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                type="number"
                value={reconcileAmount}
                onChange={(e) => setReconcileAmount(Number(e.target.value || 0))}
                className="min-w-0 flex-1 rounded border border-white/40 bg-white/10 px-2 py-1 text-sm text-white placeholder:text-white/50"
                placeholder="Actual balance"
              />
              <button onClick={reconcileBalance} className="rounded border border-black bg-[var(--brand-yellow)] px-2 py-1 text-xs font-bold text-black">
                Reconcile
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={cn('border-[2px] border-black rounded-xl p-4 shadow-[3px_3px_0_black] flex items-start gap-3', reconciliationFresh ? 'bg-green-50' : 'bg-yellow-50')}>
        {reconciliationFresh ? <CheckCircle2 className="w-5 h-5 text-[var(--brand-green)] shrink-0" /> : <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />}
        <div>
          <div className="font-bold text-sm">Next best money move</div>
          <div className="text-sm text-black/70">{coachTip}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <Metric icon={<ArrowUpRight className="w-3 h-3" />} label="Planned income" value={moneyFmt(plannedMonthlyIncome)} tone="green" />
        <Metric icon={<ArrowDownRight className="w-3 h-3" />} label="Fixed monthly" value={moneyFmt(variableMonthlyExpenses)} tone="red" />
        <Metric icon={<CreditCard className="w-3 h-3" />} label="Subscriptions" value={moneyFmt(subscriptionMonthly)} tone="orange" />
        <Metric icon={<Landmark className="w-3 h-3" />} label="Interest drag" value={moneyFmt(monthlyInterestDrag)} tone="red" />
        <Metric icon={<Target className="w-3 h-3" />} label="Free cash" value={moneyFmt(monthlyFreeCash)} tone={monthlyFreeCash >= 0 ? 'green' : 'red'} />
        <Metric icon={<Gem className="w-3 h-3" />} label="Savings rate" value={`${savingsRate}%`} tone={savingsRate >= 20 ? 'green' : 'black'} />
      </div>

      <div className="flex gap-2 flex-wrap">
        {([
          ['overview', 'EVENTS + BUDGETS'],
          ['variables', 'MONEY VARIABLES'],
          ['investments', 'INVESTMENTS'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            className={cn(
              'px-4 py-2 rounded-lg border-[2px] border-black text-xs font-bold tracking-wide shadow-[2px_2px_0_black]',
              activeTab === value ? 'bg-[var(--brand-yellow)] text-black' : 'bg-white text-black'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-4">
            <div className="border-[2px] border-black rounded-xl bg-white p-4 shadow-[3px_3px_0_black]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold flex items-center gap-2"><Wallet2 className="w-4 h-4" /> Budget Missions</h3>
                <button onClick={() => addBudget({ id: uid(), name: `Custom ${budgets.length + 1}`, limit: 500 })} className="text-xs px-2 py-1 border-[2px] border-black rounded bg-[var(--brand-yellow)]">
                  <Plus className="w-3 h-3 inline mr-1" /> Add budget
                </button>
              </div>
              <div className="space-y-2">
                {budgetStats.map(({ budget, income, expenses, available, usagePct }) => (
                  <div key={budget.id} className="border border-black/20 rounded-lg p-3 bg-slate-50">
                    <div className="flex items-center gap-2 flex-wrap">
                      <input value={budget.name} onChange={(e) => updateBudget(budget.id, { name: e.target.value })} className={fieldClass} />
                      <label className="text-xs">Monthly limit</label>
                      <input type="number" value={budget.limit} onChange={(e) => updateBudget(budget.id, { limit: Number(e.target.value || 0) })} className={`${fieldClass} w-[115px]`} />
                      <div className={cn('ml-auto text-xs font-bold px-2 py-0.5 rounded border border-black', available >= 0 ? 'bg-[var(--brand-green)] text-white' : 'bg-[var(--brand-red)] text-white')}>
                        {available >= 0 ? 'ON TRACK' : 'OVER BUDGET'}
                      </div>
                      <button onClick={() => deleteBudget(budget.id)} className="text-[var(--brand-red)]"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="text-xs mt-2 flex gap-3 flex-wrap">
                      <span>Income: {moneyFmt(income)}</span>
                      <span>Spent this month: {moneyFmt(expenses)}</span>
                      <span className="font-bold">Available: {moneyFmt(available)}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-black/10 overflow-hidden">
                      <div className={cn('h-full transition-all', usagePct > 100 ? 'bg-[var(--brand-red)]' : 'bg-[var(--brand-blue)]')} style={{ width: `${Math.min(100, usagePct)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <MoneyEntryForm
              draft={entryDraft}
              setDraft={setEntryDraft}
              projects={projects}
              tasks={tasks}
              fieldClass={fieldClass}
              isEditing={Boolean(editingEntryId)}
              onSave={saveEntry}
              onCancel={() => { setEditingEntryId(null); setEntryDraft(blankEntryDraft()); }}
            />
          </div>

          <div className="space-y-4">
            <div className="border-[2px] border-black rounded-xl bg-white p-4 shadow-[3px_3px_0_black]">
              <div className="flex items-center gap-2 mb-2"><Flame className="w-4 h-4 text-[var(--brand-red)]" /> Recent Money Activity</div>
              <div className="text-xs text-black/60 mb-3">This month: {moneyFmt(thisMonthIncome)} in • {moneyFmt(thisMonthSpent)} out</div>
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {recentActivity.map((entry) => (
                  <div key={entry.id} className="border border-black/15 rounded p-2 text-sm bg-slate-50">
                    <div className="flex items-center gap-2">
                      <strong className="truncate">{entry.title}</strong>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded uppercase border border-black/20', categoryColors[entry.category] || 'bg-black/10')}>{entry.category}</span>
                      <span className={cn('ml-auto font-bold', entry.type === 'income' ? 'text-[var(--brand-green)]' : 'text-[var(--brand-red)]')}>
                        {entry.type === 'income' ? '+' : '-'}{moneyFmt(entry.amount)}
                      </span>
                    </div>
                    <div className="text-xs text-black/60 mt-1 flex gap-2 flex-wrap">
                      <span>{entry.date}</span>
                      {entry.isRecurring && <span>• {frequencyLabel[entry.frequency || 'monthly']}</span>}
                      {entry.linkedProjectId && <span>• {projects.find((project) => project.id === entry.linkedProjectId)?.name}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => setMoneyEntryIncluded(entry.id, !entry.includedInBudget)} className={`text-xs px-2 py-0.5 border rounded ${entry.includedInBudget ? 'bg-[var(--brand-green)] text-white border-black' : 'bg-white text-black border-black/40'}`}>
                        {entry.includedInBudget ? 'In budget' : 'Excluded'}
                      </button>
                      <button onClick={() => startEditingEntry(entry)} className="ml-auto p-1 text-[var(--brand-blue)]" title="Edit event"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteMoneyEntry(entry.id)} className="p-1 text-[var(--brand-red)]" title="Delete event"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
                {recentActivity.length === 0 && <div className="text-sm text-black/60">No activity yet. Add your biggest recent purchases first.</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'variables' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-1">
            <MoneyVariableForm
              draft={variableDraft}
              setDraft={setVariableDraft}
              projects={projects}
              fieldClass={fieldClass}
              isEditing={Boolean(editingVariableId)}
              onSave={saveVariable}
              onCancel={() => { setEditingVariableId(null); setVariableDraft(blankVariableDraft()); }}
            />
          </div>
          <div className="xl:col-span-2 space-y-3">
            <div className="border-[2px] border-black rounded-xl bg-[var(--brand-yellow)]/20 p-4 shadow-[3px_3px_0_black]">
              <div className="font-bold flex items-center gap-2"><Repeat2 className="w-4 h-4" /> Variables = the money that repeats</div>
              <p className="text-sm text-black/70 mt-1">Use these for salary, rent, utilities, subscriptions, future income streams, LLC loans, and recurring business costs. Edit one number here when the rate changes.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {moneyVariables.map((entry) => {
                const monthly = monthlyEquivalent(entry.amount, entry.frequency);
                const interest = (entry.principalBalance || 0) * ((entry.annualInterestRate || 0) / 100) / 12;
                const project = projects.find((candidate) => candidate.id === entry.linkedProjectId);
                return (
                  <div key={entry.id} className={cn('border-[2px] border-black rounded-xl p-4 shadow-[3px_3px_0_black]', entry.active === false ? 'bg-slate-100 opacity-65' : entry.type === 'income' ? 'bg-green-50' : 'bg-white')}>
                    <div className="flex items-start gap-2">
                      <div>
                        <div className="font-bold text-lg">{entry.title}</div>
                        <div className="text-xs text-black/60">{frequencyLabel[entry.frequency || 'monthly']} • {entry.category}</div>
                      </div>
                      <div className={cn('ml-auto text-xl font-bold', entry.type === 'income' ? 'text-[var(--brand-green)]' : 'text-[var(--brand-red)]')}>
                        {entry.type === 'income' ? '+' : '-'}{moneyFmt(monthly)}/mo
                      </div>
                    </div>
                    {project && <div className="mt-2 text-xs flex items-center gap-1"><Link2 className="w-3 h-3" /> {project.icon} {project.name}</div>}
                    {interest > 0 && <div className="mt-2 text-xs font-bold text-[var(--brand-red)]">Estimated interest: {moneyFmt(interest)}/mo at {entry.annualInterestRate}% APR</div>}
                    {entry.notes && <div className="mt-2 text-xs text-black/65">{entry.notes}</div>}
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {entry.isPlannedVariable && (
                        <button onClick={() => postVariableNow(entry)} className="px-2 py-1 text-xs border border-black rounded bg-[var(--brand-green)] text-white">Post now</button>
                      )}
                      <button onClick={() => updateMoneyEntry(entry.id, { active: entry.active === false })} className="px-2 py-1 text-xs border border-black rounded bg-white">
                        {entry.active === false ? 'Activate' : 'Pause'}
                      </button>
                      <button onClick={() => startEditingVariable(entry)} className="ml-auto p-1 text-[var(--brand-blue)]"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteMoneyEntry(entry.id)} className="p-1 text-[var(--brand-red)]"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                );
              })}
              {moneyVariables.length === 0 && <div className="md:col-span-2 border-[2px] border-dashed border-black/40 rounded-xl p-8 text-center text-black/60">Add your HVAC salary first, then subscriptions and future income streams tied to StarrTree projects.</div>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'investments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="border-[2px] border-black rounded-xl bg-white p-4 shadow-[3px_3px_0_black]">
            <div className="flex items-center gap-2 mb-3"><TrendingUp className="w-4 h-4" /> Investment Arena</div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <input placeholder="Symbol" value={positionDraft.symbol} onChange={(e) => setPositionDraft((p) => ({ ...p, symbol: e.target.value.toUpperCase() }))} className={fieldClass} />
              <input type="number" placeholder="Shares" value={positionDraft.shares} onChange={(e) => setPositionDraft((p) => ({ ...p, shares: Number(e.target.value || 0) }))} className={fieldClass} />
              <input type="number" placeholder="Avg cost" value={positionDraft.avgCost} onChange={(e) => setPositionDraft((p) => ({ ...p, avgCost: Number(e.target.value || 0) }))} className={fieldClass} />
              <input type="number" placeholder="Current price" value={positionDraft.currentPrice} onChange={(e) => setPositionDraft((p) => ({ ...p, currentPrice: Number(e.target.value || 0) }))} className={fieldClass} />
              <button onClick={() => { if (!positionDraft.symbol) return; addInvestmentPosition({ id: uid(), ...positionDraft }); setPositionDraft({ symbol: '', shares: 0, avgCost: 0, currentPrice: 0 }); }} className="col-span-2 border-[2px] border-black rounded bg-[var(--brand-yellow)] px-2 py-1.5">
                Add position
              </button>
            </div>
            <div className="text-sm"><Sparkles className="w-4 h-4 inline mr-1" /> Portfolio: <strong>{moneyFmt(investmentSummary.totalValue)}</strong></div>
          </div>
          <div className="lg:col-span-2 border-[2px] border-black rounded-xl bg-white p-4 shadow-[3px_3px_0_black]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <Metric icon={<DollarSign className="w-3 h-3" />} label="Cost basis" value={moneyFmt(investmentSummary.totalCost)} tone="black" />
              <Metric icon={<Landmark className="w-3 h-3" />} label="Value" value={moneyFmt(investmentSummary.totalValue)} tone="green" />
              <Metric icon={<Gem className="w-3 h-3" />} label="P/L" value={moneyFmt(investmentSummary.pnl)} tone={investmentSummary.pnl >= 0 ? 'green' : 'red'} />
            </div>
            <div className="space-y-2">
              {investmentPositions.map((position) => {
                const pnl = position.shares * (position.currentPrice - position.avgCost);
                return (
                  <div key={position.id} className="flex items-center gap-3 border border-black/15 rounded p-3 text-sm bg-slate-50">
                    <div><div className="font-semibold">{position.symbol}</div><div className="text-xs text-black/65">{position.shares} shares @ {moneyFmt(position.avgCost)}</div></div>
                    <span className={cn('ml-auto font-bold', pnl >= 0 ? 'text-[var(--brand-green)]' : 'text-[var(--brand-red)]')}>{moneyFmt(pnl)}</span>
                    <button onClick={() => deleteInvestmentPosition(position.id)} className="text-[var(--brand-red)]"><Trash2 className="w-4 h-4" /></button>
                  </div>
                );
              })}
              {investmentPositions.length === 0 && <div className="text-sm text-black/60">No positions yet.</div>}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="border-[2px] border-black rounded-xl bg-[var(--brand-yellow)]/20 p-4 shadow-[3px_3px_0_black]">
          <div className="flex items-center gap-2 mb-1 text-sm font-bold"><Calculator className="w-4 h-4" /> Stable 9-to-5 income</div>
          <input type="number" value={baseIncomeMonthly} onChange={(e) => setBaseIncomeMonthly(Number(e.target.value || 0))} className="w-full border-[2px] border-black rounded px-3 py-2 mt-2 bg-white" />
          <div className="text-xs text-black/60 mt-1">Your HVAC project engineer take-home income per month.</div>
        </div>
        <div className="border-[2px] border-black rounded-xl bg-white p-4 shadow-[3px_3px_0_black]">
          <div className="text-xs uppercase tracking-wider text-black/60">Projected year-end position</div>
          <div className="text-2xl font-bold text-[var(--brand-green)]">{moneyFmt(projectedYearEnd)}</div>
          <div className="text-xs text-black/60">Uses your real balance, planned monthly flow, and current investments.</div>
        </div>
        <div className="border-[2px] border-black rounded-xl bg-white p-4 shadow-[3px_3px_0_black]">
          <div className="text-xs uppercase tracking-wider text-black/60">Annual subscription cost</div>
          <div className="text-2xl font-bold text-orange-600">{moneyFmt(subscriptionMonthly * 12)}</div>
          <div className="text-xs text-black/60">A yearly view makes small recurring charges feel real.</div>
        </div>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: 'green' | 'red' | 'orange' | 'black' }) {
  const toneClass = tone === 'green' ? 'text-[var(--brand-green)]' : tone === 'red' ? 'text-[var(--brand-red)]' : tone === 'orange' ? 'text-orange-600' : 'text-black';
  return (
    <div className="border-[2px] border-black rounded-xl bg-white p-3 shadow-[3px_3px_0_black]">
      <div className="text-[10px] uppercase tracking-[1.4px] text-black/60 flex items-center gap-1">{icon}{label}</div>
      <div className={cn('text-xl font-bold', toneClass)}>{value}</div>
    </div>
  );
}

function MoneyEntryForm({ draft, setDraft, projects, tasks, fieldClass, isEditing, onSave, onCancel }: {
  draft: EntryDraft;
  setDraft: React.Dispatch<React.SetStateAction<EntryDraft>>;
  projects: ReturnType<typeof useStore.getState>['projects'];
  tasks: ReturnType<typeof useStore.getState>['tasks'];
  fieldClass: string;
  isEditing: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="border-[2px] border-black rounded-xl bg-white p-4 shadow-[3px_3px_0_black]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold flex items-center gap-2"><Banknote className="w-4 h-4" /> {isEditing ? 'Edit Money Event' : 'Log New Money Event'}</h3>
        {isEditing && <button onClick={onCancel} className="p-1"><X className="w-4 h-4" /></button>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input placeholder="Title" value={draft.title} onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))} className={`sm:col-span-2 ${fieldClass}`} />
        <input type="number" placeholder="Amount" value={draft.amount} onChange={(e) => setDraft((prev) => ({ ...prev, amount: Number(e.target.value || 0) }))} className={fieldClass} />
        <select value={draft.type} onChange={(e) => setDraft((prev) => ({ ...prev, type: e.target.value as MoneyEntry['type'] }))} className={fieldClass}>
          <option value="expense">Expense</option><option value="income">Income</option><option value="investment">Investment</option>
        </select>
        <CategorySelect value={draft.category} onChange={(category) => setDraft((prev) => ({ ...prev, category }))} fieldClass={fieldClass} />
        <input type="date" value={draft.date} onChange={(e) => setDraft((prev) => ({ ...prev, date: e.target.value }))} className={fieldClass} />
        <select value={draft.linkedProjectId} onChange={(e) => setDraft((prev) => ({ ...prev, linkedProjectId: e.target.value }))} className={fieldClass}>
          <option value="">Optional project link</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.icon} {project.name}</option>)}
        </select>
        <select value={draft.linkedTaskId} onChange={(e) => setDraft((prev) => ({ ...prev, linkedTaskId: e.target.value }))} className={fieldClass}>
          <option value="">Optional task link</option>{tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
        </select>
        <textarea placeholder="Notes" value={draft.notes} onChange={(e) => setDraft((prev) => ({ ...prev, notes: e.target.value }))} className={`sm:col-span-2 min-h-[70px] ${fieldClass}`} />
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={draft.isRecurring} onChange={(e) => setDraft((prev) => ({ ...prev, isRecurring: e.target.checked }))} />
        This repeats or is a subscription
      </label>
      {draft.isRecurring && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 rounded-lg border border-black/20 bg-slate-50 p-3">
          <select value={draft.frequency} onChange={(e) => setDraft((prev) => ({ ...prev, frequency: e.target.value as MoneyFrequency }))} className={fieldClass}>
            {Object.entries(frequencyLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <input type="number" min="1" max="31" value={draft.dueDay} onChange={(e) => setDraft((prev) => ({ ...prev, dueDay: Number(e.target.value || 1) }))} className={fieldClass} placeholder="Due day" />
          <div className="text-xs flex items-center px-2">≈ {monthlyEquivalent(draft.amount, draft.frequency).toFixed(2)}/month</div>
        </div>
      )}
      {(draft.category === 'debt' || draft.annualInterestRate > 0 || draft.principalBalance > 0) && (
        <div className="grid grid-cols-2 gap-2 mt-2 rounded-lg border border-[var(--brand-red)]/30 bg-red-50 p-3">
          <input type="number" value={draft.principalBalance} onChange={(e) => setDraft((prev) => ({ ...prev, principalBalance: Number(e.target.value || 0) }))} className={fieldClass} placeholder="Loan balance" />
          <input type="number" step="0.01" value={draft.annualInterestRate} onChange={(e) => setDraft((prev) => ({ ...prev, annualInterestRate: Number(e.target.value || 0) }))} className={fieldClass} placeholder="APR %" />
        </div>
      )}
      <button onClick={onSave} className="mt-3 px-4 py-2 border-[2px] border-black rounded bg-[var(--brand-green)] text-white text-sm font-bold">
        {isEditing ? 'Update event' : 'Save event'}
      </button>
    </div>
  );
}

function MoneyVariableForm({ draft, setDraft, projects, fieldClass, isEditing, onSave, onCancel }: {
  draft: EntryDraft;
  setDraft: React.Dispatch<React.SetStateAction<EntryDraft>>;
  projects: ReturnType<typeof useStore.getState>['projects'];
  fieldClass: string;
  isEditing: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="border-[2px] border-black rounded-xl bg-white p-4 shadow-[3px_3px_0_black] sticky top-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold flex items-center gap-2"><RefreshCw className="w-4 h-4" /> {isEditing ? 'Edit Variable' : 'Add Money Variable'}</h3>
        {isEditing && <button onClick={onCancel}><X className="w-4 h-4" /></button>}
      </div>
      <div className="space-y-2">
        <input placeholder="Name: HVAC salary, Adobe, rent, LLC loan..." value={draft.title} onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))} className={`w-full ${fieldClass}`} />
        <div className="grid grid-cols-2 gap-2">
          <input type="number" value={draft.amount} onChange={(e) => setDraft((prev) => ({ ...prev, amount: Number(e.target.value || 0) }))} className={fieldClass} placeholder="Rate" />
          <select value={draft.frequency} onChange={(e) => setDraft((prev) => ({ ...prev, frequency: e.target.value as MoneyFrequency }))} className={fieldClass}>
            {Object.entries(frequencyLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select value={draft.type} onChange={(e) => setDraft((prev) => ({ ...prev, type: e.target.value as MoneyEntry['type'] }))} className={fieldClass}>
            <option value="expense">Expense</option><option value="income">Income stream</option><option value="investment">Investment contribution</option>
          </select>
          <CategorySelect value={draft.category} onChange={(category) => setDraft((prev) => ({ ...prev, category }))} fieldClass={fieldClass} />
        </div>
        <select value={draft.linkedProjectId} onChange={(e) => setDraft((prev) => ({ ...prev, linkedProjectId: e.target.value }))} className={`w-full ${fieldClass}`}>
          <option value="">Optional project or LLC link</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.icon} {project.name}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" min="1" max="31" value={draft.dueDay} onChange={(e) => setDraft((prev) => ({ ...prev, dueDay: Number(e.target.value || 1) }))} className={fieldClass} placeholder="Due day" />
          <div className="rounded border border-black/20 bg-slate-50 px-2 py-1.5 text-xs">Monthly: {monthlyEquivalent(draft.amount, draft.frequency).toFixed(2)}</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" value={draft.principalBalance} onChange={(e) => setDraft((prev) => ({ ...prev, principalBalance: Number(e.target.value || 0) }))} className={fieldClass} placeholder="Debt balance" />
          <input type="number" step="0.01" value={draft.annualInterestRate} onChange={(e) => setDraft((prev) => ({ ...prev, annualInterestRate: Number(e.target.value || 0) }))} className={fieldClass} placeholder="APR %" />
        </div>
        <textarea value={draft.notes} onChange={(e) => setDraft((prev) => ({ ...prev, notes: e.target.value }))} className={`w-full min-h-[80px] ${fieldClass}`} placeholder="What is this for? When can it change?" />
        <button onClick={onSave} className="w-full px-4 py-2 border-[2px] border-black rounded bg-[var(--brand-yellow)] text-black text-sm font-bold">
          {isEditing ? 'Update variable' : 'Add variable'}
        </button>
      </div>
    </div>
  );
}

function CategorySelect({ value, onChange, fieldClass }: { value: string; onChange: (value: string) => void; fieldClass: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass}>
      <option value="salary">Salary</option>
      <option value="work">Work</option>
      <option value="business">Business / LLC</option>
      <option value="music">Music</option>
      <option value="subscription">Subscription</option>
      <option value="housing">Rent / Housing</option>
      <option value="utilities">Utilities</option>
      <option value="debt">Debt / Loan</option>
      <option value="saving">Saving</option>
      <option value="personal">Personal</option>
    </select>
  );
}
