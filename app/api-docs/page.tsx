"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";

export default function ApiDocsPage() {
  const [swaggerLoaded, setSwaggerLoaded] = useState(false);
  const [showFlutterGuide, setShowFlutterGuide] = useState(true);
  const [activeTab, setActiveTab] = useState<"client" | "models" | "qr">("client");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).SwaggerUIBundle) {
      initSwagger();
    }
  }, [swaggerLoaded]);

  const initSwagger = () => {
    const win = window as any;
    if (!win.SwaggerUIBundle) return;

    win.SwaggerUIBundle({
      url: "/api/openapi.json",
      dom_id: "#swagger-ui",
      deepLinking: true,
      presets: [win.SwaggerUIBundle.presets.apis],
      layout: "BaseLayout",
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: "list",
      filter: true,
      tryItOutEnabled: true,
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
    });
  };

  const handleCopySpecUrl = () => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/api/openapi.json`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Swagger UI styles */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui.css"
      />
      <Script
        src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-bundle.js"
        strategy="afterInteractive"
        onLoad={() => setSwaggerLoaded(true)}
      />

      <style jsx global>{`
        /* Swagger UI Overrides for Dark / IPAM Theme */
        .swagger-ui {
          color: #e2e8f0;
          font-family: inherit;
        }
        .swagger-ui .info {
          margin: 20px 0;
        }
        .swagger-ui .info .title {
          color: #f8fafc;
          font-size: 26px;
        }
        .swagger-ui .info p,
        .swagger-ui .info li {
          color: #cbd5e1;
          font-size: 14px;
        }
        .swagger-ui .scheme-container {
          background: #1e293b;
          box-shadow: none;
          border-radius: 12px;
          border: 1px solid #334155;
          padding: 16px 24px;
          margin: 20px 0;
        }
        .swagger-ui .opblock {
          border-radius: 10px;
          border: 1px solid #334155 !important;
          background: #1e293b !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
          margin: 0 0 14px;
        }
        .swagger-ui .opblock .opblock-summary {
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding: 10px 16px;
        }
        .swagger-ui .opblock .opblock-summary-method {
          border-radius: 6px;
          font-weight: 700;
          font-size: 12px;
          text-shadow: none;
          min-width: 70px;
        }
        .swagger-ui .opblock-summary-path {
          color: #f1f5f9 !important;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 14px !important;
        }
        .swagger-ui .opblock-summary-description {
          color: #94a3b8 !important;
          font-size: 13px;
        }
        .swagger-ui .opblock-body {
          background: #0f172a;
          color: #cbd5e1;
        }
        .swagger-ui .opblock-description-wrapper p,
        .swagger-ui .opblock-title_normal {
          color: #e2e8f0;
        }
        .swagger-ui .tabli button {
          color: #cbd5e1;
        }
        .swagger-ui .tabli.active button {
          color: #38bdf8;
        }
        .swagger-ui table thead tr td,
        .swagger-ui table thead tr th {
          color: #94a3b8;
          border-bottom: 1px solid #334155;
        }
        .swagger-ui .parameters-col_name {
          color: #f8fafc;
        }
        .swagger-ui .parameter__name {
          color: #38bdf8;
          font-family: ui-monospace, SFMono-Regular, monospace;
        }
        .swagger-ui .parameter__type {
          color: #94a3b8;
        }
        .swagger-ui input[type="text"],
        .swagger-ui select,
        .swagger-ui textarea {
          background: #0f172a !important;
          border: 1px solid #334155 !important;
          color: #f8fafc !important;
          border-radius: 6px;
          padding: 8px 12px;
        }
        .swagger-ui .response-col_status {
          color: #38bdf8;
          font-family: ui-monospace, SFMono-Regular, monospace;
        }
        .swagger-ui .response-col_description {
          color: #cbd5e1;
        }
        .swagger-ui .responses-inner h4,
        .swagger-ui .responses-inner h5 {
          color: #e2e8f0;
        }
        .swagger-ui .highlight-code {
          background: #090d16 !important;
          border-radius: 8px;
        }
        .swagger-ui .btn.authorize {
          color: #10b981;
          border-color: #10b981;
          background: transparent;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.2s;
        }
        .swagger-ui .btn.authorize:hover {
          background: rgba(16, 185, 129, 0.15);
        }
        .swagger-ui .btn.authorize svg {
          fill: #10b981;
        }
        .swagger-ui .btn.execute {
          background-color: #0284c7;
          border-color: #0284c7;
          color: #fff;
          border-radius: 6px;
        }
        .swagger-ui .btn.cancel {
          border-color: #ef4444;
          color: #ef4444;
          border-radius: 6px;
        }
        .swagger-ui .filter .operation-filter-input {
          background: #1e293b !important;
          border: 1px solid #334155 !important;
          color: #f8fafc !important;
          border-radius: 8px;
          padding: 10px 16px;
          width: 100%;
          margin: 16px 0;
        }
        .swagger-ui .modal-ux {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 12px;
        }
        .swagger-ui .modal-ux-header {
          border-bottom: 1px solid #334155;
        }
        .swagger-ui .modal-ux-header h3 {
          color: #f8fafc;
        }
        .swagger-ui .modal-ux-content p,
        .swagger-ui .modal-ux-content h4 {
          color: #cbd5e1;
        }
        .swagger-ui section.models {
          border: 1px solid #334155;
          border-radius: 12px;
          background: #1e293b;
        }
        .swagger-ui section.models h4 {
          color: #f8fafc;
        }
        .swagger-ui .model-box {
          background: transparent;
        }
        .swagger-ui .model {
          color: #cbd5e1;
        }
      `}</style>

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 font-bold text-white text-lg">
              IP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-white tracking-tight">IPAM Alumni Unified API</h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  OpenAPI 3.0
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  v1.0.0
                </span>
              </div>
              <p className="text-xs text-slate-400">RESTful Backend & Flutter Mobile App Endpoints</p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => setShowFlutterGuide(!showFlutterGuide)}
              className={`text-xs font-medium px-3.5 py-2 rounded-lg border transition-all flex items-center gap-1.5 ${
                showFlutterGuide
                  ? "bg-sky-500/20 border-sky-500/50 text-sky-300"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <svg className="w-4 h-4 text-sky-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14.314 0L2.3 12 6 15.7 21.684 0h-7.37zM6.002 15.698l6 6.002 3.698-3.7-6-6-3.698 3.698zm9.698-3.698l6 6-3.698 3.7-6.002-6 3.7-3.7z"/>
              </svg>
              {showFlutterGuide ? "Hide Flutter Guide" : "Flutter Guide"}
            </button>

            <button
              onClick={handleCopySpecUrl}
              className="text-xs font-medium px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all flex items-center gap-1.5"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {copied ? "Copied Spec URL!" : "Copy Spec URL"}
            </button>

            <a
              href="/api/openapi.json"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all flex items-center gap-1.5"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Raw JSON
            </a>

            <Link
              href="/"
              className="text-xs font-medium px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
            >
              Alumni Web Portal →
            </Link>
          </div>
        </div>
      </header>

      {/* Flutter Mobile App Quickstart Panel */}
      {showFlutterGuide && (
        <div className="bg-slate-950/70 border-b border-slate-800/80 px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse"></span>
                  <h2 className="text-base font-semibold text-white">Flutter Mobile Developer Quick Start</h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Production integration guide for building the IPAM Alumni cross-platform mobile client with Dart.
                </p>
              </div>

              {/* Tabs */}
              <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800 text-xs">
                <button
                  onClick={() => setActiveTab("client")}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                    activeTab === "client" ? "bg-sky-500 text-white shadow" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Dio / HTTP Service
                </button>
                <button
                  onClick={() => setActiveTab("models")}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                    activeTab === "models" ? "bg-sky-500 text-white shadow" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Auth Flow & Token Storage
                </button>
                <button
                  onClick={() => setActiveTab("qr")}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                    activeTab === "qr" ? "bg-sky-500 text-white shadow" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Virtual Pass & QR Scanner
                </button>
              </div>
            </div>

            {/* Code snippets */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 font-mono text-xs overflow-x-auto text-slate-300">
              {activeTab === "client" && (
                <pre>{`// lib/services/api_client.dart
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  static const String baseUrl = 'http://localhost:3000/api'; // Or your deployed domain
  final Dio dio = Dio(BaseOptions(
    baseUrl: baseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
    headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
  ));

  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  ApiClient() {
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'jwt_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) {
        if (e.response?.statusCode == 401) {
          // Token expired or invalid: redirect to Login screen
        }
        return handler.next(e);
      },
    ));
  }
}`}</pre>
              )}

              {activeTab === "models" && (
                <pre>{`// lib/repositories/auth_repository.dart
class AuthRepository {
  final ApiClient _client;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  AuthRepository(this._client);

  Future<AlumniUser> login(String email, String password) async {
    final response = await _client.dio.post('/auth/alumni/login', data: {
      'email': email,
      'password': password,
      'rememberMe': true,
    });

    if (response.data['success'] == true) {
      final data = response.data['data'];
      final token = data['token'];
      // Store token securely for subsequent Bearer requests
      await _storage.write(key: 'jwt_token', value: token);
      return AlumniUser.fromJson(data);
    }
    throw Exception(response.data['error'] ?? 'Login failed');
  }

  Future<void> logout() async {
    await _storage.delete(key: 'jwt_token');
  }
}`}</pre>
              )}

              {activeTab === "qr" && (
                <pre>{`// 1. Fetch authenticated user's digital pass & render QR code
final passResponse = await apiClient.dio.get('/alumni/pass');
final pass = passResponse.data['data'];

// In your Widget build method using package:qr_flutter
QrImageView(
  data: pass['qrPayload'], // Ready JSON string with member validation metadata
  version: QrVersions.auto,
  size: 200.0,
);

// 2. Event Check-in & Pass Verification (Event Staff / QR Scanner)
Future<bool> verifyScannedPass(String scannedId) async {
  final res = await apiClient.dio.get('/alumni/pass/verify/$scannedId');
  return res.data['success'] == true && res.data['data']['valid'] == true;
}`}</pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Swagger UI Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6">
        <div id="swagger-ui" className="min-h-[600px]">
          {!swaggerLoaded && (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
              <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium">Loading API Explorer and Schemas...</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 px-6 py-4 text-center text-xs text-slate-500">
        IPAM Alumni Unified Platform • RESTful API & Flutter Mobile SDK Documentation
      </footer>
    </div>
  );
}
