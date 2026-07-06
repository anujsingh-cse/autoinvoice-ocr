"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, CheckCircle2, ScanLine, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export default function AutoInvoiceDashboard() {
  const [fileStatus, setFileStatus] = useState<"idle" | "scanning" | "done" | "error">("idle");
  const [responseData, setResponseData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileStatus("scanning");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.error || "Failed to extract");
      }
      
      setResponseData(json);
      setFileStatus("done");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message);
      setFileStatus("error");
    }
  };

  const reset = () => {
    setFileStatus("idle");
    setResponseData(null);
    setErrorMessage("");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <ScanLine className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800">AutoInvoice</span>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <a href="#" className="hover:text-indigo-600 transition-colors">API Docs</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Pricing</a>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg transition-colors">
            Dashboard
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Header Text */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Extract Data from Any Invoice. <span className="text-indigo-600">Instantly.</span>
          </h1>
          <p className="text-lg text-slate-600">
            Powered by AWS Textract and custom LLM layout parsing, AutoInvoice turns messy, unstructured PDFs into perfectly formatted JSON ready for your ERP.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Panel: Upload Zone */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <UploadCloud className="h-6 w-6 text-indigo-600" />
              Upload Document
            </h2>

            <AnimatePresence mode="wait">
              {fileStatus === "idle" && (
                <motion.label
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="block border-2 border-dashed border-slate-300 rounded-xl p-12 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                >
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={handleUpload} 
                    accept=".pdf,image/png,image/jpeg" 
                  />
                  <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="font-medium text-slate-700 text-lg">Click to upload sample invoice</p>
                  <p className="text-slate-500 text-sm mt-2">PDF, PNG, JPG up to 10MB</p>
                </motion.label>
              )}

              {fileStatus === "scanning" && (
                <motion.div
                  key="scanning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border border-slate-200 rounded-xl p-12 text-center bg-slate-50 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-indigo-500/10 animate-pulse" />
                  <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500 animate-[scan_2s_ease-in-out_infinite]" />
                  <ScanLine className="h-12 w-12 text-indigo-600 mx-auto mb-4 animate-bounce" />
                  <p className="font-bold text-indigo-900 text-lg">Analyzing document structure...</p>
                  <p className="text-indigo-600/80 text-sm mt-2">Running AWS Textract & Layout Parser</p>
                </motion.div>
              )}

              {fileStatus === "done" && responseData && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border border-green-200 bg-green-50 rounded-xl p-12 text-center"
                >
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <p className="font-bold text-green-900 text-lg">Extraction Complete!</p>
                  <p className="text-green-700 mt-2">Confidence score: {(responseData.confidence_score * 100).toFixed(1)}%.</p>
                  <button 
                    onClick={reset}
                    className="mt-6 text-sm font-medium text-green-700 bg-green-200/50 hover:bg-green-200 px-4 py-2 rounded-lg transition-colors"
                  >
                    Upload Another
                  </button>
                </motion.div>
              )}
              {fileStatus === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border border-red-200 bg-red-50 rounded-xl p-12 text-center"
                >
                  <p className="font-bold text-red-900 text-lg">Extraction Failed</p>
                  <p className="text-red-700 mt-2">{errorMessage}</p>
                  <button 
                    onClick={reset}
                    className="mt-6 text-sm font-medium text-red-700 bg-red-200/50 hover:bg-red-200 px-4 py-2 rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Features Row */}
            <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-100">
              <div className="flex items-start gap-3">
                <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600 shrink-0"><Zap className="h-4 w-4" /></div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">Sub-second Parsing</h4>
                  <p className="text-xs text-slate-500 mt-1">Average processing time &lt; 800ms</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600 shrink-0"><ShieldCheck className="h-4 w-4" /></div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">Enterprise Security</h4>
                  <p className="text-xs text-slate-500 mt-1">SOC2 Type II & GDPR Compliant</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: JSON Output */}
          <div className="bg-[#1e1e1e] rounded-2xl shadow-xl border border-slate-800 overflow-hidden flex flex-col h-[600px]">
            <div className="bg-[#2d2d2d] px-4 py-3 flex items-center justify-between border-b border-[#404040]">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono text-sm">POST /v1/extract</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-600" />
                <span className="w-3 h-3 rounded-full bg-slate-600" />
                <span className="w-3 h-3 rounded-full bg-slate-600" />
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto font-mono text-sm flex-1">
              {fileStatus === "idle" && (
                <div className="text-slate-500 h-full flex items-center justify-center text-center">
                  Waiting for file upload... <br/> JSON response will appear here.
                </div>
              )}

              {fileStatus === "scanning" && (
                <div className="text-indigo-400 animate-pulse">
                  <span className="text-indigo-500">Processing...</span>
                  <br/><br/>
                  <span className="text-slate-500">{"// Identifying vendor details..."}</span><br/>
                  <span className="text-slate-500">{"// Extracting line items via vision LLM..."}</span><br/>
                  <span className="text-slate-500">{"// Validating tax calculations..."}</span>
                </div>
              )}

              {fileStatus === "done" && responseData && (
                <motion.pre
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-slate-300"
                >
                  {JSON.stringify(responseData, null, 2)}
                </motion.pre>
              )}
              
              {fileStatus === "error" && (
                <motion.div className="text-red-400">
                  {errorMessage}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(200px); }
          100% { transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
