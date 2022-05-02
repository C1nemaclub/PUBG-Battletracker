console.log('Hello World');
let playerData = JSON.parse('<%- JSON.stringify(user) %>');
console.log(playerData);

const ctx = document.getElementById('myChart').getContext('2d');
const myChart = new Chart(ctx, {
  type: 'doughnut',
  data: {
    labels: ['Kills', 'Assists', 'Knocks'],
    datasets: [
      {
        label:
          'Combined Land-Surface Air and Sea-Surface Water Temperature in °C',
        data: [10, 14, 24],
        backgroundColor: [
          'rgba(255, 25, 25, 0.8)',
          'rgba(50, 50, 235, 0.8)',
          'rgba(100, 255, 86, 0.8)',
          'rgba(255, 212, 0, .8)',
          'rgba(100, 212, 0, .8)',
          'rgba(255, 212, 255, .8)',
        ],
        borderColor: 'rgba(255, 255, 255, 1)',
        borderWidth: 1,
      },
    ],
  },
});

const ctxx = document.getElementById('pChart').getContext('2d');
const myChartx = new Chart(ctxx, {
  type: 'line',
  data: {
    labels: ['this', 'that', 'thus', 'these'],
    datasets: [
      {
        label: 'Amount of kills in recent games',
        data: [5, 2, 10, 7],

        backgroundColor: [
          'rgba(255, 25, 25, 0.5)',
          'rgba(50, 50, 235, 0.5)',
          'rgba(100, 255, 86, 0.5)',
          'rgba(240, 240, 30, 0.5)',
        ],
        borderColor: 'rgba(255, 255, 255, 1)',
        borderWidth: 1,
        fill: true,
        fillColor: 'rgba(0, 212, 0, 0.7)',
      },
    ],
  },
});
