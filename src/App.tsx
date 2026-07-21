import React, { useState, useEffect, useRef } from "react";
import { 
  Code2, 
  Terminal, 
  Check, 
  Copy, 
  RotateCcw, 
  Sparkles, 
  AlertCircle, 
  BookOpen, 
  Video, 
  Briefcase, 
  ArrowRight, 
  Search, 
  Gauge, 
  FileCode, 
  Trash2, 
  History, 
  CheckCircle2, 
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  X,
  Play,
  Sun,
  Moon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ComplexityVisualizer from "./components/ComplexityVisualizer";

// Types matching server response
interface ErrorSummary {
  title: string;
  location: string;
  severity: "error" | "warning" | "bug" | "none";
}

interface Explanation {
  whatIsIt: string;
  whyItHappened: string;
}

interface VideoRecommendation {
  title: string;
  channelOrTopic: string;
  searchQuery: string;
  description: string;
}

interface InterviewQuestion {
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  relevance: string;
}

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

interface AnalysisResult {
  errorSummary: ErrorSummary;
  explanation: Explanation;
  fixedCode: string;
  videoRecommendations: VideoRecommendation[];
  interviewQuestions: InterviewQuestion[];
  approaches: Approach[];
}

interface HistoryItem {
  id: string;
  timestamp: string;
  language: string;
  code: string;
  errorMsg: string;
  result: AnalysisResult;
}

// Simple, high-precision tokenizer and highlighter for supported languages
function highlightCode(code: string, language: string, isDark: boolean): React.ReactNode {
  if (!code) {
    return <span className="text-neutral-500 italic">// CodeLens AI - Write or paste your code here...</span>;
  }

  // Language keywords list
  let keywords: string[] = [];
  if (language === "javascript") {
    keywords = ["const", "let", "var", "function", "return", "if", "else", "for", "while", "do", "switch", "case", "break", "continue", "default", "try", "catch", "finally", "throw", "new", "class", "extends", "import", "export", "from", "async", "await", "typeof", "instanceof", "in", "of", "null", "undefined", "true", "false", "console", "log"];
  } else if (language === "python") {
    keywords = ["def", "class", "return", "if", "elif", "else", "for", "while", "break", "continue", "pass", "import", "from", "as", "try", "except", "finally", "raise", "assert", "in", "is", "not", "and", "or", "lambda", "global", "nonlocal", "with", "yield", "None", "True", "False", "print", "len", "range"];
  } else if (language === "java") {
    keywords = ["public", "private", "protected", "class", "interface", "extends", "implements", "import", "package", "new", "this", "super", "return", "if", "else", "for", "while", "do", "switch", "case", "break", "continue", "default", "try", "catch", "finally", "throw", "throws", "static", "final", "void", "int", "double", "float", "long", "short", "byte", "char", "boolean", "null", "true", "false", "System", "out", "print", "println", "String"];
  } else if (language === "cpp" || language === "c") {
    keywords = ["int", "float", "double", "char", "void", "bool", "long", "short", "unsigned", "signed", "struct", "class", "union", "enum", "typedef", "sizeof", "if", "else", "for", "while", "do", "switch", "case", "break", "continue", "default", "return", "const", "static", "extern", "inline", "virtual", "public", "private", "protected", "template", "namespace", "using", "friend", "this", "new", "delete", "nullptr", "true", "false", "cout", "cin", "endl", "std", "include", "define"];
  }

  // Escape regex specials helper
  const escapeKeywords = keywords.map(kw => kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));

  // Create tokenizer matching sequential structures
  const rules = [
    // Comment lines/blocks
    { type: "comment", regex: language === "python" ? /^(#.*)/ : /^(\/\/.*|\/\*[\s\S]*?\*\/)/ },
    // Preprocessor directive / python decorators
    { type: "preprocessor", regex: language === "python" ? /^(@\w+)/ : /^(\s*#include\s+<[^>]+>|\s*#include\s+"[^"]+"|\s*#define\s+\w+|\s*#ifdef|\s*#ifndef|\s*#endif)/ },
    // String literals
    { type: "string", regex: /^("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/ },
    // Number values
    { type: "number", regex: /^(\b\d+(?:\.\d+)?\b)/ },
    // Keyword match
    { type: "keyword", regex: new RegExp(`^\\b(${escapeKeywords.join("|")})\\b`) },
    // Function signature
    { type: "function", regex: /^(\b\w+)(?=\s*\()/ },
    // Operators
    { type: "operator", regex: /^([+\-*/%&|^~<>!=]=?|\&\&|\|\|)/ },
    // Punctuation & brackets
    { type: "punctuation", regex: /^([{}[\]().,;:])/ },
    // Normal word/text segments
    { type: "text", regex: /^([^\s{}()[\].,;:+\-*/%&|^~<>!=#"'`]+)/ },
    // Spaces, tabs, and line breaks
    { type: "whitespace", regex: /^(\s+)/ }
  ];

  let remaining = code;
  const elements: React.ReactNode[] = [];
  let keyIdx = 0;

  while (remaining.length > 0) {
    let matched = false;
    for (const rule of rules) {
      if (rule.regex) {
        const match = remaining.match(rule.regex);
        if (match) {
          const value = match[1];
          let className = isDark ? "text-slate-200" : "text-[#1D1D1F]";

          if (rule.type === "comment") {
            className = isDark ? "text-[#6A9955] italic" : "text-[#008000] italic"; // VSCode green comment
          } else if (rule.type === "preprocessor") {
            className = isDark ? "text-[#C586C0] font-semibold" : "text-[#A31515] font-semibold"; // purple preprocessor
          } else if (rule.type === "string") {
            className = isDark ? "text-[#CE9178]" : "text-[#A31515]"; // brick string literal
          } else if (rule.type === "number") {
            className = isDark ? "text-[#B5CEA8]" : "text-[#098658]"; // soft numeric green
          } else if (rule.type === "keyword") {
            className = isDark ? "text-[#569CD6] font-bold" : "text-[#0000FF] font-bold"; // VS blue keyword
          } else if (rule.type === "function") {
            className = isDark ? "text-[#DCDCAA] font-medium" : "text-[#795E26] font-medium"; // yellow function name
          } else if (rule.type === "operator") {
            className = isDark ? "text-[#D4D4D4]" : "text-[#333333]"; // lighter operator
          } else if (rule.type === "punctuation") {
            className = isDark ? "text-[#FFD700] font-medium" : "text-[#0451A5] font-medium"; // golden brackets
          }

          elements.push(
            <span key={keyIdx++} className={className}>
              {value}
            </span>
          );

          remaining = remaining.slice(value.length);
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      const char = remaining[0];
      elements.push(<span key={keyIdx++} className={isDark ? "text-slate-300" : "text-[#1D1D1F]"}>{char}</span>);
      remaining = remaining.slice(1);
    }
  }

  return <>{elements}</>;
}

// Preset examples for beginners
const PRESETS = [
  {
    name: "C++ SegFault",
    language: "cpp",
    label: "Null Pointer Dereference (C++)",
    code: `#include <iostream>
using namespace std;

int main() {
    int* ptr = nullptr;
    // Dereferencing a null pointer causes crash
    cout << "Value of ptr: " << *ptr << endl;
    return 0;
}`,
    errorMsg: "Segmentation fault (core dumped)"
  },
  {
    name: "Python ZeroDiv",
    language: "python",
    label: "Empty List Division (Python)",
    code: `def find_average(numbers):
    total = 0
    for num in numbers:
        total += num
    # Bug: crash if list is empty
    return total / len(numbers)

print(find_average([]))`,
    errorMsg: "ZeroDivisionError: division by zero"
  },
  {
    name: "JS Closure Bug",
    language: "javascript",
    label: "Asynchronous Closure Scope (JS)",
    code: `function greetUsers(users) {
  for (var i = 0; i < users.length; i++) {
    // Bug: 'var' has function scope, i will be users.length
    setTimeout(function() {
      console.log("Hello " + users[i].name);
    }, 1000);
  }
}

const people = [{name: "Alice"}, {name: "Bob"}];
greetUsers(people);`,
    errorMsg: "TypeError: Cannot read properties of undefined (reading 'name')"
  },
  {
    name: "Java NullPointer",
    language: "java",
    label: "Null Object Method Invocation (Java)",
    code: `public class Main {
    public static void main(String[] args) {
        String str = null;
        // Bug: str is null, calling .equals() crashes
        if (str.equals("test")) {
            System.out.println("Match!");
        }
    }
}`,
    errorMsg: "Exception in thread \"main\" java.lang.NullPointerException"
  },
  {
    name: "C Buffer Overflow",
    language: "c",
    label: "Memory Safety Buffer Overflow (C)",
    code: `#include <stdio.h>
#include <string.h>

int main() {
    char str[10];
    // Bug: copying longer string than destination buffer capacity
    strcpy(str, "This is a very long string that overflows the buffer!");
    printf("%s\\n", str);
    return 0;
}`,
    errorMsg: "*** stack smashing detected ***: terminated"
  }
];

const LANGUAGES = [
  { id: "javascript", name: "JavaScript" },
  { id: "python", name: "Python" },
  { id: "java", name: "Java" },
  { id: "cpp", name: "C++" },
  { id: "c", name: "C" }
];

export default function App() {
  const [code, setCode] = useState<string>(PRESETS[0].code);
  const [language, setLanguage] = useState<string>(PRESETS[0].language);
  const [errorMsg, setErrorMsg] = useState<string>(PRESETS[0].errorMsg);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  
  const [activeApproachTab, setActiveApproachTab] = useState<number>(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showComplexityVisualizer, setShowComplexityVisualizer] = useState<boolean>(false);
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});
  
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem("codelens_theme");
    return saved ? saved === "dark" : true; // Default to sleek dark mode
  });

  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  // Sync scroll between line numbers, highlight overlay, and textarea
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = target.scrollTop;
    }
    if (highlightRef.current) {
      highlightRef.current.scrollTop = target.scrollTop;
      highlightRef.current.scrollLeft = target.scrollLeft;
    }
  };

  // Toggle theme class on document element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("codelens_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("codelens_theme", "light");
    }
  }, [isDark]);

  // Keep line numbers height in sync
  const lineCount = code.split("\n").length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1);

  // Load history on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("codelens_history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Error parsing history:", e);
      }
    }
  }, []);

  // Save history item helper
  const saveToHistory = (item: HistoryItem) => {
    const updated = [item, ...history.filter(h => h.id !== item.id)].slice(0, 10);
    setHistory(updated);
    localStorage.setItem("codelens_history", JSON.stringify(updated));
  };

  // Clear single history item
  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem("codelens_history", JSON.stringify(updated));
  };

  // Clear all history
  const clearAllHistory = () => {
    setHistory([]);
    localStorage.removeItem("codelens_history");
    setShowHistoryModal(false);
  };

  // Copy helper
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  // Preset click handler
  const handlePresetSelect = (preset: typeof PRESETS[0]) => {
    setCode(preset.code);
    setLanguage(preset.language);
    setErrorMsg(preset.errorMsg);
    // Clear previous results to encourage dynamic focus
    setResult(null);
    setError(null);
  };

  // Main analyze submission
  const handleAnalyze = async () => {
    if (!code.trim()) {
      setError("Please paste or write some code first.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    // Dynamic loading screen messages
    const steps = [
      "Parsing source code syntax...",
      "Analyzing variable bindings and scoping rules...",
      "Matching diagnostics with compiler databases...",
      "Synthesizing safe code corrections...",
      "Generating time & space complexity benchmarks...",
      "Formulating interview practice material..."
    ];

    let currentStepIndex = 0;
    setLoadingStep(steps[0]);

    const interval = setInterval(() => {
      if (currentStepIndex < steps.length - 1) {
        currentStepIndex++;
        setLoadingStep(steps[currentStepIndex]);
      }
    }, 2500);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, errorMsg }),
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with our AI engine. Please try again.");
      }

      const data: AnalysisResult = await response.json();
      
      setResult(data);
      setActiveApproachTab(0);

      // Save to localStorage history
      const historyItem: HistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language,
        code,
        errorMsg,
        result: data
      };
      saveToHistory(historyItem);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during code analysis.");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  // Load selected history item
  const handleLoadHistoryItem = (item: HistoryItem) => {
    setCode(item.code);
    setLanguage(item.language);
    setErrorMsg(item.errorMsg);
    setResult(item.result);
    setError(null);
    setShowHistoryModal(false);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD] dark:bg-[#08080A] text-[#1D1D1F] dark:text-[#E2E2E9] font-sans transition-colors duration-300">
      {/* Decorative Top Accent */}
      <div className="h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-indigo-600 w-full" />

      {/* Primary Header */}
      <header className="border-b border-[#F2F2F7] dark:border-[#24242B] bg-white dark:bg-[#121216] sticky top-0 z-40 backdrop-blur-md bg-opacity-90 dark:bg-opacity-90 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-600 to-indigo-500 p-2.5 rounded-xl text-white shadow-sm flex items-center justify-center">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-[#1D1D1F] dark:text-slate-100">CodeLens AI</h1>
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30">
                  v3.5 Flash
                </span>
              </div>
              <p className="text-xs text-[#86868B] dark:text-slate-400">Beginner's guide to compiler diagnostics and optimal coding patterns</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={() => setShowHistoryModal(true)}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#424245] dark:text-slate-200 bg-white dark:bg-[#1C1C22] hover:bg-[#F5F5F7] dark:hover:bg-[#25252D] border border-[#D2D2D7] dark:border-[#2D2D34] rounded-lg transition-all cursor-pointer"
              >
                <History className="w-4 h-4" />
                <span>History ({history.length})</span>
              </button>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 text-[#424245] dark:text-slate-200 bg-white dark:bg-[#1C1C22] hover:bg-[#F5F5F7] dark:hover:bg-[#25252D] border border-[#D2D2D7] dark:border-[#2D2D34] rounded-lg transition-all shadow-sm flex items-center justify-center cursor-pointer"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Intro Info Banner */}
        <div className="mb-8 bg-gradient-to-r from-indigo-50/40 via-white to-[#F2F2F7]/30 dark:from-indigo-950/10 dark:via-[#121216] dark:to-[#16161C]/50 border border-[#E5E5EA] dark:border-[#222228] p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm transition-colors duration-300">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl mt-1 md:mt-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-slate-100">Stuck on a cryptic compiler diagnostic?</h3>
              <p className="text-xs text-[#515154] dark:text-slate-400 mt-0.5 max-w-xl">
                Paste your code, select your language, and optionally add your error output. Our AI breakdown explains exactly what happened, provides optimal solutions, and teaches better coding patterns.
              </p>
            </div>
          </div>
          
          {/* Preset Buttons Header */}
          <div className="flex flex-wrap gap-2 max-w-lg md:justify-end">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#86868B] dark:text-slate-400 w-full md:text-right mb-1">
              Click a preset to test:
            </span>
            {PRESETS.map((preset, index) => (
              <button
                key={index}
                onClick={() => handlePresetSelect(preset)}
                className={`text-[11px] px-2.5 py-1.5 font-medium rounded-lg border transition-all cursor-pointer ${
                  language === preset.language && code === preset.code
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-white dark:bg-[#1C1C22] text-[#424245] dark:text-slate-200 border-[#D2D2D7] dark:border-[#2D2D34] hover:bg-[#F5F5F7] dark:hover:bg-[#25252D]"
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Input Panel Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column - Input Panel (8 columns wide on desktop) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-[#121216] border border-[#E5E5EA] dark:border-[#222228] rounded-2xl shadow-sm overflow-hidden transition-colors duration-300">
              
              {/* Editor Header Tools */}
              <div className="bg-[#F5F5F7] dark:bg-[#18181F] px-4 py-3 border-b border-[#E5E5EA] dark:border-[#222228] flex flex-wrap items-center justify-between gap-3 transition-colors duration-300">
                <div className="flex items-center gap-3">
                  <span className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                    <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                    <span className="w-3 h-3 rounded-full bg-[#27C93F]" />
                  </span>
                  
                  {/* Language Tabs */}
                  <div className="flex items-center gap-1 ml-4 bg-white/80 dark:bg-[#1E1E24]/80 p-0.5 border border-[#D2D2D7]/60 dark:border-[#2D2D34]/80 rounded-lg">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.id}
                        onClick={() => setLanguage(lang.id)}
                        className={`text-xs px-2.5 py-1 font-medium rounded-md transition-all cursor-pointer ${
                          language === lang.id
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-[#515154] dark:text-slate-400 hover:text-[#1D1D1F] dark:hover:text-slate-100 hover:bg-[#F5F5F7] dark:hover:bg-[#25252E]"
                        }`}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCode("");
                      setErrorMsg("");
                    }}
                    title="Clear editor"
                    className="p-1.5 hover:bg-[#E5E5EA] dark:hover:bg-[#25252E] rounded-lg text-[#515154] dark:text-slate-400 hover:text-[#1D1D1F] dark:hover:text-slate-100 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Advanced Code Editor Block with High-fidelity Syntax Highlighting overlay */}
              <div className="relative flex bg-slate-50 dark:bg-[#1E1E1E] text-slate-800 dark:text-slate-100 font-mono text-xs leading-relaxed overflow-hidden h-[380px] md:h-[450px] border border-transparent dark:border-[#2D2D34] rounded-none transition-colors duration-300">
                
                {/* Simulated Line Numbers Panel - Fixed on left */}
                <div 
                  ref={lineNumbersRef}
                  className="absolute left-0 top-0 bottom-0 w-12 select-none text-right pr-3.5 py-4 text-slate-400 dark:text-slate-500 bg-[#F5F5F7] dark:bg-[#161619] border-r border-[#E5E5EA] dark:border-[#26262B] font-mono text-xs overflow-hidden z-10 transition-colors duration-300"
                >
                  {lineNumbers.map((num) => (
                    <div key={num} className="h-[22px]">{num}</div>
                  ))}
                </div>

                {/* Highlighted text overlay behind */}
                <div 
                  ref={highlightRef}
                  className="absolute inset-0 py-4 pl-14 pr-4 font-mono text-xs leading-relaxed whitespace-pre overflow-auto pointer-events-none select-none text-left"
                  style={{
                    lineHeight: "22px",
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
                  }}
                >
                  {highlightCode(code, language, isDark)}
                </div>

                {/* Actual Editor Textarea on top (made text transparent to let high-precision syntax shine through) */}
                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onScroll={handleScroll}
                  placeholder={`// Paste your buggy ${language.toUpperCase()} code here...`}
                  className="absolute inset-0 py-4 pl-14 pr-4 bg-transparent font-mono text-xs focus:outline-none resize-none overflow-auto whitespace-pre leading-[22px] h-full w-full"
                  style={{
                    lineHeight: "22px",
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    color: "transparent",
                    WebkitTextFillColor: "transparent",
                    caretColor: "#818cf8"
                  }}
                  spellCheck="false"
                />
              </div>

              {/* Extra context help */}
              <div className="bg-[#FAFAFC] dark:bg-[#15151A] px-4 py-2 border-t border-[#E5E5EA] dark:border-[#222228] flex justify-between items-center text-[11px] text-[#86868B] dark:text-slate-400 transition-colors duration-300">
                <span>Lines: {lineCount}</span>
                <span>UTF-8 Encoding</span>
              </div>
            </div>

            {/* Optional Compiler Error Section */}
            <div className="bg-white dark:bg-[#121216] border border-[#E5E5EA] dark:border-[#222228] rounded-2xl shadow-sm overflow-hidden transition-colors duration-300">
              <div className="px-5 py-3 bg-[#F5F5F7] dark:bg-[#18181F] border-b border-[#E5E5EA] dark:border-[#222228] flex items-center gap-2 transition-colors duration-300">
                <Terminal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xs font-semibold text-[#1D1D1F] dark:text-slate-100">Compiler or Runtime Diagnostics (Optional)</h3>
              </div>
              <div className="p-4 bg-[#FAF9F6] dark:bg-[#16161C] transition-colors duration-300">
                <textarea
                  value={errorMsg}
                  onChange={(e) => setErrorMsg(e.target.value)}
                  placeholder="Paste the precise compiler error, exception crash trace, or syntax complain logs you received (e.g. 'Undefined symbol error', 'Segmentation Fault'...) to get a hyper-targeted explanation."
                  className="w-full h-24 p-3 font-mono text-xs bg-white dark:bg-[#0D0D11] text-rose-700 dark:text-rose-400 placeholder-rose-900/30 dark:placeholder-rose-800/20 rounded-xl focus:outline-none border border-rose-200 dark:border-rose-950/40 resize-none leading-relaxed transition-colors duration-300"
                  spellCheck="false"
                />
                <p className="text-[11px] text-[#86868B] dark:text-slate-400 mt-2 italic">
                  Leave this blank if you don't have an error log. CodeLens AI will scan the code structure and automatically flag syntactic bugs or structural warnings.
                </p>
              </div>
            </div>

            {/* Submit Control Bar */}
            <div className="flex gap-4">
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Analyzing code...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Analyze Code & Demystify Errors</span>
                  </>
                )}
              </button>
            </div>

            {/* Error Message Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-red-800">Analysis Encountered an Issue</h4>
                  <p className="text-xs text-red-700 mt-1">{error}</p>
                </div>
              </motion.div>
            )}

          </div>

          {/* Right Column - Results Display Dashboard (5 columns wide on desktop if no result, empty spacing or state. If there IS a result, we'll stack them beautifully!) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Loading / Empty State */}
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white dark:bg-[#121216] border border-[#E5E5EA] dark:border-[#222228] rounded-3xl p-8 text-center space-y-6 shadow-sm min-h-[400px] flex flex-col justify-center items-center transition-colors duration-300"
                >
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-100 dark:border-indigo-950 border-t-indigo-600 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Code2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-2 max-w-sm">
                    <h3 className="text-base font-semibold text-[#1D1D1F] dark:text-slate-100">AI Engine Deciphering Your Code</h3>
                    <p className="text-xs text-[#86868B] dark:text-slate-400 font-mono h-8 flex items-center justify-center">
                      {loadingStep}
                    </p>
                  </div>
                  <div className="w-full bg-[#F5F5F7] dark:bg-[#18181F] rounded-full h-1 max-w-xs overflow-hidden">
                    <div className="bg-indigo-600 h-1 rounded-full animate-[progress_15s_ease-in-out_infinite]" style={{ width: "80%" }} />
                  </div>
                </motion.div>
              )}

              {!loading && !result && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white dark:bg-[#121216] border border-[#E5E5EA] dark:border-[#222228] border-dashed rounded-3xl p-8 text-center space-y-4 shadow-sm min-h-[400px] flex flex-col justify-center items-center transition-colors duration-300"
                >
                  <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl text-indigo-500">
                    <HelpCircle className="w-8 h-8" />
                  </div>
                  <div className="space-y-1.5 max-w-xs">
                    <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-slate-100">Awaiting Code Submission</h3>
                    <p className="text-xs text-[#86868B] dark:text-slate-400">
                      Enter your script on the left and hit analyze. CodeLens AI will highlight compiling vulnerabilities, provide code repairs, and explain underlying algorithms.
                    </p>
                  </div>
                </motion.div>
              )}

              {!loading && result && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Error & Diagnostic Header Card */}
                  <div className={`p-5 rounded-2xl border bg-white dark:bg-[#121216]/40 shadow-sm flex flex-col gap-3 transition-colors duration-300 ${
                    result.errorSummary.severity === "error" ? "border-red-200 dark:border-red-900/40" :
                    result.errorSummary.severity === "warning" ? "border-amber-200 dark:border-amber-900/40" :
                    result.errorSummary.severity === "bug" ? "border-rose-200 dark:border-rose-900/40" :
                    "border-emerald-200 dark:border-emerald-900/40"
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {result.errorSummary.severity === "error" && (
                          <span className="px-2.5 py-1 text-[11px] font-bold font-mono uppercase bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-full border border-red-100 dark:border-red-900/30">
                            Error
                          </span>
                        )}
                        {result.errorSummary.severity === "warning" && (
                          <span className="px-2.5 py-1 text-[11px] font-bold font-mono uppercase bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-full border border-amber-100 dark:border-amber-900/30">
                            Warning
                          </span>
                        )}
                        {result.errorSummary.severity === "bug" && (
                          <span className="px-2.5 py-1 text-[11px] font-bold font-mono uppercase bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-full border border-rose-100 dark:border-rose-900/30">
                            Bug
                          </span>
                        )}
                        {result.errorSummary.severity === "none" && (
                          <span className="px-2.5 py-1 text-[11px] font-bold font-mono uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                            Clean / Optimized
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-[#86868B] dark:text-slate-400 flex items-center gap-1">
                        <Terminal className="w-3.5 h-3.5" />
                        {result.errorSummary.location}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-[#1D1D1F] dark:text-slate-100 tracking-tight">
                        {result.errorSummary.title}
                      </h3>
                    </div>
                  </div>

                  {/* Conceptual Explanation Block */}
                  <div className="bg-white dark:bg-[#121216] border border-[#E5E5EA] dark:border-[#222228] rounded-2xl p-5 shadow-sm space-y-4 transition-colors duration-300">
                    <div className="flex items-center gap-2 border-b border-[#F2F2F7] dark:border-[#222228] pb-3">
                      <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <h4 className="text-xs font-bold text-[#1D1D1F] dark:text-slate-100 uppercase tracking-wider">Concept Demystified</h4>
                    </div>

                    <div className="space-y-3.5">
                      <div>
                        <span className="text-[10px] font-bold font-mono uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
                          What is it?
                        </span>
                        <p className="text-xs text-[#424245] dark:text-slate-200 leading-relaxed mt-1.5">
                          {result.explanation.whatIsIt}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#F2F2F7] dark:border-[#222228]">
                        <span className="text-[10px] font-bold font-mono uppercase text-[#BF5AF2] dark:text-[#E0A0FF] bg-[#F7F2FA] dark:bg-[#251A2C]/60 px-2 py-0.5 rounded">
                          Why it happened here
                        </span>
                        <p className="text-xs text-[#424245] dark:text-slate-200 leading-relaxed mt-1.5">
                          {result.explanation.whyItHappened}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Code Fix Comparison Card */}
                  <div className="bg-white dark:bg-[#121216] border border-[#E5E5EA] dark:border-[#222228] rounded-2xl shadow-sm overflow-hidden transition-colors duration-300">
                    <div className="bg-[#F5F5F7] dark:bg-[#18181F] px-5 py-3 border-b border-[#E5E5EA] dark:border-[#222228] flex items-center justify-between transition-colors duration-300">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <h4 className="text-xs font-bold text-[#1D1D1F] dark:text-slate-100 uppercase tracking-wider">Corrected Execution</h4>
                      </div>
                      <button
                        onClick={() => copyToClipboard(result.fixedCode, "fixed")}
                        className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-md transition-colors cursor-pointer"
                      >
                        {copiedStates["fixed"] ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Corrected</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="bg-slate-50 dark:bg-[#1E1E1E] p-4 text-slate-800 dark:text-slate-100 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[300px] transition-colors duration-300">
                      <pre>{highlightCode(result.fixedCode, language, isDark)}</pre>
                    </div>
                    
                    <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 border-t border-emerald-100 dark:border-emerald-900/30 flex items-start gap-2.5 transition-colors duration-300">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                      <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                        This correction completely resolves the syntax error or logical crash. Paste this block directly in your script to test.
                      </p>
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>

        {/* Algorithm Approaches Benchmarking Panel (12 columns full width underneath) */}
        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-8 bg-white dark:bg-[#121216] border border-[#E5E5EA] dark:border-[#222228] rounded-3xl shadow-sm overflow-hidden transition-colors duration-300"
          >
            {/* approaches section header */}
            <div className="bg-gradient-to-r from-indigo-50/20 to-white dark:from-[#1A1A24]/30 dark:to-[#121216] px-6 py-5 border-b border-[#E5E5EA] dark:border-[#222228] transition-colors duration-300">
              <div className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-slate-100">Algorithm Benchmarking & Alternative Paradigms</h3>
              </div>
              <p className="text-xs text-[#86868B] dark:text-slate-400 mt-1">
                Evaluate different architectural patterns, implementation complexities, and algorithmic trade-offs for this problem.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12">
              
              {/* Approach selector side navigation */}
              <div className="lg:col-span-4 border-r border-[#E5E5EA] dark:border-[#222228] bg-[#FAFAFC] dark:bg-[#15151B] p-4 space-y-2 transition-colors duration-300">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#86868B] dark:text-slate-400 block px-2 mb-2">Available Approaches</span>
                {result.approaches.map((appr, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveApproachTab(idx)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      activeApproachTab === idx
                        ? "bg-white dark:bg-[#1D1D24] border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 shadow-sm font-medium"
                        : "bg-transparent border-transparent text-[#515154] dark:text-slate-300 hover:bg-white dark:hover:bg-[#1C1C22] hover:border-[#D2D2D7]/50 dark:hover:border-[#2D2D34]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs block font-bold">{appr.name}</span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeApproachTab === idx ? "translate-x-0.5 text-indigo-600 dark:text-indigo-400" : "text-[#86868B] dark:text-slate-400"}`} />
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold border border-transparent dark:border-indigo-900/30">
                        T: {appr.timeComplexity}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#25252D] text-slate-600 dark:text-slate-300">
                        S: {appr.spaceComplexity}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Active approach content view */}
              <div className="lg:col-span-8 p-6 space-y-6">
                
                {/* Info Card header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F2F2F7] dark:border-[#222228] pb-4 transition-colors duration-300">
                  <div>
                    <h4 className="text-base font-bold text-[#1D1D1F] dark:text-slate-100">{result.approaches[activeApproachTab].name}</h4>
                    <p className="text-xs text-[#515154] dark:text-slate-400 mt-1">
                      {result.approaches[activeApproachTab].description}
                    </p>
                  </div>

                   <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
                    <div className="bg-indigo-50 dark:bg-[#1E1C2C] border border-indigo-100 dark:border-indigo-900/40 px-3 py-1.5 rounded-xl text-center">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-indigo-500 dark:text-indigo-400 block">Time Complexity</span>
                      <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">{result.approaches[activeApproachTab].timeComplexity}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-[#1C1C22] border border-slate-100 dark:border-[#2D2D34] px-3 py-1.5 rounded-xl text-center">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Space Complexity</span>
                      <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">{result.approaches[activeApproachTab].spaceComplexity}</span>
                    </div>

                    <button
                      onClick={() => setShowComplexityVisualizer(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg hover:shadow-indigo-500/15 active:scale-[0.98] rounded-xl transition-all cursor-pointer relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 w-1/2 h-full bg-white/10 skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out" />
                      <Gauge className="w-3.5 h-3.5" />
                      <span>Visualize Why</span>
                      <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full animate-ping" />
                      <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full" />
                    </button>
                  </div>
                </div>

                {/* Pros and Cons split */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100 dark:border-[#22442B]/30 p-4 rounded-xl">
                    <span className="text-[10px] font-bold font-mono text-emerald-700 dark:text-emerald-400 uppercase tracking-wide block mb-2">Advantages</span>
                    <ul className="space-y-1.5">
                      {result.approaches[activeApproachTab].pros.map((pro, index) => (
                        <li key={index} className="text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-rose-50/20 dark:bg-rose-950/10 border border-rose-100 dark:border-[#44222B]/30 p-4 rounded-xl">
                    <span className="text-[10px] font-bold font-mono text-rose-700 dark:text-rose-400 uppercase tracking-wide block mb-2">Trade-offs</span>
                    <ul className="space-y-1.5">
                      {result.approaches[activeApproachTab].cons.map((con, index) => (
                        <li key={index} className="text-xs text-rose-800 dark:text-rose-300 flex items-start gap-1.5">
                          <span className="text-rose-500 font-bold mt-0.5 leading-none flex-shrink-0">•</span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Approach Code Display */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1D1D1F] dark:text-slate-100 flex items-center gap-1">
                      <FileCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      Implementation Template
                    </span>
                    <button
                      onClick={() => copyToClipboard(result.approaches[activeApproachTab].code, `approach-${activeApproachTab}`)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors cursor-pointer"
                    >
                      {copiedStates[`approach-${activeApproachTab}`] ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Template</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-[#1E1E1E] text-slate-800 dark:text-slate-100 p-4 rounded-xl font-mono text-xs leading-relaxed overflow-x-auto max-h-[300px] transition-colors duration-300">
                    <pre>{highlightCode(result.approaches[activeApproachTab].code, language, isDark)}</pre>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        )}

        {/* Resources & Educational Grid */}
        {result && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            
            {/* Video Recommendations card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white dark:bg-[#121216] border border-[#E5E5EA] dark:border-[#222228] rounded-3xl p-6 shadow-sm flex flex-col justify-between transition-colors duration-300"
            >
              <div>
                <div className="flex items-center gap-2 border-b border-[#F2F2F7] dark:border-[#222228] pb-3 mb-4 transition-colors duration-300">
                  <Video className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-slate-100">Video Recommendations</h3>
                </div>

                <div className="space-y-4">
                  {result.videoRecommendations.map((video, idx) => {
                    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(video.searchQuery)}`;
                    return (
                      <div key={idx} className="group p-3 hover:bg-[#F5F5F7] dark:hover:bg-[#181820] rounded-xl border border-transparent hover:border-[#E5E5EA]/40 dark:hover:border-[#222228]/60 transition-all flex justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-[#1D1D1F] dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {video.title}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block">
                            Platform / Channel: {video.channelOrTopic}
                          </span>
                          <p className="text-[11px] text-[#515154] dark:text-slate-300 leading-normal">
                            {video.description}
                          </p>
                        </div>
                        <a
                          href={searchUrl}
                          target="_blank"
                          referrerPolicy="no-referrer"
                          className="flex-shrink-0 self-center bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white p-2.5 rounded-lg transition-all"
                          title="Search on YouTube"
                        >
                          <Play className="w-3.5 h-3.5" fill="currentColor" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-[#F2F2F7] dark:border-[#222228] flex items-center justify-between text-[11px] text-[#86868B] dark:text-slate-400 transition-colors duration-300">
                <span>Click play to search video topics instantly</span>
                <span className="flex items-center gap-0.5">YouTube Search <ExternalLink className="w-3 h-3" /></span>
              </div>
            </motion.div>

            {/* Similar Interview Questions card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-[#121216] border border-[#E5E5EA] dark:border-[#222228] rounded-3xl p-6 shadow-sm flex flex-col justify-between transition-colors duration-300"
            >
              <div>
                <div className="flex items-center gap-2 border-b border-[#F2F2F7] dark:border-[#222228] pb-3 mb-4 transition-colors duration-300">
                  <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-slate-100">Similar Interview Questions</h3>
                </div>

                <div className="space-y-4">
                  {result.interviewQuestions.map((q, idx) => {
                    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${q.title} coding problem leetcode`)}`;
                    return (
                      <div key={idx} className="p-3.5 bg-[#FAFAFC] dark:bg-[#181820] rounded-xl border border-[#E5E5EA]/60 dark:border-[#222228]/60 hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-colors space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-[#1D1D1F] dark:text-slate-100">{q.title}</h4>
                          <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                            q.difficulty === "Easy" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30" :
                            q.difficulty === "Medium" ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30" :
                            "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30"
                          }`}>
                            {q.difficulty}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#515154] dark:text-slate-300 leading-normal">
                          {q.relevance}
                        </p>
                        <div className="text-right">
                          <a
                            href={googleSearchUrl}
                            target="_blank"
                            referrerPolicy="no-referrer"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline"
                          >
                            <span>Search Problem</span>
                            <ArrowRight className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-[#F2F2F7] dark:border-[#222228] flex items-center justify-between text-[11px] text-[#86868B] dark:text-slate-400 transition-colors duration-300">
                <span>Build muscle memory with real industry questions</span>
                <span className="flex items-center gap-0.5">LeetCode / Google Search <ExternalLink className="w-3 h-3" /></span>
              </div>
            </motion.div>

          </div>
        )}

      </main>

      {/* History Slide-In / Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowHistoryModal(false)} />
            
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-screen max-w-md bg-white dark:bg-[#121216] border-l border-slate-200 dark:border-[#222228] shadow-2xl flex flex-col transition-colors duration-300"
              >
                {/* Modal Header */}
                <div className="px-6 py-5 bg-[#FAFAFC] dark:bg-[#18181F] border-b border-[#E5E5EA] dark:border-[#222228] flex items-center justify-between transition-colors duration-300">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h2 className="text-sm font-bold text-[#1D1D1F] dark:text-slate-100">Recent Submissions</h2>
                  </div>
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="p-1.5 hover:bg-[#E5E5EA] dark:hover:bg-[#25252F] rounded-lg text-[#86868B] dark:text-slate-400 hover:text-[#1D1D1F] dark:hover:text-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal History List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleLoadHistoryItem(item)}
                      className="group p-4 bg-white dark:bg-[#1C1C24] border border-[#E5E5EA] dark:border-[#2D2D35] hover:border-indigo-500 rounded-xl transition-all cursor-pointer space-y-3 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 uppercase border border-transparent dark:border-indigo-900/20">
                          {item.language}
                        </span>
                        <span className="text-[10px] font-mono text-[#86868B] dark:text-slate-400">{item.timestamp}</span>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-[#1D1D1F] dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                          {item.result.errorSummary.title}
                        </h4>
                        <p className="text-[11px] text-[#86868B] dark:text-slate-400 mt-0.5 italic line-clamp-1">
                          Location: {item.result.errorSummary.location}
                        </p>
                      </div>

                      <div className="bg-[#1E1E1E] p-2.5 rounded-lg text-slate-300 font-mono text-[10px] line-clamp-3">
                        {item.code}
                      </div>

                      <button
                        onClick={(e) => deleteHistoryItem(item.id, e)}
                        title="Remove from history"
                        className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 rounded-md text-[#86868B] dark:text-slate-400 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 bg-[#FAFAFC] dark:bg-[#18181F] border-t border-[#E5E5EA] dark:border-[#222228] flex gap-3 transition-colors duration-300">
                  <button
                    onClick={clearAllHistory}
                    className="w-full py-2.5 px-4 text-center text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-colors border border-rose-100 dark:border-rose-900/30 cursor-pointer"
                  >
                    Clear All History
                  </button>
                </div>

              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showComplexityVisualizer && result && result.approaches[activeApproachTab] && (
          <ComplexityVisualizer
            isOpen={showComplexityVisualizer}
            onClose={() => setShowComplexityVisualizer(false)}
            approach={result.approaches[activeApproachTab]}
            isDark={isDark}
          />
        )}
      </AnimatePresence>

      {/* Humble footer */}
      <footer className="bg-white dark:bg-[#0E0E12] border-t border-[#F2F2F7] dark:border-[#222228] mt-16 py-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#86868B] dark:text-slate-400">
          <div>
            <span>© 2026 CodeLens AI. Built with professional standard React and Tailwind CSS.</span>
          </div>
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Safe sandboxed playground</span>
            <span className="flex items-center gap-1"><TrendingUp className="w-4 h-4 text-indigo-500" /> Learn 10x faster</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
