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

const calculateRadiusBasedOnAffectedCases = (comunidad: string, data: resultado[]) => { 
  const entry = data.find((item) => item.name === comunidad);
  
  return entry ? affectedRadiusScale(entry.value) : 0;
};

const affectedCasesByCommunity = (comunidad: string) => {
  const entry = datos.find((item) => item.name === comunidad);

  return entry ? entry.value : 0;
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

  const updateChart = (covid: resultado[]) => {
    datos = covid;
    svg.selectAll("circle").remove();
    return svg
      .selectAll("circle")
      .data(latLongCommunities)
      .enter()
      .append("circle")
      .attr("class", "affected-marker")
      .attr("r", (d) => calculateRadiusBasedOnAffectedCases(d.name, covid))
      .attr("cx", (d) => aProjection([d.long, d.lat])[0])
      .attr("cy", (d) => aProjection([d.long, d.lat])[1])
      .on("mouseover", function (e: any, datum: any) {
        d3.select(this).attr("transform", "");
        const CCAAname = datum.name;
        const CCAAcases = affectedCasesByCommunity(CCAAname);
        console.log(CCAAname);
        console.log(CCAAcases);
        console.log(datum);
        console.log(e);
        const coords = { x: e.x, y: e.y };
        div.transition().duration(200).style("opacity", 0.9);
        div
          .html(`<span>${CCAAname}: ${CCAAcases}</span>`)
          .style("left", `${coords.x}px`)
          .style("top", `${coords.y - 28}px`);
      })
      .on("mouseout", function (datum) {
        d3.select(this).attr("transform", "");
        div.transition().duration(500).style("opacity", 0);
      });
  };
  
  document
    .getElementById("CovidBefore")
    .addEventListener("click", function () {
      updateChart(covidBefore);
  });
  
  document
    .getElementById("CovidAfter")
    .addEventListener("click", function () {
      updateChart(covidAfter);
  });
  