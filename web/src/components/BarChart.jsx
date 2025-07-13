// src/components/BarChart.jsx
import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const CustomBarChart = ({ data, dataKey, xKey }) => (
  <ResponsiveContainer width="100%" height={250}>
    <BarChart data={data}>
      <XAxis dataKey={xKey} />
      <YAxis />
      <Tooltip />
      <Bar dataKey={dataKey} fill="#8000ff" />
    </BarChart>
  </ResponsiveContainer>
);

export default CustomBarChart;

// changed file name to BarChart.jsx

