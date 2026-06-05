"use client";

type SettingToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
};

export function SettingToggle({ checked, onChange, label, description, disabled }: SettingToggleProps) {
  return (
    <label className={`ui-setting-item${disabled ? " is-disabled" : ""}`}>
      <span className="ui-setting-copy">
        <span className="ui-setting-label">{label}</span>
        {description ? <span className="ui-setting-desc">{description}</span> : null}
      </span>
      <input
        type="checkbox"
        className="ui-setting-input"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="ui-toggle" aria-hidden="true">
        <span className="ui-toggle-thumb" />
      </span>
    </label>
  );
}

export default SettingToggle;
