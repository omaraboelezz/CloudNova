import React, { JSX, useEffect, useState } from "react";

type Model = "gpt-4" | "gpt-4o" | "gpt-3.5-turbo" | "custom";
type ResponseFormat = "text" | "json" | "json-schema";

type AISettings = {
    model: Model;
    modelName?: string; // when custom
    temperature: number; // 0-1
    topP: number; // 0-1
    maxTokens: number;
    presencePenalty: number; // -2 .. 2
    frequencyPenalty: number; // -2 .. 2
    language: string;
    persona: string;
    safetyFilter: boolean;
    profanityFilter: boolean;
    responseFormat: ResponseFormat;
    enableMemory: boolean;
    memoryWindow: number; // number of messages to keep
    enableStreaming: boolean;
    deterministic: boolean;
    autoSave: boolean;
};

const DEFAULT_SETTINGS: AISettings = {
    model: "gpt-3.5-turbo",
    temperature: 0.6,
    topP: 1,
    maxTokens: 1024,
    presencePenalty: 0,
    frequencyPenalty: 0,
    language: "en",
    persona: "",
    safetyFilter: true,
    profanityFilter: true,
    responseFormat: "text",
    enableMemory: false,
    memoryWindow: 20,
    enableStreaming: false,
    deterministic: false,
    autoSave: true,
};

const STORAGE_KEY: string = "cloudnova.ai.settings.v1";

function detectSettingsFromUseCase(useCaseText: string): Partial<AISettings> {
    const text = (useCaseText || "").toLowerCase();

    // heuristics
    const suggestions: Partial<AISettings> = {};

    if (!text.trim()) return suggestions;

    if (/\b(code|program|javascript|python|typescript|implement|function)\b/.test(text)) {
        suggestions.model = "gpt-4";
        suggestions.temperature = 0.1;
        suggestions.responseFormat = "text";
        suggestions.maxTokens = 1500;
        suggestions.deterministic = true;
        suggestions.enableStreaming = true;
    }

    if (/\b(creative|story|poem|write a|imagined|fantasy)\b/.test(text)) {
        suggestions.temperature = Math.max(suggestions.temperature ?? 0.6, 0.9);
        suggestions.model = suggestions.model ?? "gpt-3.5-turbo";
        suggestions.responseFormat = suggestions.responseFormat ?? "text";
    }

    if (/\b(summariz|summarize|tl;dr|short summary|condense)\b/.test(text)) {
        suggestions.maxTokens = Math.min(suggestions.maxTokens ?? DEFAULT_SETTINGS.maxTokens, 300);
        suggestions.temperature = 0.2;
        suggestions.responseFormat = "text";
    }

    if (/\b(translate|translation|translate to)\b/.test(text)) {
        suggestions.responseFormat = "text";
        suggestions.temperature = 0.2;
        // set language if target appears
        const match = text.match(/\btranslate to (\w{2,})\b/);
        if (match) suggestions.language = match[1];
    }

    if (/\b(json|structured|machine readable|schema)\b/.test(text)) {
        suggestions.responseFormat = "json";
        suggestions.temperature = 0.0;
        suggestions.maxTokens = Math.max(300, suggestions.maxTokens ?? 300);
        suggestions.deterministic = true;
    }

    if (/\b(qa|question|answer|help me|support)\b/.test(text)) {
        suggestions.model = suggestions.model ?? "gpt-3.5-turbo";
        suggestions.temperature = suggestions.temperature ?? 0.3;
        suggestions.presencePenalty = 0;
        suggestions.frequencyPenalty = 0;
        suggestions.enableMemory = true;
    }

    if (/\b(medical|diagnos|diagnosis|patient|treatment)\b/.test(text)) {
        suggestions.safetyFilter = true;
        suggestions.profanityFilter = true;
        suggestions.model = "gpt-4";
        suggestions.temperature = 0.0;
    }

    if (/\b(legal|contract|law|attorney)\b/.test(text)) {
        suggestions.safetyFilter = true;
        suggestions.model = "gpt-4";
        suggestions.temperature = 0.0;
        suggestions.deterministic = true;
    }

    return suggestions;
}

