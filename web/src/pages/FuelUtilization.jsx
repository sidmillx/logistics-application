import React, { useEffect, useState } from "react";
import Card from "../components/Card";
import CustomBarChart from "../components/BarChart";
import Table from "../components/Table";
import FilterButtons from "../components/FilterButtons";
import fuelIcon from "../assets/icons/fuel.svg";
import tuneIcon from "../assets/icons/tune.svg";
import chartIcon from "../assets/icons/chart.svg";

const FuelUtilization = () => {
  const [filter, setFilter] = useState("litres");
  const [summary, setSummary] = useState({});
  const [chartData, setChartData] = useState([]);
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      const [sumRes, chartRes, tableRes] = await Promise.all([
        fetch("http://localhost:5000/api/admin/fuel-utilization/summary"),
        fetch(`http://localhost:5000/api/admin/fuel-utilization/chart?groupBy=${filter}`),
        fetch("http://localhost:5000/api/admin/fuel-utilization/table"),
      ]);

      setSummary(await sumRes.json());
      setChartData(await chartRes.json());
      setTableData(await tableRes.json());
    };
    fetchAll();
  }, [filter]);

  const columns = [
    { key: "vehicleReg", title: "Vehicle" },
    { key: "entityName", title: "Entity" },
    { key: "totalLitresUsed", title: "Total Litres Used" },
    { key: "avgKmPerLitre", title: "Average Km/l" },
    { key: "fuelCost", title: "Fuel Cost" },
    { key: "actions", title: "Actions", render: row => (
      <Link to={`/vehicles/${row.id}/fuel`}>
        <button className="link-button">View Fuel Logs</button>
      </Link>
    )},
  ];

  return (
    <div>
      <h1>Fuel Utilization</h1>
      <div className="cards">
        <Card title="Total Litres Consumed" value={`${summary.totalLitres} L`} icon={<img src={fuelIcon} />} />
        <Card title="AVG Litres / Trip" value={`${summary.avgLitresPerTrip} L`} icon={<img src={tuneIcon} />} />
        <Card title="Total Fuel Cost" value={`E${summary.totalCost}`} icon={<img src={chartIcon} />} />
        <Card title="AVG Cost / Km" value={`E${summary.avgCostPerKm}`} icon={<img src={chartIcon} />} />
      </div>

      <div className="charts">
        <section>
          <h3>Fuel over Time</h3>
          <CustomBarChart data={chartData} dataKey={filter} xKey="month" />
          <FilterButtons options={[
            { label: "By litres", value: "litres" },
            { label: "By hours", value: "hours" },
          ]} active={filter} onChange={setFilter} />
        </section>
        <section>
          <h3>Trips by Entity</h3>
          <CustomBarChart data={chartData /* or separate endpoint */} dataKey={filter} xKey="entityName" />
          <FilterButtons
            options={[
              { label: "By litres", value: "litres" },
              { label: "By hours", value: "hours" },
            ]}
            active={filter}
            onChange={setFilter}
          />

        </section>
      </div>

      <div className="table-container">
        <h3>Vehicle Fuel Stats</h3>
        <Table columns={columns} data={tableData} rowsPerPage={5} />
      </div>
    </div>
  );
};

export default FuelUtilization;
