"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Check, Loader2, RefreshCw, Trash2 } from "lucide-react";
import {
  activateAiProvider,
  deleteAiProvider,
  refetchModelsForSaved,
  updateProviderModel,
} from "@/lib/actions/ai-provider";
import { presetOf, type ModelInfo } from "@/lib/ai/providers";
import { Badge, Button } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import type { ProviderRow } from "./page";

export function ProviderList({ providers }: { providers: ProviderRow[] }) {
  if (providers.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border-strong p-6 text-center text-sm text-muted-foreground">
        Chưa có nhà cung cấp nào. Thêm ở phần bên dưới để bật chức năng đọc file
        Word bằng AI.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {providers.map((p) => (
        <li key={p.id}>
          <ProviderCard provider={p} />
        </li>
      ))}
    </ul>
  );
}

function ProviderCard({ provider }: { provider: ProviderRow }) {
  const [models, setModels] = useState<ModelInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, startLoad] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const preset = presetOf(provider.kind);

  const loadModels = () => {
    setError(null);
    startLoad(async () => {
      const res = await refetchModelsForSaved(provider.id);
      if (res.error) {
        setError(res.error);
        return;
      }
      setModels(res.models);
    });
  };

  return (
    <div
      className={
        provider.is_active
          ? "rounded-lg border-2 border-primary bg-primary-soft p-4"
          : "rounded-lg border border-border bg-card p-4"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="font-bold">{preset.label}</span>
            {provider.is_active && <Badge tone="primary">Đang dùng</Badge>}
          </div>
          <p className="font-mono text-sm">
            {provider.model ?? (
              <span className="text-destructive-strong">chưa chọn model</span>
            )}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Khoá ••••{provider.api_key_hint} · thêm ngày{" "}
            {formatDate(provider.created_at)}
          </p>
          {provider.kind === "custom" && (
            <p className="mt-0.5 font-mono text-xs break-all text-muted-foreground">
              {provider.base_url}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {!provider.is_active && (
            <form action={activateAiProvider}>
              <input type="hidden" name="providerId" value={provider.id} />
              <Button type="submit" size="sm">
                <Check className="size-4" aria-hidden="true" />
                Dùng cái này
              </Button>
            </form>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={loadModels}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="size-4" aria-hidden="true" />
            )}
            Đổi model
          </Button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 flex items-start gap-1.5 rounded-md bg-destructive-soft p-3 text-sm text-destructive-strong"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      {models && (
        <form action={updateProviderModel} className="mt-3">
          <input type="hidden" name="providerId" value={provider.id} />
          <label
            htmlFor={`model-${provider.id}`}
            className="mb-1.5 block text-sm font-semibold"
          >
            Chọn model mới ({models.length} khả dụng)
          </label>
          <div className="flex gap-2">
            <select
              id={`model-${provider.id}`}
              name="model"
              defaultValue={provider.model ?? models[0]?.id}
              className="h-11 min-w-0 flex-1 cursor-pointer rounded-md border border-border-strong bg-card px-3 font-mono text-sm"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id}
                  {m.note ? ` — ${m.note}` : ""}
                </option>
              ))}
            </select>
            <Button type="submit" className="shrink-0">
              Lưu
            </Button>
          </div>
        </form>
      )}

      {/* Xoá là thao tác không hoàn tác được nên hỏi lại trước */}
      <div className="mt-3 border-t border-border pt-3">
        {confirmDelete ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-destructive-strong">
              Xoá cấu hình này? Khoá đã lưu sẽ mất, phải nhập lại.
            </span>
            <form action={deleteAiProvider} className="flex gap-2">
              <input type="hidden" name="providerId" value={provider.id} />
              <Button type="submit" size="sm" variant="danger">
                Xoá
              </Button>
            </form>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="cursor-pointer text-sm font-semibold text-muted-foreground hover:underline"
            >
              Huỷ
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-destructive-strong hover:underline"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            Xoá cấu hình
          </button>
        )}
      </div>
    </div>
  );
}
