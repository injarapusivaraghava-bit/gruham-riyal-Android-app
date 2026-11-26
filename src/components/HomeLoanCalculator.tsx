import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  Sparkles, 
  Coins, 
  Calendar,
  Percent,
  CheckCircle2,
  FileDown,
  Download,
  Loader2,
  TableProperties,
  BarChart3
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { generateLoanAmortizationPDF } from '../lib/loanPdfGenerator';

export const HomeLoanCalculator: React.FC = () => {
  // States for user input
  const [loanAmount, setLoanAmount] = useState<number>(5000000); // 50 Lakhs default
  const [interestRate, setInterestRate] = useState<number>(8.5); // 8.5% default
  const [tenureYears, setTenureYears] = useState<number>(20); // 20 years default

  // Export & View states
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);
  const [activeViewTab, setActiveViewTab] = useState<'visuals' | 'schedule'>('visuals');

  // EMI calculations
  const emiDetails = useMemo(() => {
    const P = loanAmount;
    const r = interestRate / 12 / 100;
    const n = tenureYears * 12;

    let emi = 0;
    if (interestRate === 0) {
      emi = P / n;
    } else {
      emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }

    const totalPayment = emi * n;
    const totalInterest = totalPayment - P;

    // Generate year-wise amortization for charts, tables & PDF export
    const yearlyAmortization = [];
    let remainingPrincipal = P;
    
    for (let year = 1; year <= tenureYears; year++) {
      const openingBalance = remainingPrincipal;
      let principalPaidThisYear = 0;
      let interestPaidThisYear = 0;

      for (let month = 1; month <= 12; month++) {
        const interestForMonth = remainingPrincipal * r;
        const principalForMonth = emi - interestForMonth;
        
        if (remainingPrincipal > 0) {
          interestPaidThisYear += interestForMonth;
          principalPaidThisYear += Math.min(principalForMonth, remainingPrincipal);
          remainingPrincipal -= principalForMonth;
          if (remainingPrincipal < 0) remainingPrincipal = 0;
        }
      }

      yearlyAmortization.push({
        year: `Year ${year}`,
        yearNum: year,
        openingBalance: Math.round(openingBalance),
        annualEmi: Math.round(principalPaidThisYear + interestPaidThisYear),
        principalPaid: Math.round(principalPaidThisYear),
        interestPaid: Math.round(interestPaidThisYear),
        closingBalance: Math.round(remainingPrincipal),
        'Principal (అసలు)': Math.round(principalPaidThisYear),
        'Interest (వడ్డీ)': Math.round(interestPaidThisYear),
      });
    }

    return {
      monthlyEmi: Math.round(emi),
      totalPayment: Math.round(totalPayment),
      totalInterest: Math.round(totalInterest),
      yearlyData: yearlyAmortization
    };
  }, [loanAmount, interestRate, tenureYears]);

  // Handle PDF Export
  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      await generateLoanAmortizationPDF({
        loanAmount,
        interestRate,
        tenureYears,
        monthlyEmi: emiDetails.monthlyEmi,
        totalPayment: emiDetails.totalPayment,
        totalInterest: emiDetails.totalInterest,
        yearlySchedule: emiDetails.yearlyData,
      });
      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
      }, 4000);
    } catch (error) {
      console.error('Error generating PDF report:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Data for Pie Chart
  const pieData = [
    { name: 'అసలు మొత్తం (Principal)', value: loanAmount, color: '#f59e0b' }, // Amber-500
    { name: 'మొత్తం వడ్డీ (Total Interest)', value: emiDetails.totalInterest, color: '#78716c' }, // Stone-500
  ];

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="bg-white border border-stone-200 rounded-3xl p-6 md:p-8 space-y-8 shadow-xs">
      
      {/* Header Info & Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl shrink-0">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-black text-stone-900 text-lg md:text-xl flex items-center gap-2">
              హోమ్ లోన్ ఈఎంఐ క్యాలిక్యులేటర్ (Home Loan EMI Calculator)
            </h3>
            <p className="text-stone-500 text-xs mt-1 leading-relaxed">
              మీ డ్రీమ్ హోమ్ బడ్జెట్ ప్లాన్ చేసుకోవడానికి కావలసిన లోన్ మొత్తం, వడ్డీ రేటు, కాలపరిమితి లెక్కించుకోండి మరియు PDF రిపోర్ట్ డౌన్‌లోడ్ చేసుకోండి.
            </p>
          </div>
        </div>

        {/* Top Prominent PDF Export Button */}
        <div className="shrink-0 flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border active:scale-95 ${
              exportSuccess
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white border-amber-600 hover:border-amber-700'
            } disabled:opacity-60 disabled:cursor-not-allowed`}
            title="Export EMI calculation results and Amortization Schedule to PDF"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>PDF తయారవుతోంది... (Generating...)</span>
              </>
            ) : exportSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                <span>PDF డౌన్‌లోడ్ పూర్తయింది! (Downloaded!)</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 text-amber-100" />
                <span>PDF ఎక్స్‌పోర్ట్ (Export to PDF)</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Controls / Inputs & Summary */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Input 1: Loan Amount */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-600" />
                లోన్ మొత్తం (Loan Amount)
              </label>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-stone-400 font-bold font-mono">₹</span>
                <input
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Math.max(100000, Number(e.target.value)))}
                  className="w-28 px-2 py-1 text-xs font-mono font-bold text-right border border-stone-200 rounded-lg focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
            <input
              type="range"
              min="100000"
              max="20000000"
              step="50000"
              value={loanAmount}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400 font-bold font-mono">
              <span>₹1 L</span>
              <span>₹50 L</span>
              <span>₹1 Cr</span>
              <span>₹2 Cr</span>
            </div>
          </div>

          {/* Input 2: Interest Rate */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-amber-600" />
                వడ్డీ రేటు (Interest Rate % p.a.)
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.1"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Math.max(0.1, Number(e.target.value)))}
                  className="w-20 px-2 py-1 text-xs font-mono font-bold text-right border border-stone-200 rounded-lg focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-stone-400 font-bold">%</span>
              </div>
            </div>
            <input
              type="range"
              min="5"
              max="20"
              step="0.1"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400 font-bold font-mono">
              <span>5%</span>
              <span>10%</span>
              <span>15%</span>
              <span>20%</span>
            </div>
          </div>

          {/* Input 3: Tenure Years */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-600" />
                కాలపరిమితి (Tenure - Years)
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={tenureYears}
                  onChange={(e) => setTenureYears(Math.max(1, Math.min(30, Number(e.target.value))))}
                  className="w-16 px-2 py-1 text-xs font-mono font-bold text-right border border-stone-200 rounded-lg focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-stone-400 font-bold">Yrs</span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={tenureYears}
              onChange={(e) => setTenureYears(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400 font-bold font-mono">
              <span>1 Yr</span>
              <span>10 Yrs</span>
              <span>20 Yrs</span>
              <span>30 Yrs</span>
            </div>
          </div>

          {/* Summary Dashboard cards */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-4">
            <div className="text-center p-3.5 bg-amber-50 border border-amber-200/50 rounded-xl">
              <span className="text-[10px] uppercase font-black tracking-wider text-amber-800">నెలవారీ ఈఎంఐ (Monthly EMI)</span>
              <p className="text-2xl font-black font-mono text-amber-600 mt-1">{formatCurrency(emiDetails.monthlyEmi)}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-white border border-stone-150 p-3 rounded-xl">
                <span className="text-[9px] text-stone-400 font-bold block uppercase">అసలు మొత్తం (Principal)</span>
                <span className="text-xs font-black font-mono text-stone-700 mt-0.5 block">{formatCurrency(loanAmount)}</span>
              </div>
              <div className="bg-white border border-stone-150 p-3 rounded-xl">
                <span className="text-[9px] text-stone-400 font-bold block uppercase">మొత్తం వడ్డీ (Total Interest)</span>
                <span className="text-xs font-black font-mono text-stone-700 mt-0.5 block">{formatCurrency(emiDetails.totalInterest)}</span>
              </div>
            </div>

            <div className="border-t border-stone-200/60 pt-3 flex justify-between items-center px-1">
              <span className="text-[10px] font-bold text-stone-500">మొత్తం చెల్లింపు (Total Amount Payable)</span>
              <span className="text-xs font-black font-mono text-stone-800">{formatCurrency(emiDetails.totalPayment)}</span>
            </div>

            {/* Quick Action in summary card */}
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="w-full py-2.5 px-3 bg-white hover:bg-amber-50/80 text-amber-900 border border-amber-200 hover:border-amber-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
              ) : (
                <Download className="w-3.5 h-3.5 text-amber-600" />
              )}
              <span>షెడ్యూల్ PDF డౌన్‌లోడ్ (Download PDF Report)</span>
            </button>
          </div>

        </div>

        {/* Right column: Charts & Visualizations OR Amortization Schedule Table */}
        <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
          
          {/* View Mode Switcher Header */}
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveViewTab('visuals')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeViewTab === 'visuals'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>గ్రాఫ్‌లు (Visual Charts)</span>
              </button>

              <button
                onClick={() => setActiveViewTab('schedule')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeViewTab === 'schedule'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                <TableProperties className="w-3.5 h-3.5" />
                <span>చెల్లింపు పట్టిక (Amortization Schedule)</span>
                <span className="text-[10px] bg-amber-200/80 text-amber-950 font-mono px-1.5 py-0.2 rounded-full font-bold">
                  {tenureYears} Yrs
                </span>
              </button>
            </div>

            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer transition-colors"
              title="Download PDF"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>
          </div>

          {/* Conditional Rendering: Visual Charts OR Amortization Table */}
          {activeViewTab === 'visuals' ? (
            <div className="space-y-6">
              
              {/* Pie Chart Box */}
              <div className="bg-stone-50 border border-stone-200/60 rounded-2xl p-4 space-y-4">
                <h4 className="font-bold text-xs text-stone-800 uppercase tracking-wide flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  విజువలైజేషన్ గ్రాఫ్స్ (EMI Breakup)
                </h4>

                {/* Twin charts layout */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  
                  {/* Pie Chart: 5 cols */}
                  <div className="md:col-span-5 h-44 relative flex flex-col items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center label */}
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-[9px] text-stone-400 font-extrabold uppercase">Interest</span>
                      <span className="text-xs font-black font-mono text-stone-700">
                        {Math.round((emiDetails.totalInterest / emiDetails.totalPayment) * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Legends list: 7 cols */}
                  <div className="md:col-span-7 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-3 h-3 rounded-sm bg-amber-500 shrink-0 mt-1"></div>
                      <div>
                        <p className="text-[11px] font-extrabold text-stone-700 leading-none">అసలు మొత్తం (Principal Amount)</p>
                        <p className="text-[10px] text-stone-400 mt-1">
                          {formatCurrency(loanAmount)} ({((loanAmount / emiDetails.totalPayment) * 100).toFixed(1)}%)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-3 h-3 rounded-sm bg-stone-500 shrink-0 mt-1"></div>
                      <div>
                        <p className="text-[11px] font-extrabold text-stone-700 leading-none">మొత్తం వడ్డీ (Total Interest Payable)</p>
                        <p className="text-[10px] text-stone-400 mt-1">
                          {formatCurrency(emiDetails.totalInterest)} ({((emiDetails.totalInterest / emiDetails.totalPayment) * 100).toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Amortization schedule bar chart */}
              <div className="bg-stone-50 border border-stone-200/60 rounded-2xl p-4 space-y-3">
                <span className="text-[10px] text-stone-500 font-extrabold uppercase tracking-wider block">
                  సంవత్సరాల వారీ అసలు & వడ్డీ చెల్లింపులు (Yearly Payment Trend)
                </span>
                <div className="h-52 w-full text-[10px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={emiDetails.yearlyData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="year" stroke="#888888" fontSize={9} />
                      <YAxis stroke="#888888" fontSize={9} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend fontSize={10} verticalAlign="top" height={24} />
                      <Bar dataKey="Principal (అసలు)" stackId="a" fill="#f59e0b" />
                      <Bar dataKey="Interest (వడ్డీ)" stackId="a" fill="#78716c" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          ) : (
            /* Tab: Detailed Amortization Table on Screen */
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-stone-800 uppercase tracking-wide flex items-center gap-1.5">
                    <TableProperties className="w-4 h-4 text-amber-600" />
                    సంవత్సరాల వారీ రీపేమెంట్ పట్టిక (Amortization Schedule)
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    ప్రతి సంవత్సరానికి చెల్లించాల్సిన అసలు, వడ్డీ మరియు మిగిలిన బ్యాలెన్స్ వివరాలు.
                  </p>
                </div>
                <button
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer shrink-0"
                >
                  {isExporting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <FileDown className="w-3 h-3" />
                  )}
                  <span>PDF డౌన్‌లోడ్</span>
                </button>
              </div>

              {/* Scrollable Table */}
              <div className="overflow-x-auto max-h-96 rounded-xl border border-stone-200 bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 text-stone-700 font-bold sticky top-0 border-b border-stone-200 z-10">
                    <tr>
                      <th className="py-2.5 px-3">సంవత్సరం (Year)</th>
                      <th className="py-2.5 px-3 text-right">ప్రారంభ బ్యాలెన్స్</th>
                      <th className="py-2.5 px-3 text-right">వార్షిక EMI</th>
                      <th className="py-2.5 px-3 text-right text-amber-700">అసలు (Principal)</th>
                      <th className="py-2.5 px-3 text-right text-stone-600">వడ్డీ (Interest)</th>
                      <th className="py-2.5 px-3 text-right">ముగింపు బ్యాలెన్స్</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                    {emiDetails.yearlyData.map((row) => (
                      <tr key={row.yearNum} className="hover:bg-amber-50/40 transition-colors">
                        <td className="py-2 px-3 font-bold text-stone-800 font-sans">{row.year}</td>
                        <td className="py-2 px-3 text-right text-stone-600">{formatCurrency(row.openingBalance)}</td>
                        <td className="py-2 px-3 text-right text-stone-700 font-bold">{formatCurrency(row.annualEmi)}</td>
                        <td className="py-2 px-3 text-right text-amber-700 font-bold">{formatCurrency(row.principalPaid)}</td>
                        <td className="py-2 px-3 text-right text-stone-500">{formatCurrency(row.interestPaid)}</td>
                        <td className="py-2 px-3 text-right text-stone-800 font-semibold">{formatCurrency(row.closingBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-stone-100 font-bold text-stone-800 border-t-2 border-stone-300 font-mono text-xs">
                    <tr>
                      <td className="py-2.5 px-3 font-sans">మొత్తం (Total)</td>
                      <td className="py-2.5 px-3 text-right">-</td>
                      <td className="py-2.5 px-3 text-right">{formatCurrency(emiDetails.totalPayment)}</td>
                      <td className="py-2.5 px-3 text-right text-amber-700">{formatCurrency(loanAmount)}</td>
                      <td className="py-2.5 px-3 text-right text-stone-700">{formatCurrency(emiDetails.totalInterest)}</td>
                      <td className="py-2.5 px-3 text-right">₹0</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Advisory message */}
      <div className="p-4 bg-amber-50/40 border border-amber-200/30 rounded-2xl flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-[11px] text-stone-600 leading-relaxed">
          <strong>మనం గృహం సలహా (Mana Gruham Expert Tip):</strong> సాధారణంగా బ్యాంకులు నెలవారీ ఆదాయంలో 40-50% లోపు EMI ఉండేలా లోన్ ఇవ్వడానికి మొగ్గు చూపుతాయి. మీ గృహ కలలను నిజం చేసుకోవడానికి పైన ఉన్న <strong>"PDF ఎక్స్‌పోర్ట్"</strong> బటన్ నొక్కి మీ లోన్ డాక్యుమెంట్లు మరియు రీపేమెంట్ చార్ట్‌ను సులభంగా రికార్డుల కోసం సేవ్ చేసుకోండి.
        </div>
      </div>

    </div>
  );
};
