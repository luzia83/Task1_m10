import * as d3 from "d3";
import * as topojson from "topojson-client";
const spainjson = require("./spain.json");
const d3Composite = require("d3-composite-projections");
import { latLongCommunities } from "./communities";
import { covidAfter, covidBefore, resultado } from "./stats";

const maxAffected1 = covidAfter.reduce(
  (max, item) => (item.value > max ? item.value : max),
  0
);

const maxAffected2 = covidBefore.reduce(
  (max, item) => (item.value > max ? item.value : max),
  0
);

const maxAffected = Math.max(maxAffected1, maxAffected2);

let datos = covidAfter;

const affectedRadiusScale = d3
  .scaleThreshold<number, number>()
  .domain([10,50,100,500,1000,5000])
  .range([5,10,30,50,70,100]);

const calculateRadiusBasedOnAffectedCases = (comunidad: string) => { 
  const entry = datos.find((item) => item.name === comunidad);
  var max = datos.reduce((max, item) => (item.value > max ? item.value: max), 0);
  return entry ? affectedRadiusScale(entry.value) : 0;
};

const aProjection = d3Composite
  .geoConicConformalSpain() 
  .scale(3300)
  .translate([500, 400]);

const geoPath = d3.geoPath().projection(aProjection);
const geojson = topojson.feature(spainjson, spainjson.objects.ESP_adm1);

const svg = d3
  .select("body")
  .append("svg")
  .attr("width", 1024)
  .attr("height", 800)
  .attr("style", "background-color: #FBFAF0");

const div = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

svg
  .selectAll("path")
  .data(geojson["features"])
  .enter()
  .append("path")
  .attr("class", "country")
  .attr("d", geoPath as any);

svg
  .selectAll("circle")
  .data(latLongCommunities)
  .enter()
  .append("circle")
  .attr("class", "affected-marker")
  .attr("r", (d) => calculateRadiusBasedOnAffectedCases(d.name))
  .attr("cx", (d) => aProjection([d.long, d.lat])[0])
  .attr("cy", (d) => aProjection([d.long, d.lat])[1]);

  const updateChart = (covid: resultado[]) => {
    datos = covid;
    svg
      .selectAll("circle")
      .data(latLongCommunities)
      .transition()
      .duration(800)
      .attr("r", (d) => {
        return calculateRadiusBasedOnAffectedCases(d.name);
      });
  };
  
  document
    .getElementById("CovidBefore")
    .addEventListener("click", function () {
      console.log(covidBefore);
      updateChart(covidBefore);
  });
  
  document
    .getElementById("CovidAfter")
    .addEventListener("click", function () {
      console.log(covidAfter);
      updateChart(covidAfter);
  });
  