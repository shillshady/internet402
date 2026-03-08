(function () {
  'use strict';

  // Mock data

  const STATS = [
    { label: 'Total Payments', value: '12,847', change: '+14.2%', direction: 'up' },
    { label: 'Revenue', value: '342.8', unit: 'SOL', change: '+8.7%', direction: 'up' },
    { label: 'Active Endpoints', value: '6', change: '+1', direction: 'up' },
    { label: 'Unique Agents', value: '1,203', change: '+23.1%', direction: 'up' },
  ];

  const PAYMENTS = [
    { time: '2 min ago', agent: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', endpoint: '/api/v1/market-data', amount: 0.005, token: 'SOL', tx: '4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi2Kj3h7mDPgPz3fQ1jKv7R8P3vN5x1' },
    { time: '5 min ago', agent: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', endpoint: '/api/v1/sentiment', amount: 0.01, token: 'SOL', tx: '3nR8g4oGhP2eUv9MjQy5x8KdLwA9s2T7vN1hF6qBz4Ym2R5cW8dE3fG7jK9nP1qS4tU6wX' },
    { time: '8 min ago', agent: 'BPFLoaderUpgradeab1e11111111111111111111111', endpoint: '/api/v1/price-feed', amount: 0.002, token: 'SOL', tx: '5kH7mN2pQ4rS8tU1wX3yZ6aB9cD2eF5gH8jK1mN4pQ7rS0tU3wX6yZ9aB2cD5eF8gH1jK' },
    { time: '12 min ago', agent: 'AArPXm8JatJiuyEffuC1un2Sc835SULa4uQqDcaGpAjV', endpoint: '/api/v1/market-data', amount: 0.005, token: 'SOL', tx: '2mN5pQ8rS1tU4wX7yZ0aB3cD6eF9gH2jK5mN8pQ1rS4tU7wX0yZ3aB6cD9eF2gH5jK8mN' },
    { time: '15 min ago', agent: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', endpoint: '/api/v1/analytics', amount: 2.50, token: 'USDC', tx: '1pQ4rS7tU0wX3yZ6aB9cD2eF5gH8jK1mN4pQ7rS0tU3wX6yZ9aB2cD5eF8gH1jK4mN7pQ' },
    { time: '22 min ago', agent: 'So11111111111111111111111111111111111111112', endpoint: '/api/v1/price-feed', amount: 0.002, token: 'SOL', tx: '6rS0tU3wX6yZ9aB2cD5eF8gH1jK4mN7pQ0rS3tU6wX9yZ2aB5cD8eF1gH4jK7mN0pQ3rS' },
    { time: '28 min ago', agent: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', endpoint: '/api/v1/sentiment', amount: 0.01, token: 'SOL', tx: '8tU6wX9yZ2aB5cD8eF1gH4jK7mN0pQ3rS6tU9wX2yZ5aB8cD1eF4gH7jK0mN3pQ6rS9tU' },
    { time: '34 min ago', agent: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', endpoint: '/api/v1/tx-history', amount: 0.025, token: 'SOL', tx: '9wX2yZ5aB8cD1eF4gH7jK0mN3pQ6rS9tU2wX5yZ8aB1cD4eF7gH0jK3mN6pQ9rS2tU5wX' },
    { time: '41 min ago', agent: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', endpoint: '/api/v1/market-data', amount: 0.005, token: 'SOL', tx: '0yZ3aB6cD9eF2gH5jK8mN1pQ4rS7tU0wX3yZ6aB9cD2eF5gH8jK1mN4pQ7rS0tU3wX6yZ' },
    { time: '47 min ago', agent: 'AArPXm8JatJiuyEffuC1un2Sc835SULa4uQqDcaGpAjV', endpoint: '/api/v1/analytics', amount: 5.00, token: 'USDC', tx: '3aB6cD9eF2gH5jK8mN1pQ4rS7tU0wX3yZ6aB9cD2eF5gH8jK1mN4pQ7rS0tU3wX6yZ9aB' },
  ];

  const ENDPOINTS = [
    { path: '/api/v1/market-data', price: 0.005, token: 'SOL', hits: 4821, revenue: 24.105 },
    { path: '/api/v1/sentiment', price: 0.01, token: 'SOL', hits: 2934, revenue: 29.340 },
    { path: '/api/v1/price-feed', price: 0.002, token: 'SOL', hits: 3102, revenue: 6.204 },
    { path: '/api/v1/analytics', price: 2.50, token: 'USDC', hits: 892, revenue: 2230.00 },
    { path: '/api/v1/tx-history', price: 0.025, token: 'SOL', hits: 756, revenue: 18.900 },
    { path: '/api/v1/portfolio', price: 0.015, token: 'SOL', hits: 342, revenue: 5.130 },
  ];

  const REVENUE_7D = [
    { day: 'Mar 2', value: 38.4 },
    { day: 'Mar 3', value: 42.1 },
    { day: 'Mar 4', value: 35.7 },
    { day: 'Mar 5', value: 51.3 },
    { day: 'Mar 6', value: 48.9 },
    { day: 'Mar 7', value: 55.2 },
    { day: 'Mar 8', value: 61.8 },
  ];

  // Helpers

  function truncateAddress(addr) {
    return addr.slice(0, 4) + '...' + addr.slice(-4);
  }

  function truncateTx(tx) {
    return tx.slice(0, 8) + '...' + tx.slice(-4);
  }

  function formatSol(val) {
    return val.toFixed(3);
  }

  // Render stats

  function renderStats() {
    const container = document.getElementById('statsRow');
    container.innerHTML = STATS.map(function (s) {
      const unitHtml = s.unit ? '<span class="stat-unit">' + s.unit + '</span>' : '';
      return (
        '<div class="stat-card">' +
          '<div class="stat-label">' + s.label + '</div>' +
          '<div class="stat-value">' + s.value + unitHtml + '</div>' +
          '<div class="stat-change ' + s.direction + '">' +
            (s.direction === 'up' ? '&#9650;' : '&#9660;') + ' ' + s.change +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  // Render payments table

  function renderPayments() {
    var tbody = document.querySelector('#paymentsTable tbody');
    document.getElementById('paymentCount').textContent = PAYMENTS.length + ' recent';
    tbody.innerHTML = PAYMENTS.map(function (p) {
      var tokenClass = p.token === 'USDC' ? 'token-badge usdc' : 'token-badge';
      var solscanUrl = 'https://solscan.io/tx/' + p.tx;
      return (
        '<tr>' +
          '<td class="text-dim">' + p.time + '</td>' +
          '<td>' + truncateAddress(p.agent) + '</td>' +
          '<td class="text-accent">' + p.endpoint + '</td>' +
          '<td class="align-right">' + (p.token === 'SOL' ? formatSol(p.amount) : p.amount.toFixed(2)) + '</td>' +
          '<td><span class="' + tokenClass + '">' + p.token + '</span></td>' +
          '<td><a href="' + solscanUrl + '" target="_blank" rel="noopener" class="tx-link">' + truncateTx(p.tx) + '</a></td>' +
        '</tr>'
      );
    }).join('');
  }

  // Render endpoints table

  function renderEndpoints() {
    var tbody = document.querySelector('#endpointsTable tbody');
    document.getElementById('endpointCount').textContent = ENDPOINTS.length + ' active';
    tbody.innerHTML = ENDPOINTS.map(function (e) {
      var tokenClass = e.token === 'USDC' ? 'token-badge usdc' : 'token-badge';
      var revenueDisplay = e.token === 'USDC'
        ? e.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USDC'
        : formatSol(e.revenue) + ' SOL';
      var priceDisplay = e.token === 'USDC'
        ? e.price.toFixed(2)
        : formatSol(e.price);
      return (
        '<tr>' +
          '<td class="text-accent">' + e.path + '</td>' +
          '<td class="align-right">' + priceDisplay + '</td>' +
          '<td><span class="' + tokenClass + '">' + e.token + '</span></td>' +
          '<td class="align-right">' + e.hits.toLocaleString() + '</td>' +
          '<td class="align-right text-green">' + revenueDisplay + '</td>' +
        '</tr>'
      );
    }).join('');
  }

  // Render bar chart

  function renderChart() {
    var container = document.getElementById('revenueChart');
    var maxVal = Math.max.apply(null, REVENUE_7D.map(function (d) { return d.value; }));

    container.innerHTML = REVENUE_7D.map(function (d) {
      var heightPct = (d.value / maxVal) * 100;
      return (
        '<div class="chart-bar-group">' +
          '<div class="chart-bar-wrap">' +
            '<div class="chart-bar" style="height:' + heightPct + '%" data-value="' + d.value + ' SOL"></div>' +
          '</div>' +
          '<span class="chart-label">' + d.day + '</span>' +
        '</div>'
      );
    }).join('');
  }

  // Init

  renderStats();
  renderPayments();
  renderEndpoints();
  renderChart();
})();
