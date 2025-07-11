// src/components/FilterButtons.jsx
import React from "react";
import "./FilterButtons.css";

const FilterButtons = ({ options, active, onChange }) => (
  <div className="filter-buttons">
    {options.map(opt => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        className={active === opt.value ? "active" : ""}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

export default FilterButtons;
