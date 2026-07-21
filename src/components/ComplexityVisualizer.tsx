import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  Sparkles, 
  BookOpen, 
  TrendingUp, 
  Activity, 
  Database,
  Cpu,
  Info,
  Sliders,
  Zap,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Approach {
  name: string;
  description: string;
  code: string;
  timeComplexity: string;
  timeComplexityReason?: string;
  spaceComplexity: string;
  spaceComplexityReason?: string;
  pros: string[];
  cons: string[];
}

interface ComplexityVisualizerProps {
  isOpen: boolean;
  onClose: () => void;
  approach: Approach;
  isDark: boolean;
}

type ComplexityType = "O(1)" | "O(log N)" | "O(N)" | "O(N log N)" | "O(N^2)" | "O(2^N)";

function parseComplexity(complexityString: string): ComplexityType {
  const normalized = complexityString.replace(/\s+/g, "").toUpperCase();
  if (normalized.includes("O(1)")) return "O(1)";
  if (normalized.includes("O(LOGN)")) return "O(log N)";
  if (normalized.includes("O(NLOGN)")) return "O(N log N)";
  if (normalized.includes("O(N^2)") || normalized.includes("O(N2)") || normalized.includes("O(N*N)")) return "O(N^2)";
  if (normalized.includes("O(N)")) return "O(N)";
  if (normalized.includes("O(2^N)") || normalized.includes("O(2N)")) return "O(2^N)";
  return "O(N)"; // fallback
}

