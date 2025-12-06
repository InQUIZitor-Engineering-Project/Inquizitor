import { Segmented } from "../primitives";

export interface SegmentedToggleOption<T extends string | number> {
  label: string;
  value: T;
}

interface SegmentedToggleProps<T extends string | number> {
  options: SegmentedToggleOption<T>[];
  value: T;
  onChange: (v: T) => void;
  activeClassName?: string;
}

const SegmentedToggle = <T extends string | number>({
  options,
  value,
  onChange,
  activeClassName = "is-active",
}: SegmentedToggleProps<T>) => {
  return (
    <Segmented>
      {options.map((opt) => (
        <button
          key={opt.value}
          className={value === opt.value ? activeClassName : ""}
          onClick={() => onChange(opt.value)}
          type="button"
        >
          {opt.label}
        </button>
      ))}
    </Segmented>
  );
};

export default SegmentedToggle;
