"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Search,
} from "lucide-react";
import {
  fetchProviderModels,
  saveAiProvider,
  type AiState,
} from "@/lib/actions/ai-provider";
import { PROVIDER_PRESETS, type ModelInfo, type ProviderKind } from "@/lib/ai/providers";
import { Button, Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";

export function AddProviderForm() {
  const [kind, setKind] = useState<ProviderKind>("openai");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selected, setSelected] = useState("");
  const [filter, setFilter] = useState("");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loading, startLoad] = useTransition();

  const [state, formAction] = useActionState<AiState, FormData>(
    saveAiProvider,
    {}
  );

  const preset = PROVIDER_PRESETS.find((p) => p.kind === kind)!;

  const pickKind = (k: ProviderKind) => {
    setKind(k);
    // Đổi nhà cung cấp thì danh sách model cũ không còn đúng nữa
    setModels([]);
    setSelected("");
    setFetchError(null);
    setBaseUrl("");
  };

  const loadModels = () => {
    setFetchError(null);
    startLoad(async () => {
      const res = await fetchProviderModels({
        kind,
        baseUrl: baseUrl || preset.baseUrl,
        apiKey,
      });
      if (res.error) {
        setFetchError(res.error);
        setModels([]);
        return;
      }
      setModels(res.models);
      setSelected(res.models[0]?.id ?? "");
    });
  };

  const shown = filter.trim()
    ? models.filter((m) =>
        m.id.toLowerCase().includes(filter.trim().toLowerCase())
      )
    : models;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="label" value={preset.label} />
      <input type="hidden" name="baseUrl" value={baseUrl || preset.baseUrl} />
      <input type="hidden" name="apiKey" value={apiKey} />
      <input type="hidden" name="model" value={selected} />

      {state.error && (
        <p role="alert" className="flex items-start gap-1.5 rounded-md bg-destructive-soft p-3 text-sm text-destructive-strong">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="flex items-start gap-1.5 rounded-md bg-success-soft p-3 text-sm text-success-strong">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {state.ok}
        </p>
      )}

      {/* --------------------------- Bước 1: chọn hãng -------------------- */}
      <fieldset>
        <legend className="mb-2.5 text-sm font-semibold">
          1. Chọn nhà cung cấp
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {PROVIDER_PRESETS.map((p) => (
            <button
              key={p.kind}
              type="button"
              onClick={() => pickKind(p.kind)}
              aria-pressed={kind === p.kind}
              className={cn(
                "cursor-pointer rounded-md border p-3 text-left transition-colors duration-200",
                kind === p.kind
                  ? "border-primary bg-primary-soft"
                  : "border-border-strong bg-card hover:bg-muted"
              )}
            >
              <span className="block font-semibold">{p.label}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {p.note}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      {/* --------------------------- Bước 2: nhập khoá -------------------- */}
      <fieldset>
        <legend className="mb-2.5 text-sm font-semibold">2. Nhập API key</legend>

        {preset.editableBaseUrl && (
          <div className="mb-3">
            <Label htmlFor="base-url">Địa chỉ endpoint</Label>
            <Input
              id="base-url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://may-chu-cua-ban/v1"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Không kèm dấu / ở cuối. Hệ thống sẽ gọi{" "}
              <code className="font-mono">/models</code> và{" "}
              <code className="font-mono">/chat/completions</code>.
            </p>
          </div>
        )}

        <Label htmlFor="api-key">API key</Label>
        <div className="flex gap-2">
          <Input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setModels([]);
              setSelected("");
            }}
            placeholder={preset.keyPrefix ? `${preset.keyPrefix}…` : "khoá của bạn"}
            autoComplete="off"
            spellCheck={false}
          />
          <Button
            type="button"
            variant="outline"
            onClick={loadModels}
            disabled={loading || apiKey.trim().length < 8}
            className="shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Đang lấy…
              </>
            ) : (
              <>
                <Search className="size-4" aria-hidden="true" />
                Lấy model
              </>
            )}
          </Button>
        </div>

        {preset.keyUrl && (
          <a
            href={preset.keyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Lấy khoá tại đây
            <ExternalLink className="size-3" aria-hidden="true" />
          </a>
        )}

        {fetchError && (
          <p
            role="alert"
            className="mt-3 flex items-start gap-1.5 rounded-md bg-destructive-soft p-3 text-sm text-destructive-strong"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {fetchError}
          </p>
        )}
      </fieldset>

      {/* --------------------------- Bước 3: chọn model ------------------- */}
      {models.length > 0 && (
        <fieldset>
          <legend className="mb-2.5 text-sm font-semibold">
            3. Chọn model{" "}
            <span className="font-normal text-muted-foreground">
              ({models.length} model khả dụng)
            </span>
          </legend>

          {models.length > 12 && (
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Lọc theo tên model…"
              className="mb-2"
              aria-label="Lọc danh sách model"
            />
          )}

          <div className="max-h-72 space-y-1.5 overflow-y-auto rounded-md border border-border p-2">
            {shown.map((m) => (
              <label
                key={m.id}
                className={cn(
                  "flex cursor-pointer items-start gap-2.5 rounded-md p-2.5 transition-colors duration-200",
                  selected === m.id ? "bg-primary-soft" : "hover:bg-muted"
                )}
              >
                <input
                  type="radio"
                  name="model-pick"
                  checked={selected === m.id}
                  onChange={() => setSelected(m.id)}
                  className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[var(--color-primary)]"
                />
                <span className="min-w-0">
                  <span className="block font-mono text-sm font-semibold break-all">
                    {m.id}
                  </span>
                  {m.note && (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {m.note}
                    </span>
                  )}
                </span>
              </label>
            ))}
            {shown.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">
                Không có model nào khớp bộ lọc.
              </p>
            )}
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            Nên chọn model có khả năng suy luận tốt. Model quá nhỏ thường trả về
            JSON sai cấu trúc hoặc đọc nhầm đáp án.
          </p>
        </fieldset>
      )}

      <SaveButton disabled={!selected} />
    </form>
  );
}

function SaveButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={disabled || pending}>
      {pending ? "Đang lưu…" : "Lưu cấu hình"}
    </Button>
  );
}