export default function ComplexityVisualizer({ isOpen, onClose, approach, isDark }: ComplexityVisualizerProps) {
  const timeComp = parseComplexity(approach.timeComplexity);
  const spaceComp = parseComplexity(approach.spaceComplexity);

  const [activeTab, setActiveTab] = useState<"chart" | "simulation">("chart");
  const [inputSize, setInputSize] = useState<number>(100);
  
  // Simulation States
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simStep, setSimStep] = useState<number>(0);
  const [simOuter, setSimOuter] = useState<number>(0);
  const [simInner, setSimInner] = useState<number>(0);
  const [simBoundL, setSimBoundL] = useState<number>(0);
  const [simBoundR, setSimBoundR] = useState<number>(15);
  const [simMid, setSimMid] = useState<number>(-1);
  const [simArray, setSimArray] = useState<number[]>([12, 17, 24, 29, 35, 41, 48, 53, 59, 65, 72, 80, 84, 91, 95, 99]);
  const [simOperationsCount, setSimOperationsCount] = useState<number>(0);
  const [simSpeed, setSimSpeed] = useState<number>(200); // ms per step

  // Recursion Tree nodes for O(2^N) simulation
  const [treeNodes, setTreeNodes] = useState<{ id: number; label: string; active: boolean; parentId?: number }[]>([
    { id: 1, label: "fib(4)", active: true }
  ]);

  // Handle simulation intervals
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      runSimulationStep();
    }, simSpeed);

    return () => clearInterval(interval);
  }, [isSimulating, simStep, simOuter, simInner, simBoundL, simBoundR, simSpeed, timeComp]);

  // Restart Simulation
  const handleResetSimulation = () => {
    setIsSimulating(false);
    setSimStep(0);
    setSimOuter(0);
    setSimInner(0);
    setSimBoundL(0);
    setSimBoundR(15);
    setSimMid(-1);
    setSimOperationsCount(0);
    if (timeComp === "O(2^N)") {
      setTreeNodes([{ id: 1, label: "fib(4)", active: true }]);
    }
  };

  useEffect(() => {
    handleResetSimulation();
  }, [timeComp]);

  const runSimulationStep = () => {
    setSimOperationsCount(prev => prev + 1);

    if (timeComp === "O(1)") {
      // Direct access simulation is just a single high-impact step
      setSimStep(prev => prev + 1);
      setIsSimulating(false);
    } 
    else if (timeComp === "O(N)") {
      if (simStep < 15) {
        setSimStep(prev => prev + 1);
      } else {
        setIsSimulating(false);
      }
    } 
    else if (timeComp === "O(log N)") {
      if (simBoundL <= simBoundR) {
        const mid = Math.floor((simBoundL + simBoundR) / 2);
        setSimMid(mid);
        setSimStep(prev => prev + 1);

        // Simulate searching for a specific item, e.g., 80 at index 11
        const target = 80;
        const currentVal = simArray[mid];
        
        if (currentVal === target) {
          setIsSimulating(false);
        } else if (currentVal < target) {
          setSimBoundL(mid + 1);
        } else {
          setSimBoundR(mid - 1);
        }
      } else {
        setIsSimulating(false);
      }
    } 
    else if (timeComp === "O(N^2)") {
      // Double loop simulation
      // array size = 8 for a clean visual grid
      const arraySize = 6;
      if (simInner < arraySize - 1) {
        setSimInner(prev => prev + 1);
      } else if (simOuter < arraySize - 1) {
        setSimOuter(prev => prev + 1);
        setSimInner(0);
      } else {
        setIsSimulating(false);
      }
      setSimStep(prev => prev + 1);
    } 
    else if (timeComp === "O(N log N)") {
      // Divide & Conquer split and merge simulation
      if (simStep < 18) {
        setSimStep(prev => prev + 1);
      } else {
        setIsSimulating(false);
      }
    } 
    else if (timeComp === "O(2^N)") {
      // Recursion Tree expansion simulation
      const nextSteps: Record<number, () => void> = {
        0: () => setTreeNodes(prev => [...prev, { id: 2, label: "fib(3)", active: true, parentId: 1 }, { id: 3, label: "fib(2)", active: true, parentId: 1 }]),
        1: () => setTreeNodes(prev => [...prev, { id: 4, label: "fib(2)", active: true, parentId: 2 }, { id: 5, label: "fib(1)", active: true, parentId: 2 }]),
        2: () => setTreeNodes(prev => [...prev, { id: 6, label: "fib(1)", active: true, parentId: 3 }, { id: 7, label: "fib(0)", active: true, parentId: 3 }]),
        3: () => setTreeNodes(prev => [...prev, { id: 8, label: "fib(1)", active: true, parentId: 4 }, { id: 9, label: "fib(0)", active: true, parentId: 4 }]),
      };

      if (nextSteps[simStep]) {
        nextSteps[simStep]();
        setSimStep(prev => prev + 1);
      } else {
        setIsSimulating(false);
      }
    }
  };

  // Big O Mathematical growth calculator
  const calculateOperations = (comp: ComplexityType, n: number): { value: number; label: string; warning?: boolean } => {
    switch (comp) {
      case "O(1)":
        return { value: 1, label: "1 exact lookup operation" };
      case "O(log N)":
        const logVal = Math.ceil(Math.log2(n));
        return { value: logVal, label: `${logVal} operations (halving search space)` };
      case "O(N)":
        return { value: n, label: `${n.toLocaleString()} linear operations` };
      case "O(N log N)":
        const nLogNVal = Math.ceil(n * Math.log2(n));
        return { value: nLogNVal, label: `${nLogNVal.toLocaleString()} operations (split & merge)` };
      case "O(N^2)":
        const nSquareVal = n * n;
        const squareWarning = nSquareVal > 1000000;
        return { 
          value: nSquareVal, 
          label: `${nSquareVal.toLocaleString()} iterations (nested comparison matrix)`,
          warning: squareWarning
        };
      case "O(2^N)":
        const expVal = Math.pow(2, Math.min(n, 30));
        const expWarning = n > 15;
        return { 
          value: expVal, 
          label: expVal >= 1000000000 ? `${expVal.toExponential(2)} operations (EXHAUSTED CRASH)` : `${expVal.toLocaleString()} operations (recursive stack explosion)`,
          warning: expWarning
        };
    }
  };

  const calculatedTime = calculateOperations(timeComp, inputSize);
  const calculatedSpace = calculateOperations(spaceComp, inputSize);

  // SVG coordinates generator for Plotting Big-O Curves
  const renderBigOCurves = () => {
    const width = 360;
    const height = 240;
    const padding = 20;

    const points = {
      "O(1)": [] as string[],
      "O(log N)": [] as string[],
      "O(N)": [] as string[],
      "O(N log N)": [] as string[],
      "O(N^2)": [] as string[],
      "O(2^N)": [] as string[],
    };

    // Plot curves
    for (let x = 1; x <= 100; x++) {
      const px = padding + (x / 100) * (width - 2 * padding);
      
      // O(1)
      const yO1 = height - padding - 15;
      points["O(1)"].push(`${px},${yO1}`);

      // O(log N)
      const yLog = height - padding - 15 - Math.log2(x) * 15;
      points["O(log N)"].push(`${px},${Math.max(padding, yLog)}`);

      // O(N)
      const yLinear = height - padding - (x / 100) * (height - 2 * padding);
      points["O(N)"].push(`${px},${Math.max(padding, yLinear)}`);

      // O(N log N)
      const yNLog = height - padding - ((x * Math.log2(x + 1)) / 700) * (height - 2 * padding);
      points["O(N log N)"].push(`${px},${Math.max(padding, yNLog)}`);

      // O(N^2)
      const ySquare = height - padding - (Math.pow(x, 2) / 10000) * (height - 2 * padding);
      points["O(N^2)"].push(`${px},${Math.max(padding, ySquare)}`);

      // O(2^N)
      const yExp = height - padding - (Math.pow(2, Math.min(x, 10)) / 1024) * (height - 2 * padding);
      points["O(2^N)"].push(`${px},${Math.max(padding, yExp)}`);
    }

    // Get active curve point representing the current user setting
    const scaledX = padding + (Math.min(inputSize, 100) / 100) * (width - 2 * padding);
    let activeY = height - padding - 15;
    if (timeComp === "O(log N)") {
      activeY = height - padding - 15 - Math.log2(Math.min(inputSize, 100)) * 15;
    } else if (timeComp === "O(N)") {
      activeY = height - padding - (Math.min(inputSize, 100) / 100) * (height - 2 * padding);
    } else if (timeComp === "O(N log N)") {
      const safeX = Math.min(inputSize, 100);
      activeY = height - padding - ((safeX * Math.log2(safeX + 1)) / 700) * (height - 2 * padding);
    } else if (timeComp === "O(N^2)") {
      activeY = height - padding - (Math.pow(Math.min(inputSize, 100), 2) / 10000) * (height - 2 * padding);
    } else if (timeComp === "O(2^N)") {
      activeY = height - padding - (Math.pow(2, Math.min(inputSize, 10)) / 1024) * (height - 2 * padding);
    }
    activeY = Math.max(padding + 5, Math.min(height - padding - 5, activeY));

    return (
      <div className="relative border border-[#E5E5EA] dark:border-[#2D2D34] rounded-2xl bg-slate-50 dark:bg-[#1A1A22] p-4 flex flex-col items-center">
        <span className="text-[10px] font-mono text-[#86868B] dark:text-slate-400 mb-2 uppercase tracking-widest self-start">Operations Growth Curve (y) vs Input Size (x)</span>
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          {/* Grid lines */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#D2D2D7" strokeWidth="1.5" strokeDasharray="3,3" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#D2D2D7" strokeWidth="1.5" strokeDasharray="3,3" />

          {/* Curves */}
          <polyline fill="none" stroke="#22C55E" strokeWidth="2.5" points={points["O(1)"].join(" ")} className="opacity-40 hover:opacity-100 transition-opacity" />
          <polyline fill="none" stroke="#3B82F6" strokeWidth="2.5" points={points["O(log N)"].join(" ")} className="opacity-40 hover:opacity-100 transition-opacity" />
          <polyline fill="none" stroke="#F59E0B" strokeWidth="2.5" points={points["O(N)"].join(" ")} className="opacity-40 hover:opacity-100 transition-opacity" />
          <polyline fill="none" stroke="#8B5CF6" strokeWidth="2.5" points={points["O(N log N)"].join(" ")} className="opacity-40 hover:opacity-100 transition-opacity" />
          <polyline fill="none" stroke="#EF4444" strokeWidth="2.5" points={points["O(N^2)"].join(" ")} className="opacity-40 hover:opacity-100 transition-opacity" />
          <polyline fill="none" stroke="#EC4899" strokeWidth="2.5" points={points["O(2^N)"].join(" ")} className="opacity-40 hover:opacity-100 transition-opacity" />

          {/* Highlighted Curve for Active Approach */}
          <polyline 
            fill="none" 
            stroke="url(#gradientGlow)" 
            strokeWidth="4" 
            points={points[timeComp].join(" ")} 
          />

          {/* Glowing node at active settings */}
          <g>
            <circle cx={scaledX} cy={activeY} r="8" className="fill-indigo-500 animate-ping opacity-30" />
            <circle cx={scaledX} cy={activeY} r="5" className="fill-indigo-600 dark:fill-indigo-400 stroke-white dark:stroke-[#1A1A22]" strokeWidth="2" />
          </g>

          <defs>
            <linearGradient id="gradientGlow" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#D946EF" />
            </linearGradient>
          </defs>
        </svg>

        {/* Legend */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3 w-full border-t border-[#E5E5EA]/60 dark:border-[#2D2D34]/50 pt-3">
          <div className="flex items-center gap-1.5 text-[9px] font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
            <span className={timeComp === "O(1)" ? "font-bold text-indigo-600 dark:text-indigo-400 underline" : "text-slate-500"}>O(1)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
            <span className={timeComp === "O(log N)" ? "font-bold text-indigo-600 dark:text-indigo-400 underline" : "text-slate-500"}>O(log N)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
            <span className={timeComp === "O(N)" ? "font-bold text-indigo-600 dark:text-indigo-400 underline" : "text-slate-500"}>O(N)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
            <span className={timeComp === "O(N log N)" ? "font-bold text-indigo-600 dark:text-indigo-400 underline" : "text-slate-500"}>O(N log N)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
            <span className={timeComp === "O(N^2)" ? "font-bold text-indigo-600 dark:text-indigo-400 underline" : "text-slate-500"}>O(N²)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EC4899]" />
            <span className={timeComp === "O(2^N)" ? "font-bold text-indigo-600 dark:text-indigo-400 underline" : "text-slate-500"}>O(2ⁿ)</span>
          </div>
        </div>
      </div>
    );
  };

  // Visual simulation views
  const renderSimulationView = () => {
    switch (timeComp) {
      case "O(1)":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold font-mono text-[#1D1D1F] dark:text-slate-100">Constant Time Address Lookup</span>
              <span className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 px-2 py-0.5 rounded">Exact Offset lookup</span>
            </div>
            
            <div className="flex justify-center gap-2 py-6">
              {simArray.slice(0, 8).map((val, idx) => {
                const isActive = simStep > 0 && idx === 3;
                return (
                  <motion.div
                    key={idx}
                    animate={{
                      scale: isActive ? 1.15 : 1,
                      backgroundColor: isActive ? "#F59E0B" : isDark ? "#2A2A35" : "#FFFFFF"
                    }}
                    className={`w-12 h-12 flex flex-col items-center justify-center border rounded-xl text-xs font-bold font-mono ${
                      isActive ? "text-white border-amber-500 shadow-lg" : "text-slate-700 dark:text-slate-300 border-[#E5E5EA] dark:border-[#2D2D34]"
                    }`}
                  >
                    <span className="text-[8px] opacity-60">[{idx}]</span>
                    <span>{val}</span>
                  </motion.div>
                );
              })}
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed max-w-md mx-auto">
              With <strong className="text-emerald-500 font-mono">O(1)</strong> complexity, the computer accesses slot <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">[3]</code> directly using an offset arithmetic operation without scanning. Size of dataset has absolutely zero impact!
            </p>
          </div>
        );

      case "O(log N)":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold font-mono text-[#1D1D1F] dark:text-slate-100">Binary Search Subdivision (Divide & Conquer)</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">Step: {simStep}</span>
            </div>

            <div className="flex flex-wrap justify-center gap-1.5 py-4">
              {simArray.map((val, idx) => {
                const isEliminated = idx < simBoundL || idx > simBoundR;
                const isMid = idx === simMid;
                const isCurrentBounds = idx === simBoundL || idx === simBoundR;
                
                let bgColor = isDark ? "#2A2A35" : "#FFFFFF";
                let textColor = isDark ? "text-slate-300" : "text-slate-700";
                let borderColor = isDark ? "border-[#2D2D34]" : "border-[#E5E5EA]";

                if (isMid) {
                  bgColor = "#6366F1";
                  textColor = "text-white";
                  borderColor = "border-indigo-500";
                } else if (isEliminated) {
                  bgColor = "transparent";
                  textColor = "text-slate-300 dark:text-slate-600 line-through opacity-30";
                  borderColor = "border-dashed border-slate-200 dark:border-slate-800/40";
                } else if (isCurrentBounds) {
                  bgColor = isDark ? "#1C2434" : "#EEF2F6";
                  borderColor = "border-blue-400";
                }

                return (
                  <motion.div
                    key={idx}
                    animate={{ scale: isMid ? 1.1 : 1 }}
                    className={`w-9 h-11 flex flex-col items-center justify-center border rounded-lg text-xs font-mono font-bold ${borderColor} ${textColor}`}
                    style={{ backgroundColor: bgColor }}
                  >
                    <span className="text-[7px] opacity-60">[{idx}]</span>
                    <span>{val}</span>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex justify-center gap-6 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-400 rounded-full" /> Range Boundary</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-indigo-500 rounded-full" /> Midpoint Pivot</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 border border-dashed border-slate-300 rounded-full" /> Discarded</span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed">
              Binary search halves the search range in every step. It scales beautifully because a dataset of 1,000,000 items takes at most <strong className="text-indigo-500 font-mono">20</strong> steps!
            </p>
          </div>
        );

      case "O(N)":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold font-mono text-[#1D1D1F] dark:text-slate-100">Linear Sequential Scan Sweep</span>
              <span className="font-mono text-amber-500 font-bold">Pointer: i = {simStep}</span>
            </div>

            <div className="flex flex-wrap justify-center gap-1.5 py-4">
              {simArray.map((val, idx) => {
                const isVisited = idx < simStep;
                const isActive = idx === simStep;
                
                let bgColor = isDark ? "#2A2A35" : "#FFFFFF";
                let textColor = isDark ? "text-slate-300" : "text-slate-700";
                let borderColor = isDark ? "border-[#2D2D34]" : "border-[#E5E5EA]";

                if (isActive) {
                  bgColor = "#F59E0B";
                  textColor = "text-white";
                  borderColor = "border-amber-500";
                } else if (isVisited) {
                  bgColor = isDark ? "#223E2A" : "#ECFDF5";
                  borderColor = "border-emerald-200 dark:border-emerald-900/30";
                  textColor = "text-emerald-700 dark:text-emerald-400";
                }

                return (
                  <motion.div
                    key={idx}
                    animate={{ scale: isActive ? 1.15 : 1 }}
                    className={`w-9 h-11 flex flex-col items-center justify-center border rounded-lg text-xs font-mono font-bold ${borderColor} ${textColor}`}
                    style={{ backgroundColor: bgColor }}
                  >
                    <span className="text-[7px] opacity-60">[{idx}]</span>
                    <span>{val}</span>
                  </motion.div>
                );
              })}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed">
              Linear complexity <strong className="text-amber-500 font-mono">O(N)</strong> requires scanning every single element one by one. If you have 5,000 elements, it will take exactly 5,000 steps.
            </p>
          </div>
        );

      case "O(N^2)":
        const gridCols = 6;
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold font-mono text-[#1D1D1F] dark:text-slate-100">Nested Loops Comparisons Grid (6x6)</span>
              <div className="flex gap-3 font-mono text-rose-500 font-bold">
                <span>Outer i = {simOuter}</span>
                <span>Inner j = {simInner}</span>
              </div>
            </div>

            <div className="flex justify-center py-2">
              <div className="grid grid-cols-6 gap-1 border border-slate-200 dark:border-slate-800 p-2.5 rounded-2xl bg-white dark:bg-[#15151C]">
                {Array.from({ length: gridCols * gridCols }).map((_, idx) => {
                  const r = Math.floor(idx / gridCols);
                  const c = idx % gridCols;
                  
                  const isCurrentCell = r === simOuter && c === simInner;
                  const isCompletedRow = r < simOuter || (r === simOuter && c < simInner);

                  let bgColor = isDark ? "#1E1E24" : "#FAFAFC";
                  let scale = 1;

                  if (isCurrentCell) {
                    bgColor = "#EF4444";
                    scale = 1.25;
                  } else if (isCompletedRow) {
                    bgColor = isDark ? "#381B22" : "#FEE2E2";
                  }

                  return (
                    <motion.div
                      key={idx}
                      animate={{ scale }}
                      className="w-7 h-7 rounded border border-transparent flex items-center justify-center text-[8px] font-mono text-slate-400"
                      style={{ backgroundColor: bgColor }}
                    >
                      {r === simOuter && c === simInner ? "💥" : ""}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed">
              Quadratic complexity <strong className="text-rose-500 font-mono">O(N²)</strong> runs an inner loop entirely for each iteration of the outer loop. Even a tiny list of size 6 requires <strong className="text-rose-500 font-mono">36</strong> comparisons!
            </p>
          </div>
        );

      case "O(N log N)":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs animate-pulse">
              <span className="font-bold font-mono text-[#1D1D1F] dark:text-slate-100">Divide & Conquer tree level merge</span>
              <span className="font-mono text-violet-500">Phase: Split & Recombining</span>
            </div>

            <div className="flex flex-col items-center gap-3 py-2">
              {/* Layer 1: original */}
              <div className="flex gap-1.5">
                {[12, 17, 24, 29, 35, 41, 48, 53].map((val, idx) => (
                  <div key={idx} className={`w-8 h-8 rounded border flex items-center justify-center text-[10px] font-mono font-bold ${
                    simStep >= 1 ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-900/40 text-indigo-500" : "bg-white dark:bg-[#202028] dark:border-slate-800 text-slate-600"
                  }`}>
                    {val}
                  </div>
                ))}
              </div>

              {/* Layer 2: divided */}
              <div className="flex gap-8">
                <div className="flex gap-1">
                  {[12, 17, 24, 29].map((val, idx) => (
                    <div key={idx} className={`w-7 h-7 rounded border flex items-center justify-center text-[9px] font-mono font-bold ${
                      simStep >= 5 ? "bg-indigo-500 text-white border-indigo-600" : "bg-white dark:bg-[#1E1E26] dark:border-slate-800 text-slate-400"
                    }`}>
                      {val}
                    </div>
                  ))}
                </div>
                <div className="flex gap-1">
                  {[35, 41, 48, 53].map((val, idx) => (
                    <div key={idx} className={`w-7 h-7 rounded border flex items-center justify-center text-[9px] font-mono font-bold ${
                      simStep >= 10 ? "bg-indigo-500 text-white border-indigo-600" : "bg-white dark:bg-[#1E1E26] dark:border-slate-800 text-slate-400"
                    }`}>
                      {val}
                    </div>
                  ))}
                </div>
              </div>

              {/* Layer 3: fully sorted */}
              <div className="flex gap-1.5">
                {[12, 17, 24, 29, 35, 41, 48, 53].map((val, idx) => (
                  <div key={idx} className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                    simStep >= 15 ? "bg-emerald-500 text-white border-emerald-600" : "bg-transparent dark:border-slate-800 text-transparent"
                  }`}>
                    {val}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed">
              Merge Sort and Quick Sort split arrays into logarithmic segments (<strong className="font-mono">log N</strong> levels), then merge them linearly (<strong className="font-mono">N</strong>). This creates <strong className="text-violet-500 font-mono">O(N log N)</strong>, which is extremely efficient for large sorts!
            </p>
          </div>
        );

      case "O(2^N)":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold font-mono text-[#1D1D1F] dark:text-slate-100">Exponential Recursion Branching Tree</span>
              <span className="font-mono text-rose-500 font-bold">Call Stack Levels: {simStep}</span>
            </div>

            <div className="flex flex-col items-center py-2 min-h-[140px] justify-center">
              {/* Simple layout showing parent-child relationship */}
              <div className="flex flex-col items-center gap-4">
                {/* Level 0 */}
                <div className="px-3 py-1.5 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold shadow-md">
                  fib(4)
                </div>

                {/* Level 1 */}
                {simStep >= 1 && (
                  <div className="flex gap-16 relative">
                    <div className="absolute top-[-16px] left-1/4 right-1/4 h-[1px] bg-rose-200 dark:bg-rose-900/40" />
                    <div className="px-2.5 py-1 rounded-lg bg-rose-400 text-white text-[9px] font-mono">fib(3)</div>
                    <div className="px-2.5 py-1 rounded-lg bg-rose-400 text-white text-[9px] font-mono">fib(2)</div>
                  </div>
                )}

                {/* Level 2 */}
                {simStep >= 2 && (
                  <div className="flex gap-4">
                    <div className="px-2 py-0.5 rounded bg-rose-300 dark:bg-rose-900 dark:text-rose-100 text-[8px] font-mono">fib(2)</div>
                    <div className="px-2 py-0.5 rounded bg-rose-300 dark:bg-rose-900 dark:text-rose-100 text-[8px] font-mono">fib(1)</div>
                    <div className="px-2 py-0.5 rounded bg-rose-300 dark:bg-rose-900 dark:text-rose-100 text-[8px] font-mono">fib(1)</div>
                    <div className="px-2 py-0.5 rounded bg-rose-300 dark:bg-rose-900 dark:text-rose-100 text-[8px] font-mono">fib(0)</div>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed">
              Exponential <strong className="text-rose-500 font-mono">O(2ⁿ)</strong> complexity duplicates the work in every recursive depth layer. This is highly inefficient; adding just 1 more stack level doubles the time required!
            </p>
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl bg-white dark:bg-[#121216] border border-[#E5E5EA] dark:border-[#222228] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300"
      >
        {/* Modal Header */}
        <div className="bg-[#FAFAFC] dark:bg-[#16161D] px-6 py-5 border-b border-[#E5E5EA] dark:border-[#222228] flex items-center justify-between transition-colors duration-300">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1D1D1F] dark:text-slate-100 flex items-center gap-2">
                Complexity Deep Dive & Interactive Visualizer
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-semibold border border-amber-100 dark:border-amber-900/30">
                  {approach.name}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Understand the physical operations and hardware limits backing this design.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#E5E5EA] dark:hover:bg-[#2D2D35] text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Top Big O Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Time complexity explanation */}
            <div className="bg-[#FAFAFC] dark:bg-[#181820] border border-[#E5E5EA] dark:border-[#222228] p-4 rounded-2xl flex items-start gap-3 transition-colors duration-300">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase text-indigo-500 tracking-wider">Time Complexity Bounds</span>
                  <span className="text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded">
                    {approach.timeComplexity}
                  </span>
                </div>
                <p className="text-xs font-medium text-[#1D1D1F] dark:text-slate-200">
                  {approach.timeComplexityReason || "The execution time of the algorithm depends proportionally on the input structure size."}
                </p>
              </div>
            </div>

            {/* Space complexity explanation */}
            <div className="bg-[#FAFAFC] dark:bg-[#181820] border border-[#E5E5EA] dark:border-[#222228] p-4 rounded-2xl flex items-start gap-3 transition-colors duration-300">
              <div className="p-2.5 bg-violet-50 dark:bg-violet-950/30 rounded-xl text-violet-600 dark:text-violet-400 flex-shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase text-violet-500 tracking-wider">Space Complexity Bounds</span>
                  <span className="text-xs font-mono font-bold bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded">
                    {approach.spaceComplexity}
                  </span>
                </div>
                <p className="text-xs font-medium text-[#1D1D1F] dark:text-slate-200">
                  {approach.spaceComplexityReason || "Allocates constant memory stack and registers without extra auxiliary tracking storage."}
                </p>
              </div>
            </div>

          </div>

          {/* Toggle Tab selector */}
          <div className="flex border-b border-[#E5E5EA] dark:border-[#222228] transition-colors duration-300">
            <button
              onClick={() => setActiveTab("chart")}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === "chart"
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-[#1D1D1F] dark:hover:text-slate-200"
              }`}
            >
              📈 Growth Curves & Scale Simulator
            </button>
            <button
              onClick={() => setActiveTab("simulation")}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === "simulation"
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-[#1D1D1F] dark:hover:text-slate-200"
              }`}
            >
              🔬 Live Code execution visualizer
            </button>
          </div>

          {/* Tab Content Rendering */}
          {activeTab === "chart" ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Curve display */}
              <div className="lg:col-span-6 space-y-4">
                {renderBigOCurves()}
              </div>

              {/* Right Column: Input scaling controller */}
              <div className="lg:col-span-6 flex flex-col justify-between border border-[#E5E5EA] dark:border-[#2D2D34] rounded-2xl bg-[#FAFAFC] dark:bg-[#15151C] p-5 space-y-6 transition-colors duration-300">
                
                {/* Controller Title */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-bold flex items-center gap-1">
                    <Sliders className="w-3 h-3" />
                    Scale Simulator Controls
                  </span>
                  <h3 className="text-xs font-bold text-[#1D1D1F] dark:text-slate-200">
                    Slide to dynamically scale input size (N) and observe operation cost
                  </h3>
                </div>

                {/* Interactive Slider Input */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-500">Input Size (N)</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">{inputSize.toLocaleString()} elements</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="10000"
                    step="10"
                    value={inputSize}
                    onChange={(e) => setInputSize(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-400"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-400">
                    <span>10 (Tiny)</span>
                    <span>5,000 (Medium)</span>
                    <span>10,000 (Large)</span>
                  </div>
                </div>

                {/* Operation calculation panel */}
                <div className="space-y-4">
                  
                  {/* Time impact */}
                  <div className="p-3.5 rounded-xl border border-[#E5E5EA] bg-white dark:bg-[#20202A] dark:border-[#2D2D34] flex items-start gap-3 transition-colors duration-300">
                    <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 rounded-lg mt-0.5">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-mono uppercase text-indigo-500 block">Total Calculated Time Operations</span>
                      <span className={`text-xs font-mono font-bold ${calculatedTime.warning ? "text-rose-500" : "text-slate-700 dark:text-slate-300"}`}>
                        {calculatedTime.label}
                      </span>
                    </div>
                  </div>

                  {/* Space impact */}
                  <div className="p-3.5 rounded-xl border border-[#E5E5EA] bg-white dark:bg-[#20202A] dark:border-[#2D2D34] flex items-start gap-3 transition-colors duration-300">
                    <div className="p-1.5 bg-violet-50 dark:bg-violet-950/40 text-violet-500 rounded-lg mt-0.5">
                      <Database className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-mono uppercase text-violet-500 block">Auxiliary Memory Space Slots</span>
                      <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                        {calculatedSpace.label}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Visual hardware warning threshold badge */}
                {(calculatedTime.warning) && (
                  <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950/40 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                    <p className="text-[10px] text-rose-800 dark:text-rose-300 leading-normal">
                      <strong>WARNING</strong>: {timeComp} complexity expands exponentially. For larger datasets ($N &gt; 10,000$), nested calculations will result in billions of operations, locking browsers or crashing real cloud containers! You should always favor optimal algorithmic approaches.
                    </p>
                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className="border border-[#E5E5EA] dark:border-[#2D2D34] bg-[#FAFAFC] dark:bg-[#15151C] rounded-2xl p-6 space-y-6 transition-colors duration-300">
              
              {/* Simulation view area */}
              <div className="bg-white dark:bg-[#0D0D11] border border-[#E5E5EA] dark:border-[#222228] p-6 rounded-2xl min-h-[220px] flex items-center justify-center transition-colors duration-300">
                {renderSimulationView()}
              </div>

              {/* Interactive Controls Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#E5E5EA]/60 dark:border-[#2D2D34]/60">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsSimulating(!isSimulating)}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-md cursor-pointer transition-all ${
                      isSimulating ? "bg-amber-500 hover:bg-amber-600" : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                  >
                    {isSimulating ? (
                      <>
                        <Pause className="w-3.5 h-3.5" fill="currentColor" />
                        <span>Pause Simulation</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" fill="currentColor" />
                        <span>Play Simulation</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={runSimulationStep}
                    disabled={isSimulating}
                    className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-[#E5E5EA] dark:border-[#2D2D34] hover:bg-slate-100 dark:hover:bg-[#202028] disabled:opacity-50 disabled:pointer-events-none rounded-xl cursor-pointer"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    <span>Single Step</span>
                  </button>

                  <button
                    onClick={handleResetSimulation}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:bg-[#E5E5EA] dark:hover:bg-[#2D2D35] rounded-xl cursor-pointer"
                    title="Reset Simulation"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  {/* Total operations processed indicator */}
                  <div className="flex items-center gap-1 text-slate-500">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Simulated Actions: <strong className="text-slate-700 dark:text-slate-300">{simOperationsCount}</strong></span>
                  </div>

                  {/* Speed controller */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Interval Speed:</span>
                    <select
                      value={simSpeed}
                      onChange={(e) => setSimSpeed(Number(e.target.value))}
                      className="bg-white dark:bg-[#1E1E26] border border-[#E5E5EA] dark:border-[#2D2D34] text-xs px-2 py-1 rounded-lg text-slate-700 dark:text-slate-300"
                    >
                      <option value={400}>Slow (400ms)</option>
                      <option value={200}>Normal (200ms)</option>
                      <option value={80}>Fast (80ms)</option>
                    </select>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Educational Pros & Cons panel of active approach */}
          <div className="border border-[#E5E5EA] dark:border-[#2D2D34] rounded-2xl bg-[#FAFAFC] dark:bg-[#15151C] p-5 space-y-4 transition-colors duration-300">
            <div className="flex items-center gap-2 border-b border-[#E5E5EA]/50 dark:border-[#2D2D34]/50 pb-2.5">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <h4 className="text-xs font-bold text-[#1D1D1F] dark:text-slate-200 uppercase tracking-wide">Design Guidelines & Algorithmic Trade-offs</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">Advantages</span>
                <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                  {approach.pros.map((pro, index) => (
                    <li key={index}>{pro}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block mb-1">Disadvantages / Bottlenecks</span>
                <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                  {approach.cons.map((con, index) => (
                    <li key={index}>{con}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-[#FAFAFC] dark:bg-[#16161D] px-6 py-4 border-t border-[#E5E5EA] dark:border-[#222228] flex items-center justify-between transition-colors duration-300">
          <span className="text-[10px] font-mono text-[#86868B] dark:text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Designed to teach clean, high-efficiency memory management.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/10 active:scale-[0.98] rounded-xl transition-all cursor-pointer"
          >
            Dismiss Visualizer
          </button>
        </div>
      </motion.div>
    </div>
  );
}
