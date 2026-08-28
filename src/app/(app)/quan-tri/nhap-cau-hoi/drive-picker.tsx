"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, FolderOpen, Loader2 } from "lucide-react";
import { importFromDrive } from "@/lib/actions/import";
import { Button } from "@/components/ui";

/**
 * Chọn file từ Google Drive.
 *
 * Chỉ xin scope `drive.file` — Google chỉ cấp quyền đọc ĐÚNG file người dùng
 * chọn trong hộp thoại, không phải toàn bộ Drive. Access token sống trong bộ
 * nhớ trang, gửi kèm đúng một lần cho lần nhập rồi bỏ; không lưu database,
 * không lưu localStorage.
 */
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

const MIME_TYPES = [
  "application/vnd.google-apps.document",
  "application/vnd.google-apps.spreadsheet",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/csv",
].join(",");

/* Kiểu tối thiểu cho hai thư viện của Google — chỉ khai báo phần thực sự dùng. */
interface TokenClient {
  requestAccessToken: (opts?: { prompt?: string }) => void;
}
interface GoogleGlobal {
  accounts: {
    oauth2: {
      initTokenClient: (cfg: {
        client_id: string;
        scope: string;
        callback: (res: { access_token?: string; error?: string }) => void;
      }) => TokenClient;
    };
  };
  picker: Record<string, unknown>;
}
declare global {
  interface Window {
    google?: GoogleGlobal;
    gapi?: { load: (name: string, cb: () => void) => void };
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Không tải được ${src}`));
    document.head.appendChild(s);
  });
}

export function DrivePicker({
  clientId,
  apiKey,
}: {
  clientId: string;
  apiKey: string;
}) {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fields = useRef<Record<string, HTMLInputElement | null>>({});

  const configured = Boolean(clientId && apiKey);

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    Promise.all([
      loadScript("https://accounts.google.com/gsi/client"),
      loadScript("https://apis.google.com/js/api.js"),
    ])
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Không tải được thư viện của Google. Kiểm tra kết nối mạng.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [configured]);

  const openPicker = useCallback(
    (token: string) => {
      window.gapi?.load("picker", () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const picker = (window.google as any).picker;
        const view = new picker.DocsView()
          .setIncludeFolders(true)
          .setMimeTypes(MIME_TYPES);

        const built = new picker.PickerBuilder()
          .setOAuthToken(token)
          .setDeveloperKey(apiKey)
          .setTitle("Chọn file đề thi từ Drive")
          .addView(view)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .setCallback((data: any) => {
            if (data.action !== picker.Action.PICKED) {
              if (data.action === picker.Action.CANCEL) setBusy(false);
              return;
            }
            const doc = data.docs?.[0];
            if (!doc) {
              setBusy(false);
              return;
            }
            fields.current.fileId!.value = doc.id;
            fields.current.fileName!.value = doc.name ?? "file-tu-drive";
            fields.current.mimeType!.value = doc.mimeType ?? "";
            fields.current.accessToken!.value = token;
            formRef.current?.requestSubmit();
          })
          .build();

        built.setVisible(true);
      });
    },
    [apiKey]
  );

  const connect = useCallback(() => {
    setError(null);
    setBusy(true);
    try {
      const tokenClient = window.google!.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: DRIVE_SCOPE,
        callback: (res) => {
          if (res.error || !res.access_token) {
            setError("Bạn đã từ chối cấp quyền, hoặc phiên Google đã hết hạn.");
            setBusy(false);
            return;
          }
          openPicker(res.access_token);
        },
      });
      tokenClient.requestAccessToken();
    } catch {
      setError("Không mở được cửa sổ đăng nhập Google.");
      setBusy(false);
    }
  }, [clientId, openPicker]);

  if (!configured) {
    return (
      <div className="rounded-md border border-dashed border-border-strong bg-muted p-4">
        <p className="font-semibold">Chưa cấu hình Google Drive</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Cần khai báo{" "}
          <code className="font-mono">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> và{" "}
          <code className="font-mono">NEXT_PUBLIC_GOOGLE_API_KEY</code> trong{" "}
          <code className="font-mono">.env.local</code>. Hướng dẫn lấy hai giá
          trị này nằm trong README.
        </p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-md border-l-4 border-destructive bg-destructive-soft p-3 text-sm text-destructive-strong"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <Button onClick={connect} disabled={!ready || busy} variant="outline">
        {busy ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Đang mở Drive…
          </>
        ) : (
          <>
            <FolderOpen className="size-4" aria-hidden="true" />
            {ready ? "Chọn file từ Drive" : "Đang tải…"}
          </>
        )}
      </Button>

      <form ref={formRef} action={importFromDrive} className="hidden">
        {(["fileId", "fileName", "mimeType", "accessToken"] as const).map((n) => (
          <input
            key={n}
            type="hidden"
            name={n}
            ref={(el) => {
              fields.current[n] = el;
            }}
          />
        ))}
      </form>
    </>
  );
}