const SettingPage: React.FC = (): JSX.Element => {
    const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
    const [sampleUseCase, setSampleUseCase] = useState<string>("");
    const [importText, setImportText] = useState<string>("");

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as Partial<AISettings>;
                setSettings((prev) => ({ ...prev, ...parsed }));
            } catch {
                // ignore
            }
        }
        // run only once on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (settings.autoSave) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        }
    }, [settings]);

    function update<K extends keyof AISettings>(key: K, value: AISettings[K]) {
        setSettings((s) => ({ ...s, [key]: value }));
    }

    function applyDetected(): void {
        const detected = detectSettingsFromUseCase(sampleUseCase);
        if (!Object.keys(detected).length) {
            alert("No clear suggestions detected from the sample text.");
            return;
        }
        const willAutoSave = settings.autoSave;
        setSettings((s) => ({ ...s, ...detected }));
        if (!willAutoSave) {
            alert("Suggested settings applied to form. Click Save to persist.");
        }
    }

    function saveNow(): void {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        alert("Settings saved.");
    }

    function resetDefaults(): void {
        // eslint-disable-next-line no-restricted-globals
        if (!confirm("Reset to defaults?")) return;
        setSettings(DEFAULT_SETTINGS);
        localStorage.removeItem(STORAGE_KEY);
    }

    function exportJSON(): void {
        const payload = JSON.stringify(settings, null, 2);
        const blob = new Blob([payload], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "ai-settings.json";
        a.click();
        URL.revokeObjectURL(url);
    }

    function importJSON(): void {
        try {
            const parsed = JSON.parse(importText) as Partial<AISettings>;
            setSettings((s) => ({ ...s, ...parsed }));
            alert("Imported settings applied. Save to persist if desired.");
        } catch {
            alert("Invalid JSON.");
        }
    }

    return (
        <div style={{ padding: 20, fontFamily: "Inter, system-ui, sans-serif", maxWidth: 900 }}>
            <h2>AI Settings</h2>
            <p style={{ color: "#666" }}>
                Configure default runtime and safety settings for AI interactions. Use the detector to suggest settings for a specific use-case.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label>
                    Model
                    <select
                        value={settings.model}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => update("model", e.target.value as Model)}
                        style={{ width: "100%" }}
                    >
                        <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                        <option value="gpt-4">gpt-4</option>
                        <option value="gpt-4o">gpt-4o</option>
                        <option value="custom">Custom</option>
                    </select>
                </label>

                {settings.model === "custom" && (
                    <label>
                        Custom model name
                        <input
                            value={settings.modelName ?? ""}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("modelName", e.target.value)}
                            style={{ width: "100%" }}
                        />
                    </label>
                )}

                <label>
                    Temperature ({settings.temperature})
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={settings.temperature}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("temperature", Number(e.target.value))}
                    />
                </label>

                <label>
                    Top P ({settings.topP})
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={settings.topP}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("topP", Number(e.target.value))}
                    />
                </label>

                <label>
                    Max tokens
                    <input
                        type="number"
                        value={settings.maxTokens}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("maxTokens", Number(e.target.value))}
                        style={{ width: "100%" }}
                    />
                </label>

                <label>
                    Response format
                    <select
                        value={settings.responseFormat}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => update("responseFormat", e.target.value as ResponseFormat)}
                        style={{ width: "100%" }}
                    >
                        <option value="text">Text</option>
                        <option value="json">JSON</option>
                        <option value="json-schema">JSON Schema</option>
                    </select>
                </label>

                <label>
                    Presence penalty ({settings.presencePenalty})
                    <input
                        type="number"
                        step={0.1}
                        min={-2}
                        max={2}
                        value={settings.presencePenalty}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("presencePenalty", Number(e.target.value))}
                    />
                </label>

                <label>
                    Frequency penalty ({settings.frequencyPenalty})
                    <input
                        type="number"
                        step={0.1}
                        min={-2}
                        max={2}
                        value={settings.frequencyPenalty}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("frequencyPenalty", Number(e.target.value))}
                    />
                </label>

                <label>
                    Language
                    <input value={settings.language} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("language", e.target.value)} />
                </label>

                <label>
                    Persona (system prompt / persona)
                    <input value={settings.persona} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("persona", e.target.value)} />
                </label>

                <label>
                    Safety filter
                    <input type="checkbox" checked={settings.safetyFilter} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("safetyFilter", e.target.checked)} />
                </label>

                <label>
                    Profanity filter
                    <input type="checkbox" checked={settings.profanityFilter} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("profanityFilter", e.target.checked)} />
                </label>

                <label>
                    Enable memory
                    <input type="checkbox" checked={settings.enableMemory} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("enableMemory", e.target.checked)} />
                </label>

                <label>
                    Memory window (messages)
                    <input type="number" value={settings.memoryWindow} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("memoryWindow", Number(e.target.value))} />
                </label>

                <label>
                    Enable streaming
                    <input type="checkbox" checked={settings.enableStreaming} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("enableStreaming", e.target.checked)} />
                </label>

                <label>
                    Deterministic / Low randomness
                    <input type="checkbox" checked={settings.deterministic} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("deterministic", e.target.checked)} />
                </label>

                <label>
                    Auto save to localStorage
                    <input type="checkbox" checked={settings.autoSave} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("autoSave", e.target.checked)} />
                </label>
            </div>

            <div style={{ marginTop: 18 }}>
                <button onClick={saveNow} style={{ marginRight: 8 }}>
                    Save
                </button>
                <button onClick={resetDefaults} style={{ marginRight: 8 }}>
                    Reset defaults
                </button>
                <button onClick={exportJSON} style={{ marginRight: 8 }}>
                    Export JSON
                </button>
            </div>

            <hr style={{ margin: "18px 0" }} />

            <h3>Detect settings from a use-case</h3>
            <p style={{ color: "#666" }}>Paste a short description of the AI use-case, and click Detect to get suggested settings based on heuristics.</p>
            <textarea
                value={sampleUseCase}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSampleUseCase(e.target.value)}
                placeholder="e.g. Build a code assistant that returns TypeScript functions. Or Summarize long meeting notes."
                style={{ width: "100%", minHeight: 120 }}
            />
            <div style={{ marginTop: 8 }}>
                <button onClick={applyDetected} style={{ marginRight: 8 }}>
                    Detect and Apply
                </button>
                <button
                    onClick={() => {
                        const suggested = detectSettingsFromUseCase(sampleUseCase);
                        alert("Detected suggestions:\n" + JSON.stringify(suggested, null, 2));
                    }}
                >
                    Preview Suggestions
                </button>
            </div>

            <hr style={{ margin: "18px 0" }} />

            <h3>Import / Export</h3>
            <p style={{ color: "#666" }}>You can paste JSON to import settings (partial allowed) or export the current settings.</p>
            <textarea
                value={importText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setImportText(e.target.value)}
                placeholder='Paste settings JSON here: {"temperature":0.2,"model":"gpt-4"}'
                style={{ width: "100%", minHeight: 100 }}
            />
            <div style={{ marginTop: 8 }}>
                <button onClick={importJSON} style={{ marginRight: 8 }}>
                    Import
                </button>
                <button
                    onClick={() => {
                        setImportText("");
                    }}
                    style={{ marginRight: 8 }}
                >
                    Clear
                </button>
            </div>
        </div>
    );
};

export default SettingPage;