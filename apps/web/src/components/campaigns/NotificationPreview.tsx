"use client";

import { memo } from "react";
import { Apple, Bell, Monitor, Smartphone } from "lucide-react";
import { PreviewOS } from "./campaignUtils";

interface NotificationPreviewProps {
  previewOS: PreviewOS;
  onSelectOS: (os: PreviewOS) => void;
  title: string;
  message: string;
  iconUrl: string;
  bannerUrl: string;
  domain: string;
  siteName: string;
}

function hideOnError(e: React.SyntheticEvent<HTMLImageElement>) {
  (e.target as HTMLImageElement).style.display = "none";
}

function NotificationPreviewBase({
  previewOS,
  onSelectOS,
  title,
  message,
  iconUrl,
  bannerUrl,
  domain,
  siteName,
}: NotificationPreviewProps) {
  return (
    <section className="ui-section preview-shell">
      <div className="preview-selector">
        <button
          type="button"
          className={`preview-button${previewOS === "mac" ? " active" : ""}`}
          onClick={() => onSelectOS("mac")}
          title="macOS"
        >
          <Apple size={16} />
        </button>
        <button
          type="button"
          className={`preview-button${previewOS === "windows" ? " active" : ""}`}
          onClick={() => onSelectOS("windows")}
          title="Windows"
        >
          <Monitor size={16} />
        </button>
        <button
          type="button"
          className={`preview-button${previewOS === "android" ? " active" : ""}`}
          onClick={() => onSelectOS("android")}
          title="Android"
        >
          <Smartphone size={16} />
        </button>
      </div>

      <div className="preview-stage preview-stage-mock">
        {previewOS === "mac" ? (
          <div className="notif-preview notif-preview-mac">
            <div className="notif-preview-icon-shell">
              <img
                src={iconUrl}
                alt=""
                className="notif-preview-icon"
                onError={hideOnError}
              />
            </div>
            <div className="notif-preview-body">
              <div className="notif-preview-title">{title}</div>
              <div className="notif-preview-msg">{message}</div>
              <div className="notif-preview-domain">Google Chrome</div>
            </div>
          </div>
        ) : null}

        {previewOS === "windows" ? (
          <div className="notif-preview windows">
            {bannerUrl ? (
              <img
                src={bannerUrl}
                alt=""
                className="notif-preview-banner notif-preview-banner-hero"
                onError={hideOnError}
              />
            ) : null}
            <div className="notif-preview-domain">Google Chrome • {domain}</div>
            <div className="notif-preview-row">
              <div className="notif-preview-body">
                <div className="notif-preview-title">{title}</div>
                <div className="notif-preview-msg">{message}</div>
              </div>
              <div className="notif-preview-icon-shell windows">
                <img
                  src={iconUrl}
                  alt=""
                  className="notif-preview-icon"
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.style.display = "none";
                    el.parentElement?.classList.add("notif-preview-icon-fallback");
                  }}
                />
              </div>
            </div>
          </div>
        ) : null}

        {previewOS === "android" ? (
          <div className="notif-preview android">
            <div className="notif-preview-android-top">
              <div className="notif-preview-android-app">
                <Bell size={10} />
              </div>
              <span>{siteName || "Seu site"}</span>
              <span className="notif-preview-android-time">agora</span>
            </div>
            <div className="notif-preview-title">{title}</div>
            <div className="notif-preview-msg">{message}</div>
            {bannerUrl ? (
              <img
                src={bannerUrl}
                alt=""
                className="notif-preview-banner"
                onError={hideOnError}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export const NotificationPreview = memo(NotificationPreviewBase);
