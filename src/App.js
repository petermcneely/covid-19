import React from 'react';
import csv from 'csvtojson';
import request from 'request';
import './App.css';
import CanvasJSReact from './canvasjs.react';

const url = 'https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv';
const newYorkCity = 'New York City';
var CanvasJSChart = CanvasJSReact.CanvasJSChart;

const getDifference = (arr, index, key) => {
  return index === 0
  ? arr[0][key]
  : arr[index][key] - arr[index-1][key];
}

const getPercentageIncrease = (arr, index, key) =>
  (index === 0 || parseInt(arr[index - 1][key]) === 0)
  ? 0
  : (getDifference(arr, index, key) * 1.0) / arr[index - 1][key] * 100;

const getJson = json => {
  const nycCovid = json
    .filter(j => j.county === newYorkCity);

  const getUTCDate = date => new Date(
    new Date(date).getUTCFullYear(),
    new Date(date).getUTCMonth(),
    new Date(date).getUTCDate());

  const payloadForChart = nycCovid
    .map((j, index) => ({
      date: getUTCDate(j.date),
      cases: parseInt(j.cases),
      deaths: parseInt(j.deaths),
      added: {
        cases: getPercentageIncrease(nycCovid, index, "cases"),
        deaths: getPercentageIncrease(nycCovid, index, "deaths")
      }
    }));
  return payloadForChart;
}

class App extends React.Component {	
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      isLoaded: false,
      items: []
    }
  }

  getCasesOptions = (items) => ({
    animationEnabled: true,
    exportEnabled: true,
    theme: "light2",
    title:{
      text: "COVID-19 Cases in New York City"
    },
    axisY: [
      {
        title: "Cases",
      },
    ],
    axisY2: [
      {
        title: "% Increase of Cases",
      }
    ],
    axisX: {
      title: "Date",
      valueFormatString: "DD-MMM",
    },
    data: [
      {
        type: "column",
        toolTipContent: "Date {x}: {y} cases",
        dataPoints: items.map(i => ({x: i.date, y: i.cases})),
      },
      {
        type: "spline",
        toolTipContent: "Date {x}: {y}% case increase",
        axisYType: "secondary",
        dataPoints: items.map(i => ({x: i.date, y: i.added.cases})),
      },
    ]
  });

  getDeathsOptions = (items) => ({
    animationEnabled: true,
    exportEnabled: true,
    theme: "light2",
    title:{
      text: "COVID-19 Deaths in New York City"
    },
    axisY: [
      {
        title: "Deaths",
      },
    ],
    axisY2: [
      {
        title: "% Increase of Deaths",
      }
    ],
    axisX: {
      title: "Date",
      valueFormatString: "DD-MMM",
    },
    data: [
      {
        type: "column",
        toolTipContent: "Date {x}: {y} deaths",
        dataPoints: items.map(i => ({x: i.date, y: i.deaths})),
      },
      {
        type: "spline",
        toolTipContent: "Date {x}: {y}% death increase",
        axisYType: "secondary",
        dataPoints: items.map(i => ({x: i.date, y: i.added.deaths})),
      }
    ]
  })

  render() {
    const { error, isLoaded, items } = this.state;
    console.log(items);
    if (error) {
      return <div>Error: {error.message}</div>
    }
    else if (!isLoaded) {
      return <div>Loading...</div>
    }
    else {
      return (
      <div>
        <CanvasJSChart options = {this.getCasesOptions(items)}
          onRef={ref => this.chart = ref}
        />
        <CanvasJSChart options = {this.getDeathsOptions(items)}
          onRef={ref => this.chart = ref}
        />
      </div>
      );
    }
  }

  componentDidMount() {
    this.updateChart();
  }

  updateChart() {
    csv()
      .fromStream(request.get(url))
      .then(
        json => {
          this.setState({
            isLoaded: true,
            items: getJson(json),
          });
          this.chart.render();
        },
        error => {
          this.setState({
            isLoaded: true,
            error
          });
        }
      );
  }
}

export default App;
